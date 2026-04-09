"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const BulkImport = () => {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");

  const templateData = [
    {
      "Nama Sekolah": "SDN 01 Contoh",
      "No PO": "PO/2024/001",
      "Nilai Transaksi": 5000000,
      "Persentase BM": 10,
      "Kode": "KODE001",
      "Cabang": "Jakarta",
      "Nama Siplah": "Siplah Blibli",
      "Produk": "Buku Paket",
      "Tipe Rekanan": "CV",
      "Nama Rekanan": "CV Maju Jaya",
      "Nama Bank": "BCA",
      "No Rekening": "1234567890",
      "Pemilik Rekening": "Budi Sudarsono"
    }
  ];

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Transaksi");
    XLSX.writeFile(wb, "Template_Import_Transaksi.xlsx");
    toast.success("Template berhasil diunduh");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          toast.error("File Excel kosong");
          return;
        }
        
        setPreviewData(data);
        toast.info(`${data.length} baris data terdeteksi`);
      } catch (error) {
        toast.error("Gagal membaca file Excel");
      }
    };
    reader.readAsBinaryString(file);
  };

  const importData = async () => {
    if (previewData.length === 0) return;
    
    setLoading(true);
    try {
      const formattedData = previewData.map(row => ({
        school_name: row["Nama Sekolah"] || "",
        po_number: row["No PO"] || "",
        transaction_amount: Number(row["Nilai Transaksi"]) || 0,
        bm_percentage: Number(row["Persentase BM"]) || 0,
        code: row["Kode"] || "",
        cabang: row["Cabang"] || "",
        nama_siplah: row["Nama Siplah"] || "",
        produk: row["Produk"] || "",
        rekanan_type: row["Tipe Rekanan"] || "",
        nama_rekanan: row["Nama Rekanan"] || "",
        bank_name: row["Nama Bank"] || "",
        account_number: row["No Rekening"] || "",
        account_owner: row["Pemilik Rekening"] || ""
      }));

      // Validate required fields
      const invalidRows = formattedData.filter(r => !r.school_name || !r.po_number || !r.code);
      if (invalidRows.length > 0) {
        toast.error("Beberapa baris tidak memiliki Nama Sekolah, No PO, atau Kode");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .insert(formattedData);

      if (error) throw error;

      toast.success(`${formattedData.length} data berhasil diimpor!`);
      setPreviewData([]);
      setFileName("");
    } catch (error: any) {
      toast.error("Gagal mengimpor data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-white/90 backdrop-blur-md border-primary/10 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/5">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-2xl text-green-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-800">Bulk Import Excel</CardTitle>
              <CardDescription>Unggah banyak data transaksi sekaligus menggunakan file Excel</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">1</span>
                Unduh Template
              </h3>
              <p className="text-sm text-slate-500">Gunakan format Excel yang sudah kami sediakan agar data terbaca dengan benar oleh sistem.</p>
              <Button 
                onClick={downloadTemplate} 
                variant="outline" 
                className="w-full rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template Excel
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">2</span>
                Unggah File
              </h3>
              <p className="text-sm text-slate-500">Pilih file Excel yang sudah diisi data transaksi Anda.</p>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors ${fileName ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-primary/40'}`}>
                  <Upload className={`w-8 h-8 mb-2 ${fileName ? 'text-green-500' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium text-slate-600">
                    {fileName || "Klik atau seret file ke sini"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {previewData.length > 0 && (
            <Alert className="bg-blue-50 border-blue-200 rounded-2xl">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-800 font-bold">Data Siap Diimpor</AlertTitle>
              <AlertDescription className="text-blue-700">
                Terdeteksi <strong>{previewData.length} baris</strong> data. Pastikan kolom sudah sesuai dengan template sebelum melanjutkan.
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-4">
            <Button 
              onClick={importData} 
              disabled={loading || previewData.length === 0}
              className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sedang Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Impor Sekarang
                </>
              )}
            </Button>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-bold">Penting:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Kolom <strong>Nama Sekolah</strong>, <strong>No PO</strong>, dan <strong>Kode</strong> wajib diisi.</li>
                <li>Pastikan format angka pada <strong>Nilai Transaksi</strong> dan <strong>Persentase BM</strong> tidak mengandung karakter non-numerik.</li>
                <li>Sistem akan mengabaikan baris yang tidak memiliki data wajib.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkImport;