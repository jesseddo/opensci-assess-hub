import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearAuthSession,
  createPrototypeSession,
  readAuthSession,
  writeAuthSession,
  type AuthSession,
} from "@/lib/auth-session";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  signIn: (email: string, displayName: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession());

  const signIn = useCallback((email: string, displayName: string) => {
    const next = createPrototypeSession(email, displayName);
    writeAuthSession(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    clearAuthSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: session != null,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
