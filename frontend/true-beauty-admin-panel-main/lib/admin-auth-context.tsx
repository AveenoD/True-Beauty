"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  refreshAdminAccessToken,
  setAccessToken,
  setAdminRefreshToken,
  getAdminRefreshToken,
  ApiSuccess,
} from "./api";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string | null;
  slug?: string | null;
  role: string;
  lastLoginAt?: string | null;
};

export type AdminSubscription = {
  id: string;
  status: string;
  startDate?: string | null;
  expiryDate: string | null;
  plan: {
    id: string;
    name: string;
    maxProducts: number | null;
  } | null;
} | null;

type AuthContextValue = {
  admin: AdminUser | null;
  subscription: AdminSubscription;
  isReady: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  /** Re-fetch admin + subscription from `GET /admins/profile` (e.g. dashboard). */
  refreshProfile: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [subscription, setSubscription] = useState<AdminSubscription>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const me = await api.get<
        ApiSuccess<{ admin: AdminUser; subscription: AdminSubscription }>
      >("/admins/profile");
      setAdmin(me.data.data.admin);
      setSubscription(me.data.data.subscription ?? null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const at = await refreshAdminAccessToken();
      if (at) {
        setAccessToken(at);
        const me = await api.get<
          ApiSuccess<{ admin: AdminUser; subscription: AdminSubscription }>
        >("/admins/profile");
        setAdmin(me.data.data.admin);
        setSubscription(me.data.data.subscription ?? null);
        return true;
      }
    } catch {
      setAccessToken(null);
      setAdmin(null);
      setSubscription(null);
    }
    return false;
  }, []);

  // Track when initial auth bootstrap has completed.
  // isReady becomes true ONLY when we have an admin OR when we've confirmed
  // there is no valid session. This prevents ProductsProvider from racing ahead
  // and calling /admin/products before the access token is restored.

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // First try using any stored access token (interceptor will attach it).
        // If it's expired, the interceptor will attempt a single-flight refresh and retry.
        const me = await api.get<
          ApiSuccess<{ admin: AdminUser; subscription: AdminSubscription }>
        >("/admins/profile");
        if (!cancelled) {
          setAdmin(me.data.data.admin);
          setSubscription(me.data.data.subscription ?? null);
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setAdmin(null);
          setSubscription(null);
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for session-expired events from api interceptor
  // This handles the case where a 401 refresh fails (e.g. RT invalid/expired)
  useEffect(() => {
    const handleSessionExpired = () => {
      setAccessToken(null);
      setAdmin(null);
      setSubscription(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    };
    window.addEventListener("tb:auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("tb:auth:session-expired", handleSessionExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Backend sets refreshToken cookie and returns it in JSON so we can persist a copy
    // when the admin UI and API run on different ports (cookie may not be sent).
    const { data } = await api.post<
      ApiSuccess<{ admin: AdminUser; accessToken: string; refreshToken: string }>
    >("/admins/login", { email, password });
    setAccessToken(data.data.accessToken);
    if (data.data.refreshToken) {
      setAdminRefreshToken(data.data.refreshToken);
    }
    setAdmin(data.data.admin);
    try {
      const me = await api.get<
        ApiSuccess<{ admin: AdminUser; subscription: AdminSubscription }>
      >("/admins/profile");
      setAdmin(me.data.data.admin);
      setSubscription(me.data.data.subscription ?? null);
    } catch {
      setSubscription(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/admins/logout", {
        refreshToken: getAdminRefreshToken() ?? undefined,
      });
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setAdmin(null);
    setSubscription(null);
  }, []);

  const value = useMemo(
    () => ({
      admin,
      subscription,
      isReady,
      isLoggedIn: !!admin,
      login,
      logout,
      refreshSession,
      refreshProfile,
    }),
    [admin, subscription, isReady, login, logout, refreshSession, refreshProfile]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}

export function useSubscriptionFromAuth() {
  return useAdminAuth().subscription;
}