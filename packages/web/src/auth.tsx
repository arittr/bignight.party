import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface AuthState {
  token: string | null;
  playerId: string | null;
  name: string | null;
  isAdmin: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, playerId: string, name: string) => void;
  loginAdmin: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "bignight_auth";

function loadAuth(): AuthState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore parse errors
  }
  return { token: null, playerId: null, name: null, isAdmin: false };
}

function saveAuth(state: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  const login = useCallback((token: string, playerId: string, name: string) => {
    const state = { token, playerId, name, isAdmin: false };
    setAuth(state);
    saveAuth(state);
  }, []);

  const loginAdmin = useCallback((token: string) => {
    const state = { token, playerId: "admin", name: "Admin", isAdmin: true };
    setAuth(state);
    saveAuth(state);
  }, []);

  const logout = useCallback(() => {
    const state = { token: null, playerId: null, name: null, isAdmin: false };
    setAuth(state);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Validate session on mount — if the player was deleted (e.g., DB reset),
  // clear stale auth and redirect to sign-in
  useEffect(() => {
    if (!auth.token || auth.isAdmin) return;
    fetch("/api/player/me", {
      headers: { Authorization: `Bearer ${auth.token}` },
    }).then((res) => {
      if (res.status === 401) {
        logout();
      }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ ...auth, login, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
