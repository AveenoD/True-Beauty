"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./api";
import { useAuth } from "./auth-context";

type WishlistContextValue = {
  wishlistCount: number;
  isReady: boolean;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isReady: authReady, isLoggedIn } = useAuth();
  const [count, setCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!authReady) return;
    if (!isLoggedIn) {
      setCount(0);
      return;
    }
    try {
      const { data } = await api.get<{ data?: unknown[] }>("/wishlist");
      const items = data?.data ?? [];
      setCount(Array.isArray(items) ? items.length : 0);
    } catch {
      setCount(0);
    }
  }, [authReady, isLoggedIn]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setIsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      wishlistCount: count,
      isReady,
      refresh,
    }),
    [count, isReady, refresh]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
