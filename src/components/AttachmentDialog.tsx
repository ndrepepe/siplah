"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, Image as ImageIcon, FileText, Download, CheckCircle2 } from "lucide-react";
import imageCompression from 'browser-image-compression';

interface AttachmentDialogProps {
  transaction: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AttachmentDialog = ({ transaction, open, onOpenChange, onSuccess }: AttachmentDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && transaction?.attachment_url) {
      setPreviewUrl(transaction.attachment_url);
    } else if (!open) {
      setFile(null);
      setPreviewUrl(null);
    }
  }, [open, transaction]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // PDF Limit: 1MB
    if (selectedFile.type === 'application/pdf') {
      if (selectedFile.size > 1024 * 1024) {
        toast.error("File PDF terlalu besar. Maksimal 1MB.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(null);
      toast.success("PDF siap diunggah");
      return;
    }

    // Image Limit: 100KB (0.1MB)
    if (selectedFile.type.startsWith('image/')) {
      const limitInBytes = 100 * 1024;
      
      if (selectedFile.size > limitInBytes) {
        const options = {
          maxSizeMB: 0.1, // 100KB
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        };

        try {
          const loadingToast = toast.loading("Mengompres gambar (Target 100KB)...");
          const compressedFile = await imageCompression(selectedFile, options);
          toast.dismiss(loadingToast);
          
          setFile(compressedFile);
          setPreviewUrl(URL.createObjectURL(compressedFile));
          
          const originalSize = (selectedFile.size / 1024).toFixed(1);
          const compressedSize = (compressedFile.size / 1024).toFixed(1);
          toast.success(`Gambar dikompres: ${originalSize}KB -> ${compressedSize}KB`);
        } catch (error) {
          console.error("Compression error:", error);
          toast.error("Gagal mengompres gambar");
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      } else {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        toast.success("Gambar siap diunggah");
      }
    } else {
      toast.error("Format file tidak didukung. Gunakan Gambar atau PDF.");
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file || !transaction) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${transaction.id}-${Math.random()}.${fileExt}`;
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

      toast.success("Lampiran berhasil diunggah");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Gagal mengunggah: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = async () => {
    if (!transaction) return;

    setUploading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ attachment_url: null })
        .eq('id', transaction.id);

      if (error) throw error;

      toast.success("Lampiran berhasil dihapus");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal menghapus lampiran: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Lampiran Bukti</DialogTitle>
          <p className="text-xs text-muted-foreground">{transaction?.school_name}</p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Preview Area */}
          <div className="relative group rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 aspect-video flex items-center justify-center">
            {previewUrl ? (
              <>
                {previewUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || previewUrl.startsWith('blob:') ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-12 h-12 text-primary" />
                    <span className="text-sm font-bold text-slate-700">Dokumen PDF Terlampir</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => window.open(previewUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" /> Lihat Full
                  </Button>
                  {!transaction?.is_printed && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="rounded-full"
                      onClick={handleRemoveAttachment}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4 mr-2" /> Hapus
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div 
                className="flex flex-col items-center justify-center gap-3 p-8 cursor-pointer w-full h-full"
                onClick={() => !transaction?.is_printed && fileInputRef.current?.click()}
              >
                <div className="bg-primary/10 p-4 rounded-full text-primary">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">Belum ada lampiran</p>
                  <p className="text-[10px] text-muted-foreground">Klik tombol di bawah untuk mengunggah</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Section */}
          {!transaction?.is_printed && (
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Unggah File Baru</Label>
              <div 
                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-slate-50/50 hover:bg-slate-50 hover:border-primary/40 transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-slate-400" />
                <div className="text-center">
                  <span className="text-sm font-medium text-primary">Klik untuk pilih file</span>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Gambar (Maks 100KB) | PDF (Maks 1MB)
                  </p>
                </div>
                <Input 
                  ref={fileInputRef}
                  id="file-upload" 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </div>

              {file && (
                <div className="flex items-center justify-between bg-green-50 border border-green-100 p-3 rounded-xl">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-xs font-bold text-green-800 truncate">{file.name}</span>
                    <span className="text-[10px] text-green-600 shrink-0">({(file.size / 1024).toFixed(0)}KB)</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      setFile(null); 
                      setPreviewUrl(transaction?.attachment_url || null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }} 
                    className="h-7 w-7 text-red-500 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Tutup
          </Button>
          {file && (
            <Button onClick={handleUpload} disabled={uploading} className="rounded-xl bg-primary shadow-lg shadow-primary/20">
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengunggah...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Simpan Lampiran</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentDialog;