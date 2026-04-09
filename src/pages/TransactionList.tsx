import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Search, Edit, Trash2, FileDown, CheckCircle, Circle, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EditTransactionDialog from "@/components/EditTransactionDialog";
import { Label } from "@/components/ui/label";

const TransactionList = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [printFilter, setPrintFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // State for Edit
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // State for Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal mengambil data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;

      toast.success("Data berhasil dihapus");
      fetchTransactions();
    } catch (error: any) {
      toast.error("Gagal menghapus data: " + error.message);
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handlePrint = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ is_printed: true })
        .eq("id", transactionId);

      if (error) throw error;

      toast.success("Transaksi telah ditandai sebagai sudah di-print");
      fetchTransactions();
    } catch (error: any) {
      toast.error("Gagal menandai transaksi: " + error.message);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      t.school_name.toLowerCase().includes(searchLower) ||
      t.po_number.toLowerCase().includes(searchLower) ||
      t.code.toLowerCase().includes(searchLower) ||
      (t.nama_rekanan && t.nama_rekanan.toLowerCase().includes(searchLower)) ||
      (t.bank_name && t.bank_name.toLowerCase().includes(searchLower)) ||
      (t.account_owner && t.account_owner.toLowerCase().includes(searchLower));
    
    const matchesPrintFilter = 
      printFilter === "all" ? true :
      printFilter === "printed" ? t.is_printed === true :
      t.is_printed === false || t.is_printed === null;

    // Date filtering
    const transactionDate = new Date(t.created_at).toISOString().split('T')[0];
    const matchesStartDate = startDate ? transactionDate >= startDate : true;
    const matchesEndDate = endDate ? transactionDate <= endDate : true;

    return matchesSearch && matchesPrintFilter && matchesStartDate && matchesEndDate;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportToExcel = () => {
    if (filteredTransactions.length === 0) {
      toast.error("Tidak ada data untuk ekspor");
      return;
    }

    const ws_data = [
      ["Tanggal", "Sekolah / Cabang", "No PO / SIPLAH", "Produk", "Nominal", "% BM", "Status", "Kode Transaksi", "Rekanan", "Nama Rekanan", "Bank", "No Rekening", "Pemilik Rekening", "Status Print"]
    ];

    filteredTransactions.forEach(t => {
      ws_data.push([
        new Date(t.created_at).toLocaleDateString("id-ID"),
        `${t.school_name} (${t.cabang})`,
        `${t.po_number} (${t.nama_siplah})`,
        t.produk,
        formatCurrency(t.transaction_amount),
        `${t.bm_percentage}%`,
        t.status,
        t.code,
        t.rekanan_type,
        t.rekanan_type === "REKANAN" ? t.nama_rekanan : "NON REKANAN",
        t.bank_name || "-",
        t.account_number || "-",
        t.account_owner || "-",
        t.is_printed ? "SUDAH PRINT" : "BELUM PRINT"
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transaksi.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (t: any) => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text("BUKTI TRANSAKSI - GRAND LINE", 14, 15);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Kode: ${t.code}`, 14, 22);
    doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, 14, 27);
    
    doc.setDrawColor(200);
    doc.line(14, 32, 196, 32);
    
    const tableData = [
      ["Tanggal Input", new Date(t.created_at).toLocaleDateString("id-ID")],
      ["Nama Sekolah", t.school_name],
      ["Cabang", t.cabang || "-"],
      ["Nomor PO", t.po_number],
      ["Platform SIPLAH", t.nama_siplah],
      ["Jenis Produk", t.produk],
      ["Nominal Transaksi", formatCurrency(t.transaction_amount)],
      ["Persentase BM", `${t.bm_percentage}%`],
      ["Status Transaksi", t.status],
      ["Tipe Rekanan", t.rekanan_type],
      ["Nama Rekanan", t.rekanan_type === "REKANAN" ? t.nama_rekanan : "NON REKANAN"],
      ["", ""],
      ["INFORMASI PEMBAYARAN BM", ""],
      ["Nama Bank", t.bank_name || "-"],
      ["Nomor Rekening", t.account_number || "-"],
      ["Pemilik Rekening", t.account_owner || "-"],
    ];

    autoTable(doc, {
      startY: 35,
      body: tableData,
      theme: 'plain',
      styles: { 
        fontSize: 10, 
        cellPadding: 3,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, textColor: [30, 41, 59] },
        1: { cellWidth: 'auto' }
      },
      didParseCell: function(data) {
        if (data.row.raw[0] === "INFORMASI PEMBAYARAN BM") {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [30, 41, 59];
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Dokumen ini dihasilkan secara otomatis oleh Grand Line Manager.", 14, finalY + 10);

    doc.save(`transaksi-${t.code}.pdf`);
    toast.success("PDF berhasil diunduh");
  };

  const resetDateFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <Card className="w-full shadow-lg border-t-4 border-t-primary">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Daftar Transaksi</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="text-blue-500 hover:text-blue-700"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export ke Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari Sekolah, No PO, Kode, Rekanan, atau Bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={printFilter} onValueChange={setPrintFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter Print" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="printed">Sudah Print</SelectItem>
                  <SelectItem value="not_printed">Belum Print</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-xl border border-primary/10">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Dari Tanggal</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full md:w-auto bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Sampai Tanggal</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full md:w-auto bg-white"
              />
            </div>
            {(startDate || endDate) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetDateFilters}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Reset Filter
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Tanggal</TableHead>
                <TableHead className="font-bold">Sekolah / Cabang</TableHead>
                <TableHead className="font-bold">No PO / SIPLAH</TableHead>
                <TableHead className="font-bold">Produk</TableHead>
                <TableHead className="font-bold">Nominal</TableHead>
                <TableHead className="font-bold text-center">% BM</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Kode Transaksi</TableHead>
                <TableHead className="font-bold">Rekanan</TableHead>
                <TableHead className="font-bold">Bank / Rekening</TableHead>
                <TableHead className="font-bold text-center">Print</TableHead>
                <TableHead className="font-bold text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Memuat data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                    Tidak ada data ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((t) => (
                  <TableRow
                    key={t.id}
                    className={cn(
                      "transition-colors",
                      t.status === "DIBATALKAN" ? "bg-pink-50 hover:bg-pink-100" : "hover:bg-muted/30"
                    )}
                  >
                    <TableCell className="whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{t.school_name}</div>
                      <div className="text-xs text-muted-foreground">{t.cabang}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{t.po_number}</div>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {t.nama_siplah}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.produk === "BOOK" ? "default" : "secondary"}>
                        {t.produk}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatCurrency(t.transaction_amount)}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {t.bm_percentage}%
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.status === "DIBATALKAN" ? "destructive" : "outline"}
                        className={cn(
                          t.status === "DIAJUKAN" && "bg-green-50 text-green-700 border-green-200"
                        )}
                      >
                        {t.status || "DIAJUKAN"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono border">
                        {t.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{t.rekanan_type}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.rekanan_type === "REKANAN" ? t.nama_rekanan : "NON REKANAN"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{t.bank_name || "-"}</div>
                      <div className="text-xs text-muted-foreground">{t.account_number || "-"}</div>
                      <div className="text-[10px] italic">{t.account_owner || "-"}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {t.is_printed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handlePrint(t.id)}
                            title="Tandai sebagai sudah di-print"
                          >
                            <Circle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          onClick={() => downloadPDF(t)}
                          title="Download PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                        {!t.is_printed && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setEditingTransaction(t);
                                setIsEditDialogOpen(true);
                              }}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setDeletingId(t.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <EditTransactionDialog
        transaction={editingTransaction}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={fetchTransactions}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data transaksi ini akan dihapus secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default TransactionList;