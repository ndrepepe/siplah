import { MadeWithDyad } from "@/components/made-with-dyad";
import Generator from "./Generator";
import TransactionList from "./TransactionList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, PlusCircle, LogOut, User } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50/50">
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Transaction Manager
            </h1>
            <p className="text-slate-500">Sistem Pengelolaan Kode dan Data Transaksi Sekolah</p>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <Tabs defaultValue="input" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-12 p-1 bg-slate-200/50">
              <TabsTrigger value="input" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <PlusCircle className="w-4 h-4" />
                Input Transaksi
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ClipboardList className="w-4 h-4" />
                Daftar Data
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="input" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Generator />
          </TabsContent>

          <TabsContent value="list" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <TransactionList />
          </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;