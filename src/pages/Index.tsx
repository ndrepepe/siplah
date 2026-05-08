"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import Generator from "./Generator";
import TransactionList from "./TransactionList";
import Dashboard from "./Dashboard";
import BulkImport from "@/components/BulkImport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, PlusCircle, LogOut, User, Anchor, LayoutDashboard, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#640D5F]/10 via-[#B12C00]/5 to-[#FFCC00]/10 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white/90 p-6 rounded-3xl shadow-xl shadow-[#640D5F]/5 border border-[#640D5F]/10 backdrop-blur-md">
          <div className="text-center md:text-left flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/30">
              <Anchor className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Grand Line Manager
              </h1>
              <p className="text-primary font-bold">Sistem Pengelolaan Transaksi & Kode</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-white/50 hover:bg-accent hover:text-white border-primary/20 rounded-xl">
                  <User className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline font-bold text-slate-700">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border-primary/10">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-600 cursor-pointer font-medium">
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <Tabs defaultValue="dashboard" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 h-16 p-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-primary/10">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg text-sm md:text-base font-bold transition-all"
              >
                <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="input" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg text-sm md:text-base font-bold transition-all"
              >
                <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Input</span>
              </TabsTrigger>
              <TabsTrigger 
                value="bulk" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg text-sm md:text-base font-bold transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Input Masal</span>
              </TabsTrigger>
              <TabsTrigger 
                value="list" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg text-sm md:text-base font-bold transition-all"
              >
                <ClipboardList className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Daftar</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Dashboard />
          </TabsContent>

          <TabsContent value="input" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Generator />
          </TabsContent>

          <TabsContent value="bulk" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BulkImport />
          </TabsContent>

          <TabsContent value="list" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TransactionList />
          </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;