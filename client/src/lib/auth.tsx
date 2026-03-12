import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function sessionToUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  const u = session.user;
  return {
    id: u.id,
    email: u.email ?? "",
    fullName: u.user_metadata?.full_name ?? u.email ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Invalid login")) {
        throw new Error("Neplatný email nebo heslo");
      }
      throw new Error(error.message);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const user = sessionToUser(session);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
