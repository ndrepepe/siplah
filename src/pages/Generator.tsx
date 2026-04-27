"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Save, Plus, Trash2, Calculator } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BMSplit {
  amount: string;
  percentage: string;
}

const Generator = () => {
  const [schoolName, setSchoolName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [bmType, setBmType] = useState<"single" | "multiple">("single");
  const [bmPercentage, setBmPercentage] = useState("");
  const [bmSplits, setBmSplits] = useState<BMSplit[]>([{ amount: "", percentage: "" }]);
  const [cabang, setCabang] = useState("");
  const [namaSiplah, setNamaSiplah] = useState("");
  const [produk, setProduk] = useState("");
  const [rekananType, setRekananType] = useState("");
  const [namaRekanan, setNamaRekanan] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountOwner, setAccountOwner] = useState("");
  const [status, setStatus] = useState("DIAJUKAN");
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

  const addBmSplit = () => {
    setBmSplits([...bmSplits, { amount: "", percentage: "" }]);
  };

  const removeBmSplit = (index: number) => {
    const newSplits = bmSplits.filter((_, i) => i !== index);
    setBmSplits(newSplits.length ? newSplits : [{ amount: "", percentage: "" }]);
  };

  const updateBmSplit = (index: number, field: keyof BMSplit, value: string) => {
    const newSplits = [...bmSplits];
    newSplits[index][field] = value;
    setBmSplits(newSplits);
  };

  const calculateEffectiveBM = () => {
    if (bmType === "single") return parseFloat(bmPercentage) || 0;
    
    const totalAmount = parseFloat(transactionAmount) || 0;
    if (totalAmount <= 0) return 0;

    let totalBMValue = 0;
    bmSplits.forEach(split => {
      const amt = parseFloat(split.amount) || 0;
      const pct = parseFloat(split.percentage) || 0;
      totalBMValue += (amt * pct) / 100;
    });

    return (totalBMValue / totalAmount) * 100;
  };

  const validateSplits = () => {
    if (bmType === "single") return true;
    
    const totalAmount = parseFloat(transactionAmount) || 0;
    const splitTotal = bmSplits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
    
    if (Math.abs(totalAmount - splitTotal) > 0.01) {
      toast.error(`Total pembagian (${splitTotal.toLocaleString()}) harus sama dengan nilai transaksi (${totalAmount.toLocaleString()})`);
      return false;
    }
    return true;
  };

  const sendWhatsAppNotification = async (data: any) => {
    try {
      // Menggunakan nama fungsi langsung untuk invoke yang lebih stabil
      const { error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          school_name: data.school_name,
          po_number: data.po_number,
          transaction_amount: data.transaction_amount,
          code: data.code
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("[Generator] Gagal mengirim notifikasi WhatsApp:", err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schoolName || !poNumber || !transactionAmount || !generatedCode || !cabang || !namaSiplah || !produk || !rekananType) {
      toast.error("Mohon lengkapi semua field wajib");
      return;
    }

    if (!validateSplits()) return;

    setIsSaving(true);
    const amount = parseFloat(transactionAmount);
    const effectiveBM = calculateEffectiveBM();
    
    const transactionData = {
      school_name: schoolName,
      po_number: poNumber,
      transaction_amount: amount,
      bm_percentage: effectiveBM,
      bm_splits: bmType === "multiple" ? bmSplits : null,
      cabang,
      nama_siplah: namaSiplah,
      produk,
      rekanan_type: rekananType,
      nama_rekanan: rekananType === "REKANAN" ? namaRekanan : null,
      bank_name: bankName,
      account_number: accountNumber,
      account_owner: accountOwner,
      status: status,
      code: generatedCode
    };

    try {
      const { error } = await supabase
        .from("transactions")
        .insert(transactionData);

      if (error) throw error;

      showToast({
        title: "Berhasil!",
        description: "Data transaksi disimpan.",
      });

      // Kirim Notifikasi WhatsApp dengan toast promise
      toast.promise(sendWhatsAppNotification(transactionData), {
        loading: 'Mengirim notifikasi WhatsApp...',
        success: 'Notifikasi WhatsApp terkirim!',
        error: (err) => `Gagal kirim WA: ${err.message || 'Cek koneksi/API Key'}`
      });

      // Reset Form
      setSchoolName("");
      setPoNumber("");
      setTransactionAmount("");
      setBmPercentage("");
      setBmSplits([{ amount: "", percentage: "" }]);
      setBmType("single");
      setCabang("");
      setNamaSiplah("");
      setProduk("");
      setRekananType("");
      setNamaRekanan("");
      setBankName("");
      setAccountNumber("");
      setAccountOwner("");
      setStatus("DIAJUKAN");
      setGeneratedCode("");
    } catch (error: any) {
      toast.error("Gagal menyimpan data: " + (error.message || "Terjadi kesalahan"));
    } finally {
      setIsSaving(false);
    }
  };

  const splitTotal = bmSplits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
  const remainingAmount = (parseFloat(transactionAmount) || 0) - splitTotal;

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

            <div className="space-y-2">
              <Label htmlFor="poNumber">Nomor PO (Maks 21 digit)</Label>
              <Input
                id="poNumber"
                value={poNumber}
                maxLength={21}
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

            <div className="space-y-2">
              <Label htmlFor="transactionAmount">Nominal Transaksi (Maks 12 digit)</Label>
              <Input
                id="transactionAmount"
                type="number"
                value={transactionAmount}
                onInput={(e: any) => {
                  if (e.target.value.length > 12) e.target.value = e.target.value.slice(0, 12);
                }}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="Jumlah"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select onValueChange={setStatus} value={status}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIAJUKAN">DIAJUKAN</SelectItem>
                  <SelectItem value="DIBATALKAN">DIBATALKAN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* BM Section */}
            <div className="md:col-span-2 space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  Pengaturan % BM
                </Label>
                <Tabs value={bmType} onValueChange={(v: any) => setBmType(v)} className="w-auto">
                  <TabsList className="grid w-full grid-cols-2 h-8 p-1">
                    <TabsTrigger value="single" className="text-xs">Single</TabsTrigger>
                    <TabsTrigger value="multiple" className="text-xs">Multiple</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {bmType === "single" ? (
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
              ) : (
                <div className="space-y-3">
                  {bmSplits.map((split, index) => (
                    <div key={index} className="flex gap-2 items-end animate-in fade-in slide-in-from-left-2 duration-200">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] uppercase text-muted-foreground">Nominal PO</Label>
                        <Input
                          type="number"
                          value={split.amount}
                          onChange={(e) => updateBmSplit(index, "amount", e.target.value)}
                          placeholder="Nominal"
                          className="h-9"
                        />
                      </div>
                      <div className="w-24 space-y-1.5">
                        <Label className="text-[10px] uppercase text-muted-foreground">% BM</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={split.percentage}
                          onChange={(e) => updateBmSplit(index, "percentage", e.target.value)}
                          placeholder="%"
                          className="h-9"
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeBmSplit(index)}
                        className="h-9 w-9 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div className="text-[11px] font-medium">
                      <span className={remainingAmount === 0 ? "text-green-600" : "text-amber-600"}>
                        Sisa: {remainingAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addBmSplit}
                      className="h-8 text-xs rounded-lg"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Tambah Baris
                    </Button>
                  </div>
                </div>
              )}
            </div>

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

            {rekananType === "REKANAN" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="namaRekanan">Nama Rekanan</Label>
                <Input
                  id="namaRekanan"
                  value={namaRekanan}
                  onChange={(e) => setNamaRekanan(e.target.value)}
                  placeholder="Masukkan Nama Rekanan"
                />
              </div>
            )}

            <div className="md:col-span-2 space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">BM diberikan melalui</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Nama Bank (Opsional)</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: BCA, Mandiri"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Nomor Rekening (Opsional)</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Nomor Rekening"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="accountOwner">Pemilik Rekening (Opsional)</Label>
                  <Input
                    id="accountOwner"
                    value={accountOwner}
                    onChange={(e) => setAccountOwner(e.target.value)}
                    placeholder="Nama Pemilik Rekening"
                  />
                </div>
              </div>
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