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
import { Loader2, RefreshCw, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
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
import EditTransactionDialog from "@/components/EditTransactionDialog";

const TransactionList = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredTransactions = transactions.filter((t) =>
    t.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

    // Prepare the data for the worksheet
    const ws_data = [
      ["Tanggal", "Sekolah / Cabang", "No PO / SIPLAH", "Produk", "Nominal", "% BM", "Status", "Kode Transaksi", "Rekanan", "Nama Rekanan", "Aksi"]
    ];

    filteredTransactions.forEach(t => {
      ws_data.push([
        new Date(t.created_at).toLocaleDateString("id-ID"),
        `${t.school_name}\n${t.cabang}`, // Combine school and cabang with newline
        t.po_number,
        t.produk,
        formatCurrency(t.transaction_amount),
        `${t.bm_percentage}%`,
        t.status,
        t.code,
        t.rekanan_type,
        t.rekanan_type === "REKANAN" ? t.nama_rekanan : "NON REKANAN",
        "Edit | Hapus" // This is just for display in Excel, not functional
      ]);
    });

    // Create a new workbook and add the worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

    // Generate the Excel file and trigger download    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transaksi.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full shadow-lg border-t-4 border-t-primary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Daftar Transaksi</CardTitle>
        <div className="flex items-center gap-2">
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
            <i className="fas fa-file-excel-spreadsheet w-4 h-4" />
            Export ke Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Cari Sekolah, No PO, atau Kode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
                <TableHead className="font-bold">Nama Rekanan</TableHead>
                <TableHead className="font-bold text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Memuat data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
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
                      <Badge variant={t.rekanan_type === "REKANAN" ? "default" : "secondary"}>
                        {t.rekanan_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {t.rekanan_type === "REKANAN" ? t.nama_rekanan : "NON REKANAN"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setEditingTransaction(t);
                            setIsEditDialogOpen(true);
                          }}
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
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <EditTransactionDialog        transaction={editingTransaction}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={fetchTransactions}
      />

      {/* Delete Confirmation */}
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