import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Generator = () => {
  const [schoolName, setSchoolName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [bmPercentage, setBmPercentage] = useState("");
  const [cabang, setCabang] = useState("");
  const [namaSiplah, setNamaSiplah] = useState("");
  const [produk, setProduk] = useState("");
  const [rekananType, setRekananType] = useState("");
  const [namaRekanan, setNamaRekanan] = useState("");
  const [status, setStatus] = useState("DIAJUKAN"); // Add status state
  const [generatedCode, setGeneratedCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast: showToast } = useToast();

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(result);
    toast.success("Kode baru berhasil dibuat!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schoolName || !poNumber || !transactionAmount || !bmPercentage || !generatedCode || !cabang || !namaSiplah || !produk || !rekananType) {
      toast.error("Mohon lengkapi semua field wajib");
      return;
    }

    if (rekananType === "REKANAN" && !namaRekanan) {
      toast.error("Mohon isi Nama Rekanan");
      return;
    }

    if (!status) {
      toast.error("Mohon pilih status transaksi");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .insert({
          school_name: schoolName,
          po_number: poNumber,
          transaction_amount: parseFloat(transactionAmount),
          bm_percentage: parseFloat(bmPercentage),
          cabang,
          nama_siplah: namaSiplah,
          produk,
          rekanan_type: rekananType,
          nama_rekanan: rekananType === "REKANAN" ? namaRekanan : null,
          status: status, // Include status in the insert
          code: generatedCode
        });

      if (error) throw error;

      showToast({
        title: "Berhasil!",
        description: "Data transaksi telah disimpan.",
      });

      // Reset form
      setSchoolName("");
      setPoNumber("");
      setTransactionAmount("");
      setBmPercentage("");
      setCabang("");
      setNamaSiplah("");
      setProduk("");
      setRekananType("");
      setNamaRekanan("");
      setStatus("DIAJUKAN"); // Reset status
      setGeneratedCode("");
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast.error("Gagal menyimpan data: " + (error.message || "Terjadi kesalahan"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-primary">
          Input Data Transaksi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Baris 1 */}
            <div className="space-y-2">
              <Label htmlFor="schoolName">Nama Sekolah</Label>
              <Input
                id="schoolName"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Nama Sekolah"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cabang">Cabang</Label>
              <Input
                id="cabang"
                value={cabang}
                onChange={(e) => setCabang(e.target.value)}
                placeholder="Nama Cabang"
              />
            </div>

            {/* Baris 2 */}
            <div className="space-y-2">
              <Label htmlFor="poNumber">Nomor PO</Label>
              <Input
                id="poNumber"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Nomor PO"
              />
            </div>
            <div className="space-y-2">
              <Label>Nama SIPLAH</Label>
              <Select onValueChange={setNamaSiplah} value={namaSiplah}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih SIPLAH" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LADANG">LADANG</SelectItem>
                  <SelectItem value="TELKOM">TELKOM</SelectItem>
                  <SelectItem value="BLIBLI">BLIBLI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Baris 3 */}
            <div className="space-y-2">
              <Label htmlFor="transactionAmount">Nominal Transaksi (Rp)</Label>
              <Input
                id="transactionAmount"
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="Jumlah"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bmPercentage">% BM</Label>
              <Input
                id="bmPercentage"
                type="number"
                step="0.01"
                value={bmPercentage}
                onChange={(e) => setBmPercentage(e.target.value)}
                placeholder="Contoh: 10"
              />
            </div>

            {/* Baris 4 - Selects */}
            <div className="space-y-2">
              <Label>Produk</Label>
              <Select onValueChange={setProduk} value={produk}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Produk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONBOOK">NONBOOK</SelectItem>
                  <SelectItem value="BOOK">BOOK</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rekanan</Label>
              <Select onValueChange={setRekananType} value={rekananType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status Rekanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NON REKANAN">NON REKANAN</SelectItem>
                  <SelectItem value="REKANAN">REKANAN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Add status field */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select onValueChange={setStatus} value={status}>
                <SelectTrigger>
                  <SelectValue className="text-center">
                    {status}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIAJUKAN">DIAJUKAN</SelectItem>
                  <SelectItem value="DIBATALKAN">DIBATALKAN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="generatedCode" className="text-lg font-semibold">Kode Transaksi</Label>
            <div className="flex gap-2">
              <Input
                id="generatedCode"
                value={generatedCode}
                readOnly
                placeholder="Generate kode di sini"
                className="flex-1 font-mono text-lg bg-muted text-center tracking-widest"
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={generateCode}
                className="shrink-0"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full text-lg h-12" 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Simpan Transaksi
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Generator;