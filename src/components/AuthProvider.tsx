import * as React from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: string;
  updateRole: (newRole: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<string>("STAFF");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Ambil sesi awal
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setRole(currentUser.user_metadata?.role || "STAFF");
      }
      setLoading(false);
    });

    // Dengar perubahan status auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setRole(currentUser.user_metadata?.role || "STAFF");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateRole = async (newRole: string) => {
    if (!user) return;
    const { data, error } = await supabase.auth.updateUser({
      data: { role: newRole }
    });
    if (error) throw error;
    setRole(newRole);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, role, updateRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};