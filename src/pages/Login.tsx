import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";

const Login = () => {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Selamat Datang</CardTitle>
          <p className="text-sm text-muted-foreground">
            Masuk ke Transaction Manager
          </p>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
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
                  button_label: 'Masuk',
                  loading_button_label: 'Masuk...',
                  social_provider_text: 'Masuk dengan {{provider}}',
                  link_text: 'Sudah punya akun? Masuk',
                },
                sign_up: {
                  email_label: 'Alamat Email',
                  password_label: 'Kata Sandi',
                  button_label: 'Daftar',
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