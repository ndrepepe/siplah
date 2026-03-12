import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface EditTransactionDialogProps {
  transaction: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditTransactionDialog = ({ transaction, open, onOpenChange, onSuccess }: EditTransactionDialogProps) => {
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({ ...transaction });
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!formData.school_name || !formData.po_number || !formData.transaction_amount || !formData.bm_percentage) {
      toast.error("Mohon lengkapi field wajib");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          school_name: formData.school_name,
          po_number: formData.po_number,
          transaction_amount: parseFloat(formData.transaction_amount),
          bm_percentage: parseFloat(formData.bm_percentage),
          cabang: formData.cabang,
          nama_siplah: formData.nama_siplah,
          produk: formData.produk,
          rekanan_type: formData.rekanan_type,
          nama_rekanan: formData.rekanan_type === "REKANAN" ? formData.nama_rekanan : null,
          status: formData.status,
        })
        .eq("id", transaction.id);

      if (error) throw error;

      toast.success("Data berhasil diperbarui");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal memperbarui data: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaksi</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>Nama Sekolah</Label>
            <Input 
              value={formData.school_name || ""} 
              onChange={(e) => setFormData({...formData, school_name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Cabang</Label>
            <Input 
              value={formData.cabang || ""} 
              onChange={(e) => setFormData({...formData, cabang: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Nomor PO</Label>
            <Input 
              value={formData.po_number || ""} 
              onChange={(e) => setFormData({...formData, po_number: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Nama SIPLAH</Label>
            <Select 
              value={formData.nama_siplah || ""} 
              onValueChange={(val) => setFormData({...formData, nama_siplah: val})}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LADANG">LADANG</SelectItem>
                <SelectItem value="TELKOM">TELKOM</SelectItem>
                <SelectItem value="BLIBLI">BLIBLI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nominal (Rp)</Label>
            <Input 
              type="number"
              value={formData.transaction_amount || ""} 
              onChange={(e) => setFormData({...formData, transaction_amount: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>% BM</Label>
            <Input 
              type="number"
              step="0.01"
              value={formData.bm_percentage || ""} 
              onChange={(e) => setFormData({...formData, bm_percentage: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Produk</Label>
            <Select 
              value={formData.produk || ""} 
              onValueChange={(val) => setFormData({...formData, produk: val})}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONBOOK">NONBOOK</SelectItem>
                <SelectItem value="BOOK">BOOK</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rekanan</Label>
            <Select 
              value={formData.rekanan_type || ""} 
              onValueChange={(val) => setFormData({...formData, rekanan_type: val})}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NON REKANAN">NON REKANAN</SelectItem>
                <SelectItem value="REKANAN">REKANAN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={formData.status || "DIAJUKAN"} 
              onValueChange={(val) => setFormData({...formData, status: val})}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DIAJUKAN">DIAJUKAN</SelectItem>
                <SelectItem value="DIBATALKAN">DIBATALKAN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.rekanan_type === "REKANAN" && (
            <div className="space-y-2">
              <Label>Nama Rekanan</Label>
              <Input 
                value={formData.nama_rekanan || ""} 
                onChange={(e) => setFormData({...formData, nama_rekanan: e.target.value})}
              />
            </div>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label className="text-muted-foreground">Kode Transaksi (Tidak dapat diubah)</Label>
            <Input value={formData.code || ""} disabled className="bg-muted font-mono" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionDialog;