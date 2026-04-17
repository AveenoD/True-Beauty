"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setAccessToken, ApiSuccess } from "./api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
  emailVerifiedAt?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  setUserFromProfile: (u: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await api.post<
        ApiSuccess<{ accessToken: string }>
      >("/users/refresh-token", {});
      const at = data.data?.accessToken;
      if (at) {
        setAccessToken(at);
        const me = await api.get<ApiSuccess<AuthUser>>("/users/profile");
        setUser(me.data.data);
        return true;
      }
    } catch {
      setAccessToken(null);
      setUser(null);
    }
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshSession();
      if (!cancelled) setIsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<
      ApiSuccess<{ user: AuthUser; accessToken: string }>
    >("/users/login", { email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/users/logout", {});
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const setUserFromProfile = useCallback((u: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...u } : null));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isReady,
      isLoggedIn: !!user,
      login,
      logout,
      refreshSession,
      setUserFromProfile,
    }),
    [user, isReady, login, logout, refreshSession, setUserFromProfile]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
