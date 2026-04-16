"use client";

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
import { Loader2, RefreshCw, Search, Edit, Trash2, FileDown, CheckCircle, Circle, Filter, X, Calendar, Paperclip, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import AttachmentDialog from "@/components/AttachmentDialog";

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

  // State for Attachment
  const [attachmentTransaction, setAttachmentTransaction] = useState<any>(null);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);

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
      ["Status Transaksi", t.status],
      ["Tipe Rekanan", t.rekanan_type],
      ["Nama Rekanan", t.rekanan_type === "REKANAN" ? t.nama_rekanan : "NON REKANAN"],
    ];

    // Add BM Details
    tableData.push(["", ""]);
    tableData.push(["RINCIAN % BM", ""]);
    
    if (t.bm_splits && Array.isArray(t.bm_splits)) {
      t.bm_splits.forEach((split: any, idx: number) => {
        tableData.push([
          `Bagian ${idx + 1}`, 
          `${formatCurrency(parseFloat(split.amount))} @ ${split.percentage}%`
        ]);
      });
      tableData.push(["Rata-rata Efektif", `${t.bm_percentage.toFixed(2)}%`]);
    } else {
      tableData.push(["Persentase BM", `${t.bm_percentage}%`]);
    }

    tableData.push(["", ""]);
    tableData.push(["INFORMASI PEMBAYARAN BM", ""]);
    tableData.push(["Nama Bank", t.bank_name || "-"]);
    tableData.push(["Nomor Rekening", t.account_number || "-"]);
    tableData.push(["Pemilik Rekening", t.account_owner || "-"]);

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
        const label = data.row.raw[0];
        if (label === "INFORMASI PEMBAYARAN BM" || label === "RINCIAN % BM") {
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari Sekolah, No PO, Kode, Rekanan, atau Bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <Select value={printFilter} onValueChange={setPrintFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter Print" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="printed">Sudah Print</SelectItem>
                    <SelectItem value="not_printed">Belum Print</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 bg-muted/50 p-1 rounded-lg border border-border w-full sm:w-auto overflow-hidden">
                <div className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2 flex-1 min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 w-full bg-transparent border-none focus-visible:ring-0 p-0 text-[10px] sm:text-xs min-w-[80px]"
                  />
                </div>
                <span className="text-muted-foreground text-[10px] sm:text-xs shrink-0">-</span>
                <div className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2 flex-1 min-w-0">
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 w-full bg-transparent border-none focus-visible:ring-0 p-0 text-[10px] sm:text-xs min-w-[80px]"
                  />
                </div>
                {(startDate || endDate) && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={resetDateFilters}
                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
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
                    <TableCell className="text-center">
                      {t.bm_splits && Array.isArray(t.bm_splits) ? (
                        <div className="flex flex-col gap-1 items-center">
                          {t.bm_splits.map((split: any, i: number) => (
                            <div key={i} className="text-[10px] whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {split.percentage}%
                            </div>
                          ))}
                          <div className="text-[9px] font-bold text-primary border-t pt-0.5">
                            Avg: {t.bm_percentage.toFixed(1)}%
                          </div>
                        </div>
                      ) : (
                        <span className="font-medium">{t.bm_percentage}%</span>
                      )}
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
                          className={cn(
                            "h-8 w-8",
                            t.attachment_url 
                              ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                              : "text-slate-400 hover:text-slate-500 hover:bg-slate-50"
                          )}
                          onClick={() => {
                            setAttachmentTransaction(t);
                            setIsAttachmentDialogOpen(true);
                          }}
                          title="Lampiran Bukti"
                        >
                          {t.attachment_url ? <ImageIcon className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
                        </Button>
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

      <AttachmentDialog
        transaction={attachmentTransaction}
        open={isAttachmentDialogOpen}
        onOpenChange={setIsAttachmentDialogOpen}
        onSuccess={fetchTransactions}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data transaksi ini akan dihapus secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default TransactionList;