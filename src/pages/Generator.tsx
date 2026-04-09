"use client";

import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  PlusCircle, 
  Save, 
  RefreshCw, 
  School, 
  Hash, 
  Wallet, 
  Percent, 
  Key,
  Building2,
  ShoppingBag,
  UserCircle,
  CreditCard,
  SeparatorHorizontal
} from "lucide-react";
import { toast } from "sonner";
import BulkImport from "@/components/BulkImport";
import { Separator } from "@/components/ui/separator";

const Generator = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    school_name: '',
    po_number: '',
    transaction_amount: '',
    bm_percentage: '',
    code: '',
    cabang: '',
    nama_siplah: '',
    produk: '',
    rekanan_type: '',
    nama_rekanan: '',
    bank_name: '',
    account_number: '',
    account_owner: ''
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
    toast.success("Kode baru berhasil dibuat!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.school_name || !formData.po_number || !formData.transaction_amount || !formData.code) {
      toast.error("Mohon isi semua field wajib!");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          ...formData,
          transaction_amount: parseFloat(formData.transaction_amount),
          bm_percentage: parseFloat(formData.bm_percentage || '0')
        }]);

      if (error) throw error;

      toast.success("Transaksi berhasil disimpan!");
      setFormData({
        school_name: '',
        po_number: '',
        transaction_amount: '',
        bm_percentage: '',
        code: '',
        cabang: '',
        nama_siplah: '',
        produk: '',
        rekanan_type: '',
        nama_rekanan: '',
        bank_name: '',
        account_number: '',
        account_owner: ''
      });
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <Card className="bg-white/90 backdrop-blur-md border-primary/10 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/5">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-800">Input Transaksi Baru</CardTitle>
              <CardDescription>Masukkan detail transaksi dan buat kode unik</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Section 1: Data Sekolah & PO */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <School className="w-4 h-4" /> Data Sekolah & PO
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="school_name" className="font-bold text-slate-700">Nama Sekolah *</Label>
                  <Input
                    id="school_name"
                    name="school_name"
                    placeholder="Contoh: SDN 01 Jakarta"
                    value={formData.school_name}
                    onChange={handleChange}
                    className="rounded-xl border-primary/10 focus:border-primary/30 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="po_number" className="font-bold text-slate-700">Nomor PO *</Label>
                  <Input
                    id="po_number"
                    name="po_number"
                    placeholder="Contoh: PO/2024/001"
                    value={formData.po_number}
                    onChange={handleChange}
                    className="rounded-xl border-primary/10 focus:border-primary/30 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cabang" className="font-bold text-slate-700">Cabang</Label>
                  <Input
                    id="cabang"
                    name="cabang"
                    placeholder="Contoh: Jakarta Pusat"
                    value={formData.cabang}
                    onChange={handleChange}
                    className="rounded-xl border-primary/10 focus:border-primary/30 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Section 2: Nilai & Kode */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Nilai & Kode
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="transaction_amount" className="font-bold text-slate-700">Nilai Transaksi (Rp) *</Label>
                  <Input
                    id="transaction_amount"
                    name="transaction_amount"
                    type="number"
                    placeholder="0"
                    value={formData.transaction_amount}
                    onChange={handleChange}
                    className="rounded-xl border-primary/10 focus:border-primary/30 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bm_percentage" className="font-bold text-slate-700">Persentase BM (%)</Label>
                  <Input
                    id="bm_percentage"
                    name="bm_percentage"
                    type="number"
                    placeholder="0"
                    value={formData.bm_percentage}
                    onChange={handleChange}
                    className="rounded-xl border-primary/10 focus:border-primary/30 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="font-bold text-slate-700">Kode Unik *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      name="code"
                      placeholder="Klik Generate"
                      value={formData.code}
                      onChange={handleChange}
                      className="rounded-xl border-primary/10 focus:border-primary/30 bg-slate-50/50 font-mono font-bold text-primary"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={generateCode}
                      className="rounded-xl border-primary/20 hover:bg-primary/5"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Section 3: Detail Siplah & Produk */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> Siplah & Produk
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="nama_siplah" className="font-bold text-slate-700">Nama Siplah</Label>
                  <Input
                    id="nama_siplah"
                    name="nama_siplah"
                    placeholder="Contoh: Siplah Blibli"
                    value={formData.nama_siplah}
                    onChange={handleChange}
                    className="rounded-xl border-primary/10 focus:border-primary/30 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="produk" className="font-bold text-slate-700">Produk</Label>
                  <Input
                    id="produk"
                    name="produk"
                    placeholder="Contoh: Buku Paket"
                    value={formData.produk}
                    onChange={handleChange}
                    className="rounded-xl border-primary/10 focus:border-primary/30 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Section 4: Rekanan & Bank */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Rekanan & Bank
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="nama_rekanan" className="font-bold text-slate-700">Nama Rekanan</Label>
                  <Input
                    id="nama_rekanan"
                    name="nama_rekanan"
                    placeholder="Contoh: CV Maju Jaya"
                    value={formData.nama_rekanan}
                    onChange={handleChange}
                    className="rounded-xl border-primary/10 focus:border-primary/30 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name" className="font-bold text-slate-700">Nama Bank</Label>
                  <Input
                    id="bank_name"
                    name="bank_name"
                    placeholder="Contoh: BCA"
                    value={formData.bank_name}
                    onChange={handleChange}
                    className="rounded-xl border-primary/10 focus:border-primary/30 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Simpan Transaksi
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full bg-primary/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-transparent px-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Atau</span>
        </div>
      </div>

      <BulkImport />
    </div>
  );
};

export default Generator;