"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText, Eye, Trash2, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";
import imageCompression from 'browser-image-compression';

interface AttachmentDialogProps {
  transaction: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AttachmentDialog = ({ transaction, open, onOpenChange, onSuccess }: AttachmentDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPreviewUrl(transaction?.attachment_url || null);
      setFile(null);
    }
  }, [transaction, open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type.startsWith('image/')) {
      if (selectedFile.size > 100 * 1024) {
        const options = {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        try {
          toast.info("Mengompres gambar...");
          const compressedFile = await imageCompression(selectedFile, options);
          setFile(compressedFile);
          toast.success("Gambar berhasil dikompres");
        } catch (error) {
          setFile(selectedFile);
        }
      } else {
        setFile(selectedFile);
      }
    } else if (selectedFile.type === 'application/pdf') {
      if (selectedFile.size > 1024 * 1024) { // Limit PDF to 1MB
        toast.error("Ukuran PDF maksimal 1MB");
        return;
      }
      setFile(selectedFile);
    } else {
      toast.error("Hanya mendukung file Gambar atau PDF");
    }
  };

  const handleUpload = async () => {
    if (!file || !transaction) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${transaction.id}-${Date.now()}.${fileExt}`;
      const filePath = `attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('transaction_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('transaction_attachments')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('transactions')
        .update({ attachment_url: publicUrl })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

      toast.success("Lampiran berhasil disimpan");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal mengunggah: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction?.id) return;

    setUploading(true);
    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ attachment_url: null })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

      toast.success("Lampiran berhasil dihapus");
      setPreviewUrl(null);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal menghapus: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Robust PDF detection
  const isPdf = previewUrl?.toLowerCase().includes('.pdf');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Lampiran Bukti
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4">
          {previewUrl ? (
            <div className="relative group rounded-2xl overflow-hidden border-2 border-primary/10 bg-slate-50 h-[400px] flex items-center justify-center">
              {isPdf ? (
                <iframe 
                  src={`${previewUrl}#toolbar=0`} 
                  className="w-full h-full border-none"
                  title="PDF Preview"
                />
              ) : (
                <img 
                  src={previewUrl} 
                  alt="Bukti Transaksi" 
                  className="w-full h-full object-contain"
                />
              )}
              
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="secondary" className="rounded-full shadow-lg" asChild>
                  <a href={previewUrl} target="_blank" rel="noreferrer" download>
                    <Download className="w-4 h-4 mr-2" /> Unduh
                  </a>
                </Button>
                <Button size="sm" variant="destructive" className="rounded-full shadow-lg" onClick={handleDelete} disabled={uploading}>
                  <Trash2 className="w-4 h-4 mr-2" /> Hapus
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
              <div className="p-4 bg-white rounded-full shadow-sm">
                <Upload className="w-8 h-8 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">Pilih foto atau PDF bukti transfer</p>
                <p className="text-xs text-slate-400 mt-1">Maksimal 100KB untuk Gambar, 1MB untuk PDF</p>
              </div>
              <Input 
                type="file" 
                accept="image/*,application/pdf" 
                onChange={handleFileChange}
                className="hidden" 
                id="file-upload"
              />
              <Button variant="outline" asChild className="rounded-xl">
                <label htmlFor="file-upload" className="cursor-pointer">
                  Pilih File
                </label>
              </Button>
              {file && (
                <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-full animate-in fade-in zoom-in">
                  <CheckCircle2 className="w-3 h-3" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            Tutup
          </Button>
          {!previewUrl && (
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading} 
              className="rounded-xl px-8"
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Simpan Lampiran
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentDialog;