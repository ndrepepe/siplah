"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PhoneCall, FileInput, ShieldCheck, Printer, ArrowRight, ArrowDown, HelpCircle, Info } from "lucide-react";

const SubmissionGuide = () => {
  const steps = [
    {
      number: "1",
      title: "Telepon Mas Salmon",
      actor: "Cabang",
      description: "Cabang melakukan koordinasi awal dengan menelepon Mas Salmon sebelum melakukan input data.",
      icon: PhoneCall,
      color: "bg-blue-500",
      textColor: "text-blue-500",
      borderColor: "border-blue-100",
      bgColor: "bg-blue-50/50"
    },
    {
      number: "2",
      title: "Input ke Aplikasi",
      actor: "Mas Salmon",
      description: "Mas Salmon menginputkan data transaksi secara lengkap dan benar ke dalam aplikasi Grand Line Manager.",
      icon: FileInput,
      color: "bg-purple-500",
      textColor: "text-purple-500",
      borderColor: "border-purple-100",
      bgColor: "bg-purple-50/50"
    },
    {
      number: "3",
      title: "Konfirmasi Accounting",
      actor: "Accounting",
      description: "Pihak Accounting akan melakukan telepon konfirmasi balik ke Cabang untuk verifikasi data.",
      icon: ShieldCheck,
      color: "bg-amber-500",
      textColor: "text-amber-500",
      borderColor: "border-amber-100",
      bgColor: "bg-amber-50/50"
    },
    {
      number: "4",
      title: "Cetak Bukti (Print)",
      actor: "Sistem / Cabang",
      description: "Setelah dikonfirmasi, bukti transaksi dapat diunduh dalam bentuk PDF dan dicetak (Print).",
      icon: Printer,
      color: "bg-green-500",
      textColor: "text-green-500",
      borderColor: "border-green-100",
      bgColor: "bg-green-50/50"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="bg-white/90 backdrop-blur-md border-primary/10 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/5">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-800">Petunjuk Pengajuan Transaksi</CardTitle>
              <CardDescription>Ikuti langkah-langkah di bawah ini untuk memastikan proses pengajuan berjalan lancar.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-10 space-y-10">
          
          {/* Bagan Alur Visual */}
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                {/* Card Langkah */}
                <div className={`w-full lg:w-1/4 border ${step.borderColor} ${step.bgColor} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative group`}>
                  {/* Badge Nomor */}
                  <div className={`absolute -top-3 -left-3 w-8 h-8 ${step.color} text-white rounded-full flex items-center justify-center font-black text-sm shadow-md`}>
                    {step.number}
                  </div>

                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-2xl bg-white shadow-sm ${step.textColor} group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {step.actor}
                      </span>
                      <h4 className="font-bold text-slate-800 text-base pt-1">{step.title}</h4>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Panah Penghubung */}
                {index < steps.length - 1 && (
                  <>
                    {/* Panah Desktop */}
                    <div className="hidden lg:flex items-center justify-center text-primary/40 animate-pulse">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                    {/* Panah Mobile */}
                    <div className="flex lg:hidden items-center justify-center text-primary/40 py-2 animate-pulse">
                      <ArrowDown className="w-6 h-6" />
                    </div>
                  </>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Catatan Tambahan */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="font-bold text-blue-900 text-sm">Catatan Penting untuk Cabang:</h5>
              <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                <li>Pastikan nomor telepon Mas Salmon aktif sebelum melakukan panggilan koordinasi.</li>
                <li>Periksa kembali nominal transaksi dan nomor PO sebelum menekan tombol simpan di aplikasi.</li>
                <li>Status transaksi yang sudah di-print tidak dapat diubah atau dihapus kembali secara mandiri.</li>
              </ul>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionGuide;