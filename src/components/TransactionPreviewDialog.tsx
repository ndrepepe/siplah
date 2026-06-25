"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, School, FileText, DollarSign, Percent, Landmark, User, ShieldAlert, CheckCircle2, XCircle, Clock } from "lucide-react";

interface TransactionPreviewDialogProps {
  transaction: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TransactionPreviewDialog = ({ transaction, open, onOpenChange }: TransactionPreviewDialogProps) => {
  if (!transaction) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Detail Pengajuan Transaksi
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-mono mt-1">Kode: {transaction.code}</p>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Status & Approval Info */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Status Transaksi</span>
              <Badge
                variant={transaction.status === "DIBATALKAN" ? "destructive" : "outline"}
                className={
                  transaction.status === "DIAJUKAN" ? "bg-green-50 text-green-700 border-green-200" :
                  transaction.status === "DISETUJUI" ? "bg-blue-50 text-blue-700 border-blue-200" : ""
                }
              >
                {transaction.status || "DIAJUKAN"}
              </Badge>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tanggal Pengajuan</span>
              <div className="text-xs font-semibold flex items-center gap-1 text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(transaction.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </div>
            </div>
          </div>

          {/* Informasi Sekolah & PO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Sekolah & PO</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Nama Sekolah</span>
                <div className="text-sm font-semibold flex items-center gap-1.5 text-slate-800">
                  <School className="w-4 h-4 text-slate-400 shrink-0" />
                  {transaction.school_name}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Cabang</span>
                <div className="text-sm font-medium text-slate-700">{transaction.cabang || "-"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Nomor PO</span>
                <div className="text-sm font-semibold text-slate-800">{transaction.po_number}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Platform SIPLAH</span>
                <div>
                  <Badge variant="secondary" className="text-[10px] font-bold">{transaction.nama_siplah}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Rincian Finansial */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rincian Finansial & BM</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Nominal Transaksi</span>
                <div className="text-base font-bold text-primary flex items-center gap-1">
                  <DollarSign className="w-4 h-4 shrink-0" />
                  {formatCurrency(transaction.transaction_amount)}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Jenis Produk</span>
                <div>
                  <Badge variant={transaction.produk === "BOOK" ? "default" : "secondary"} className="text-[10px]">
                    {transaction.produk}
                  </Badge>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] text-muted-foreground block">Persentase BM</span>
                {transaction.bm_splits && Array.isArray(transaction.bm_splits) ? (
                  <div className="space-y-1.5">
                    {transaction.bm_splits.map((split: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-500">Bagian {idx + 1} ({formatCurrency(parseFloat(split.amount))})</span>
                        <span className="font-bold text-slate-700">{split.percentage}%</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-xs font-bold pt-1.5 border-t border-dashed">
                      <span>Rata-rata BM</span>
                      <span className="text-primary">{transaction.bm_percentage.toFixed(2)}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    <Percent className="w-4 h-4 text-slate-400" />
                    {transaction.bm_percentage}%
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informasi Rekanan & Pembayaran */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Rekanan & Pembayaran</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Tipe Rekanan</span>
                <div className="text-sm font-semibold text-slate-800">{transaction.rekanan_type}</div>
              </div>
              {transaction.rekanan_type === "REKANAN" && (
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Nama Rekanan</span>
                  <div className="text-sm font-semibold text-slate-800">{transaction.nama_rekanan}</div>
                </div>
              )}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Nama Bank</span>
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-slate-400" />
                    {transaction.bank_name || "-"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Nomor Rekening</span>
                  <div className="text-xs font-mono font-semibold text-slate-800">{transaction.account_number || "-"}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Pemilik Rekening</span>
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {transaction.account_owner || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alasan Approval */}
          {transaction.reason_for_approval && (
            <div className="space-y-2 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100">
              <span className="text-[10px] uppercase font-bold text-amber-700 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Alasan Membutuhkan Approval
              </span>
              <p className="text-xs text-amber-900 leading-relaxed">{transaction.reason_for_approval}</p>
            </div>
          )}

          {/* Detail Approval Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Persetujuan</h4>
            <div className="space-y-2">
              {(transaction.approval_type === "MANAGER" || transaction.approval_type === "BOTH") && (
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700">Persetujuan Manager</span>
                    <span className="text-[10px] text-muted-foreground block">{transaction.assigned_manager_email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {transaction.manager_approved ? (
                      <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Disetujui
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Menunggu
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {(transaction.approval_type === "DIREKTUR" || transaction.approval_type === "BOTH") && (
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700">Persetujuan Direktur</span>
                    <span className="text-[10px] text-muted-foreground block">{transaction.assigned_director_email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {transaction.director_approved ? (
                      <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Disetujui
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Menunggu
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button onClick={() => onOpenChange(false)} className="rounded-xl w-full sm:w-auto">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionPreviewDialog;