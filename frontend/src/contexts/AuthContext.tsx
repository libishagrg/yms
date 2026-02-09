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

  const refresh = React.useCallback(async () => {
    setStatus("loading");
    try {
      const response = await api.get("/me");
      setUser(response.data);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("guest");
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const setAuthenticated = React.useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const setGuest = React.useCallback(() => {
    setUser(null);
    setStatus("guest");
  }, []);

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
