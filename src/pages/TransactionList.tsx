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
import { Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TransactionList = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <Card className="w-full shadow-lg border-t-4 border-t-primary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Daftar Transaksi</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchTransactions}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
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
                <TableHead className="font-bold">Rekanan</TableHead>
                <TableHead className="font-bold">Kode Transaksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Memuat data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Tidak ada data ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
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
                      <div className="text-xs font-medium">{t.rekanan_type}</div>
                      {t.nama_rekanan && (
                        <div className="text-[10px] text-muted-foreground italic">
                          ({t.nama_rekanan})
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono border">
                        {t.code}
                      </code>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionList;