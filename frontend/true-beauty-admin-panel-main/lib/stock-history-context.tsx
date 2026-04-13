"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export const STOCK_ADJUST_REASONS = [
  "Restock",
  "Sale / Order",
  "Inventory correction",
  "Damage / Write-off",
  "Return",
  "Other",
] as const;

export type StockAdjustReason = (typeof STOCK_ADJUST_REASONS)[number];

export type StockAdjustType = "add" | "reduce";

export interface StockHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  at: string;
  type: StockAdjustType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: StockAdjustReason;
  note?: string | null;
}

interface StockHistoryContextValue {
  entries: StockHistoryEntry[];
  addEntry: (entry: StockHistoryEntry) => void;
  recordChange: (input: {
    productId: string;
    productName: string;
    previousStock: number;
    newStock: number;
    quantity: number;
    type: StockAdjustType;
    reason: StockAdjustReason;
    note?: string | null;
  }) => void;
}

const StockHistoryContext = createContext<StockHistoryContextValue | null>(null);

export function StockHistoryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<StockHistoryEntry[]>([]);

  const addEntry = useCallback((entry: StockHistoryEntry) => {
    setEntries((prev) => [entry, ...prev]);
  }, []);

  const recordChange = useCallback(
    (input: {
      productId: string;
      productName: string;
      previousStock: number;
      newStock: number;
      quantity: number;
      type: StockAdjustType;
      reason: StockAdjustReason;
      note?: string | null;
    }) => {
      const entry: StockHistoryEntry = {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString(),
        ...input,
      };
      setEntries((prev) => [entry, ...prev]);
    },
    []
  );

  const value: StockHistoryContextValue = useMemo(
    () => ({
      entries,
      addEntry,
      recordChange,
    }),
    [entries, addEntry, recordChange]
  );

  return (
    <StockHistoryContext.Provider value={value}>
      {children}
    </StockHistoryContext.Provider>
  );
}

export function useStockHistory() {
  const ctx = useContext(StockHistoryContext);
  if (!ctx) throw new Error("useStockHistory must be used within StockHistoryProvider");
  return ctx;
}

