import { MadeWithDyad } from "@/components/made-with-dyad";
import Generator from "./Generator";
import TransactionList from "./TransactionList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, PlusCircle, LogOut, User, Anchor } from "lucide-react";
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
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ 
        backgroundImage: "url('/background.jpeg')" 
      }}
    >
      <div className="min-h-screen bg-slate-50/60 backdrop-blur-[2px] p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white/80 p-6 rounded-2xl shadow-sm border border-white/20 backdrop-blur-md">
            <div className="text-center md:text-left flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg text-white">
                <Anchor className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Grand Line Manager
                </h1>
                <p className="text-slate-500 font-medium">Sistem Pengelolaan Transaksi & Kode</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-white/50 hover:bg-white">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">{user?.email}</span>
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
              <TabsList className="grid w-full max-w-md grid-cols-2 h-14 p-1.5 bg-slate-200/60 backdrop-blur-md rounded-xl">
                <TabsTrigger value="input" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md text-base font-semibold">
                  <PlusCircle className="w-5 h-5" />
                  Input Data
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md text-base font-semibold">
                  <ClipboardList className="w-5 h-5" />
                  Daftar Data
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="input" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Generator />
            </TabsContent>

            <TabsContent value="list" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TransactionList />
            </TabsContent>
          </Tabs>
        </div>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;