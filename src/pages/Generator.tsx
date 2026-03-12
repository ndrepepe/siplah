import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Save } from "lucide-react";

const Generator = () => {
  const [schoolName, setSchoolName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [bmPercentage, setBmPercentage] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast: showToast } = useToast();

  const generateCode = () => {
    // Membuat kode 16 digit acak (huruf kapital dan angka)
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

    if (!schoolName || !poNumber || !transactionAmount || !bmPercentage || !generatedCode) {
      toast.error("Mohon lengkapi semua field dan generate kode terlebih dahulu");
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
          code: generatedCode
        });

      if (error) throw error;

      showToast({
        title: "Berhasil!",
        description: "Data transaksi telah disimpan ke database.",
      });

      // Reset form
      setSchoolName("");
      setPoNumber("");
      setTransactionAmount("");
      setBmPercentage("");
      setGeneratedCode("");
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast.error("Gagal menyimpan data: " + (error.message || "Terjadi kesalahan server"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-primary">
          Input Data Transaksi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName">Nama Sekolah</Label>
              <Input
                id="schoolName"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Contoh: SMA Negeri 1 Jakarta"
                className="focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poNumber">Nomor PO</Label>
              <Input
                id="poNumber"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Contoh: PO/2024/001"
                className="focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionAmount">Nominal Transaksi (Rp)</Label>
              <Input
                id="transactionAmount"
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="Masukkan jumlah"
                className="focus-visible:ring-primary"
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
                className="focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="generatedCode" className="text-lg font-semibold">Kode Transaksi</Label>
            <div className="flex gap-2">
              <Input
                id="generatedCode"
                value={generatedCode}
                readOnly
                placeholder="Klik tombol di samping untuk generate"
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