import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Anchor } from "lucide-react";

const Login = () => {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: "url('dyad-media://media/siplah/.dyad/media/291f0f74bdc025d42e9f44f62f5b0ad7.jpg')" 
      }}
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
      
      <Card className="w-full max-w-md shadow-2xl border-none relative z-10 bg-white/95 backdrop-blur-md overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-2 text-center pt-8">
          <div className="mx-auto bg-primary w-16 h-16 rounded-full flex items-center justify-center text-white mb-2 shadow-lg">
            <Anchor className="w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter text-slate-900">
            GRAND LINE
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium">
            Masuk untuk memulai petualangan transaksi Anda
          </p>
        </CardHeader>
        <CardContent className="pb-8">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                  },
                  radii: {
                    borderRadiusButton: '0.75rem',
                    inputBorderRadius: '0.75rem',
                  }
                }
              }
            }}
            providers={[]}
            theme="light"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Alamat Email',
                  password_label: 'Kata Sandi',
                  button_label: 'Masuk Sekarang',
                  loading_button_label: 'Memproses...',
                  social_provider_text: 'Masuk dengan {{provider}}',
                  link_text: 'Sudah punya akun? Masuk',
                },
                sign_up: {
                  email_label: 'Alamat Email',
                  password_label: 'Kata Sandi',
                  button_label: 'Daftar Akun',
                  loading_button_label: 'Mendaftar...',
                  link_text: 'Belum punya akun? Daftar',
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;