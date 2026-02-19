import React from "react";
import api from "../lib/api";

export type AuthUser = {
  userId: number;
  email?: string;
  username?: string;
  roleId?: number;
  roleName?: string;
};

type AuthStatus = "loading" | "authenticated" | "guest";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  refresh: () => Promise<void>;
  setAuthenticated: (user: AuthUser) => void;
  setGuest: () => void;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>("loading");
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const hasBootstrappedRef = React.useRef(false);

  const setAuthenticated = React.useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const setGuest = React.useCallback(() => {
    setUser(null);
    setStatus("guest");
  }, []);

  const refresh = React.useCallback(async () => {
    setStatus("loading");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 4000);

    try {
      const response = await api.get("/me", { signal: controller.signal });
      setAuthenticated(response.data);
    } catch {
      setGuest();
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, [setAuthenticated, setGuest]);

  React.useEffect(() => {
    // Avoid duplicate /me bootstrap call triggered by React StrictMode in dev.
    if (hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;
    refresh();
  }, [refresh]);

  const value = React.useMemo(
    () => ({ status, user, refresh, setAuthenticated, setGuest }),
    [status, user, refresh, setAuthenticated, setGuest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
