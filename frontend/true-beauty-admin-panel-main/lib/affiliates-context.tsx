"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  MOCK_AFFILIATES,
  type Affiliate,
  type AffiliateStatus,
  type CommissionLog,
  type Withdrawal,
  type WithdrawalAuditEvent,
  type WithdrawalStatus,
} from "./affiliates-data";

interface AffiliatesContextValue {
  affiliates: Affiliate[];
  getAffiliateById: (id: string) => Affiliate | undefined;
  setAffiliateStatus: (id: string, status: AffiliateStatus) => void;
  updateCommissionRate: (id: string, rate: number) => void;
  adjustWallet: (id: string, amount: number, reason: string) => void;
  updateWithdrawalStatus: (
    id: string,
    withdrawalId: string,
    status: WithdrawalStatus,
    notes?: string
  ) => void;
}

const AffiliatesContext = createContext<AffiliatesContextValue | null>(null);

export function AffiliatesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [affiliates, setAffiliates] = useState<Affiliate[]>(() =>
    MOCK_AFFILIATES.map((a) => ({ ...a }))
  );

  const getAffiliateById = useCallback(
    (id: string) => affiliates.find((a) => a.id === id),
    [affiliates]
  );

  const updateAffiliate = useCallback(
    (id: string, updater: (prev: Affiliate) => Affiliate) => {
      setAffiliates((prev) =>
        prev.map((a) => (a.id === id ? updater(a) : a))
      );
    },
    []
  );

  const setAffiliateStatus = useCallback(
    (id: string, status: AffiliateStatus) => {
      updateAffiliate(id, (prev) => ({
        ...prev,
        status,
      }));
    },
    [updateAffiliate]
  );

  const updateCommissionRate = useCallback(
    (id: string, rate: number) => {
      const normalizedRate = Number.isFinite(rate) ? Math.max(0, rate) : 0;
      updateAffiliate(id, (prev) => ({
        ...prev,
        commissionRate: normalizedRate,
      }));
    },
    [updateAffiliate]
  );

  const adjustWallet = useCallback(
    (id: string, amount: number, reason: string) => {
      if (!amount || !Number.isFinite(amount)) return;
      const trimmedReason = reason.trim() || "Manual adjustment by admin";

      updateAffiliate(id, (prev) => {
        const newBalance = prev.walletBalance + amount;

        const log: CommissionLog = {
          id:
            "log-" +
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).slice(2, 8),
          date: new Date().toISOString(),
          type: "manual_adjustment",
          description: trimmedReason,
          amount,
        };

        return {
          ...prev,
          walletBalance: newBalance,
          commissionLogs: [...prev.commissionLogs, log],
        };
      });
    },
    [updateAffiliate]
  );

  const pushAuditEvent = (
    w: Withdrawal,
    action: WithdrawalAuditEvent["action"],
    notes?: string
  ): Withdrawal => {
    const event: WithdrawalAuditEvent = {
      date: new Date().toISOString(),
      action,
      notes,
    };
    const auditEvents = [...(w.auditEvents ?? []), event];
    return { ...w, auditEvents };
  };

  const updateWithdrawalStatus = useCallback(
    (id: string, withdrawalId: string, status: WithdrawalStatus, notes?: string) => {
      updateAffiliate(id, (prev) => {
        let walletBalance = prev.walletBalance;
        let createdLog: CommissionLog | null = null;

        const withdrawals = prev.withdrawals.map((w) => {
          if (w.id !== withdrawalId) return w;
          if (w.status === status) return w;

          let processedAt = w.processedAt;
          let paidAt = w.paidAt;
          let updated: Withdrawal = { ...w };

          if (status === "approved" && w.status === "pending") {
            processedAt = new Date().toISOString();
            walletBalance = Math.max(0, walletBalance - w.amount);

            createdLog = {
              id:
                "log-" +
                Date.now().toString(36) +
                "-" +
                Math.random().toString(36).slice(2, 8),
              date: processedAt,
              type: "withdrawal",
              description: `Withdrawal ${w.id} approved`,
              amount: -w.amount,
            };

            updated = pushAuditEvent(updated, "approved", notes);
          } else if (status === "rejected" && w.status === "pending") {
            processedAt = new Date().toISOString();
            updated = pushAuditEvent(updated, "rejected", notes);
          } else if (status === "paid" && w.status === "approved") {
            paidAt = new Date().toISOString();
            updated = pushAuditEvent(updated, "marked_paid", notes);
          }

          return {
            ...updated,
            status,
            processedAt,
            paidAt,
          };
        });

        let commissionLogs = prev.commissionLogs;
        if (createdLog) {
          commissionLogs = [...commissionLogs, createdLog];
        }

        return {
          ...prev,
          walletBalance,
          withdrawals,
          commissionLogs,
        };
      });
    },
    [updateAffiliate]
  );

  const value: AffiliatesContextValue = useMemo(
    () => ({
      affiliates,
      getAffiliateById,
      setAffiliateStatus,
      updateCommissionRate,
      adjustWallet,
      updateWithdrawalStatus,
    }),
    [
      affiliates,
      getAffiliateById,
      setAffiliateStatus,
      updateCommissionRate,
      adjustWallet,
      updateWithdrawalStatus,
    ]
  );

  return (
    <AffiliatesContext.Provider value={value}>
      {children}
    </AffiliatesContext.Provider>
  );
}

export function useAffiliates() {
  const ctx = useContext(AffiliatesContext);
  if (!ctx) {
    throw new Error("useAffiliates must be used within AffiliatesProvider");
  }
  return ctx;
}

