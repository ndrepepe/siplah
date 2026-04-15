"use client";

import React, { useState, useEffect } from 'react';
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
import { Loader2, Upload, X, Image as ImageIcon, FileText, Download } from "lucide-react";
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

    // Check if it's an image for compression
    if (selectedFile.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 1, // Target size 1MB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      try {
        const loadingToast = toast.loading("Mengompres gambar...");
        const compressedFile = await imageCompression(selectedFile, options);
        toast.dismiss(loadingToast);
        
        setFile(compressedFile);
        setPreviewUrl(URL.createObjectURL(compressedFile));
        
        const originalSize = (selectedFile.size / 1024 / 1024).toFixed(2);
        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
        toast.success(`Gambar dikompres: ${originalSize}MB -> ${compressedSize}MB`);
      } catch (error) {
        console.error("Compression error:", error);
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
      }
    } else {
      // For non-image files (PDF, etc), just set it
      setFile(selectedFile);
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !transaction) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${transaction.id}-${Math.random()}.${fileExt}`;
      const filePath = `attachments/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('transaction_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('transaction_attachments')
        .getPublicUrl(filePath);

      // 3. Update Transaction Record
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lampiran Bukti - {transaction?.school_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {previewUrl ? (
            <div className="relative group rounded-lg overflow-hidden border bg-muted aspect-video flex items-center justify-center">
              {previewUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || previewUrl.startsWith('blob:') ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-12 h-12 text-muted-foreground" />
                  <span className="text-sm font-medium">Dokumen Terlampir</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => window.open(previewUrl, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" /> Lihat Full
                </Button>
                {!transaction?.is_printed && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleRemoveAttachment}
                    disabled={uploading}
                  >
                    <X className="w-4 h-4 mr-2" /> Hapus
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-muted/30">
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Belum ada lampiran</p>
                <p className="text-xs text-muted-foreground">Unggah foto bukti transfer atau dokumen lainnya</p>
              </div>
            </div>
          )}

          {!transaction?.is_printed && (
            <div className="space-y-2">
              <Label htmlFor="file-upload">Pilih File Baru</Label>
              <div className="flex gap-2">
                <Input 
                  id="file-upload" 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                * Gambar akan otomatis dikompres hingga maks 1MB untuk efisiensi.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          {file && (
            <Button onClick={handleUpload} disabled={uploading}>
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