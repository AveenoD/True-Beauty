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

export type CartProduct = {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  image?: string | null;
  stock: number;
  stockStatus: string;
};

export type CartItem = {
  id: string; // cart item id
  productId: string;
  quantity: number;
  price: number;
  product: CartProduct;
};

type CartSummary = {
  subtotal: number;
  itemCount: number;
  uniqueItemCount: number;
};

type CartState = {
  items: CartItem[];
  summary: CartSummary;
};

type CartContextValue = {
  items: CartItem[];
  summary: CartSummary;
  cartCount: number;
  isReady: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_SUMMARY: CartSummary = { subtotal: 0, itemCount: 0, uniqueItemCount: 0 };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isReady: authReady, isLoggedIn } = useAuth();
  const [state, setState] = useState<CartState>({ items: [], summary: EMPTY_SUMMARY });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!authReady) return;
    if (!isLoggedIn) {
      setState({ items: [], summary: EMPTY_SUMMARY });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ success: boolean; data: CartState }>("/cart");
      setState({
        items: data?.data?.items ?? [],
        summary: data?.data?.summary ?? EMPTY_SUMMARY,
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load cart");
      setState({ items: [], summary: EMPTY_SUMMARY });
    } finally {
      setLoading(false);
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

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      if (!authReady || !isLoggedIn) {
        throw new Error("NOT_LOGGED_IN");
      }
      setError(null);
      setLoading(true);
      try {
        await api.post("/cart/items", { productId, quantity });
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [authReady, isLoggedIn, refresh]
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!authReady || !isLoggedIn) {
        throw new Error("NOT_LOGGED_IN");
      }
      setError(null);
      setLoading(true);
      try {
        await api.put(`/cart/items/${encodeURIComponent(itemId)}`, { quantity });
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [authReady, isLoggedIn, refresh]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!authReady || !isLoggedIn) {
        throw new Error("NOT_LOGGED_IN");
      }
      setError(null);
      setLoading(true);
      try {
        await api.delete(`/cart/items/${encodeURIComponent(itemId)}`);
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [authReady, isLoggedIn, refresh]
  );

  const clear = useCallback(async () => {
    if (!authReady || !isLoggedIn) {
      throw new Error("NOT_LOGGED_IN");
    }
    setError(null);
    setLoading(true);
    try {
      await api.delete("/cart");
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [authReady, isLoggedIn, refresh]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      summary: state.summary,
      cartCount: state.summary.itemCount ?? 0,
      isReady,
      loading,
      error,
      refresh,
      addItem,
      updateItemQuantity,
      removeItem,
      clear,
    }),
    [state, isReady, loading, error, refresh, addItem, updateItemQuantity, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

