"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
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

interface EditUserDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditUserDialog = ({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("STAFF");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.raw_user_meta_data?.full_name || "");
      setPhone(user.raw_user_meta_data?.phone || "");
      setRole(user.raw_user_meta_data?.role || "STAFF");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc('update_user_metadata_admin', {
        target_user_id: user.id,
        new_metadata: {
          full_name: fullName,
          phone: phone,
          role: role
        }
      });

      if (error) throw error;

      toast.success("Data user berhasil diperbarui!");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Gagal memperbarui data user: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const isSuperAdmin = user?.email?.toLowerCase() === 'salmon@pepenio.my.id';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Data User</DialogTitle>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label>Nama Lengkap</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nomor HP</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole} disabled={isSuperAdmin}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="STAFF">STAFF (Input)</SelectItem>
                <SelectItem value="MANAGER">MANAGER</SelectItem>
                <SelectItem value="DIREKTUR">DIREKTUR</SelectItem>
              </SelectContent>
            </Select>
            {isSuperAdmin && (
              <p className="text-[10px] text-muted-foreground">Role Super Admin tidak dapat diubah.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isUpdating} className="rounded-xl">
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;