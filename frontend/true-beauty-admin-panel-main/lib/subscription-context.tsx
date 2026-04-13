"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "admin-subscription";
const CHECKOUT_STORAGE_KEY = "admin-subscription-checkout";
const INVOICE_STORAGE_KEY = "admin-subscription-invoices";

export type SubscriptionPlanId = "starter" | "professional" | "enterprise";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  priceLabel: string;
}

export type SubscriptionStatus = "active" | "expired" | "cancelled";

export interface Subscription {
  planId: SubscriptionPlanId;
  planName: string;
  price: number;
  startDate: string; // ISO date
  expiryDate: string; // ISO date
  status: SubscriptionStatus;
}

export type SubscriptionCheckoutMode = "buy" | "renew";

export interface BusinessDetails {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
}

export type DocumentType = "gst" | "pan" | "other";

export interface VerifiedDocument {
  type: DocumentType;
  fileName: string;
  uploadedAt: string; // ISO datetime
  verified: boolean;
}

export interface SubscriptionAddon {
  id: "priority-support" | "extra-users" | "advanced-analytics";
  name: string;
  price: number; // monthly
  description: string;
}

export const SUBSCRIPTION_ADDONS: SubscriptionAddon[] = [
  {
    id: "priority-support",
    name: "Priority Support",
    price: 199,
    description: "Faster response time for support requests.",
  },
  {
    id: "extra-users",
    name: "Extra Admin Users",
    price: 299,
    description: "Add more admin seats for your team.",
  },
  {
    id: "advanced-analytics",
    name: "Advanced Analytics",
    price: 399,
    description: "Deeper insights and exports for reporting.",
  },
];

export interface SubscriptionCheckoutData {
  mode: SubscriptionCheckoutMode;
  planId: SubscriptionPlanId | null;
  businessDetails: BusinessDetails | null;
  addons: SubscriptionAddon["id"][];
  documents: VerifiedDocument[];
  lastUpdatedAt: string; // ISO datetime
}

export interface SubscriptionInvoice {
  id: string;
  mode: SubscriptionCheckoutMode;
  planId: SubscriptionPlanId;
  planName: string;
  basePrice: number;
  addons: SubscriptionAddon["id"][];
  addonsTotal: number;
  total: number;
  createdAt: string; // ISO datetime
  startDate: string; // ISO date
  expiryDate: string; // ISO date
  businessDetails: BusinessDetails | null;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "starter", name: "Starter", price: 999, priceLabel: "₹999/month" },
  { id: "professional", name: "Professional", price: 1499, priceLabel: "₹1,499/month" },
  { id: "enterprise", name: "Enterprise", price: 1999, priceLabel: "₹1,999/month" },
];

const SUBSCRIPTION_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function readStored(): Subscription | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Subscription;
  } catch {
    return null;
  }
}

function readStoredCheckout(): SubscriptionCheckoutData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SubscriptionCheckoutData;
  } catch {
    return null;
  }
}

function readStoredInvoices(): SubscriptionInvoice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INVOICE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SubscriptionInvoice[];
  } catch {
    return [];
  }
}

function writeStoredInvoices(invoices: SubscriptionInvoice[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.warn("Invoice persist failed:", e);
  }
}

function writeStoredCheckout(data: SubscriptionCheckoutData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Checkout persist failed:", e);
  }
}

function getRemainingDays(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getStatus(expiryDate: string): SubscriptionStatus {
  const remaining = getRemainingDays(expiryDate);
  return remaining > 0 ? "active" : "expired";
}

interface SubscriptionContextValue {
  subscription: Subscription | null;
  remainingDays: number;
  purchasePlan: (planId: SubscriptionPlanId) => void;
  renewPlan: (planId: SubscriptionPlanId) => void;
  getPlanById: (id: SubscriptionPlanId) => SubscriptionPlan | undefined;
  getAddonById: (id: SubscriptionAddon["id"]) => SubscriptionAddon | undefined;

  /** Smart checkout state */
  checkout: SubscriptionCheckoutData | null;
  initCheckout: (mode: SubscriptionCheckoutMode, planId: SubscriptionPlanId) => SubscriptionCheckoutData;
  saveBusinessDetails: (details: BusinessDetails) => void;
  setAddons: (addonIds: SubscriptionAddon["id"][]) => void;
  upsertDocument: (doc: Omit<VerifiedDocument, "uploadedAt">) => void;
  clearCheckout: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [checkout, setCheckout] = useState<SubscriptionCheckoutData | null>(null);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      const status = getStatus(stored.expiryDate);
      setSubscription({ ...stored, status });
    }
    const storedCheckout = readStoredCheckout();
    if (storedCheckout) setCheckout(storedCheckout);
  }, []);

  // Derive current status from expiry when exposing subscription
  const subscriptionWithStatus: Subscription | null = subscription
    ? { ...subscription, status: getStatus(subscription.expiryDate) }
    : null;

  const persist = useCallback((sub: Subscription) => {
    setSubscription(sub);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
    } catch (e) {
      console.warn("Subscription persist failed:", e);
    }
  }, []);

  const createInvoice = useCallback(
    (sub: Subscription, mode: SubscriptionCheckoutMode) => {
      const currentCheckout = checkout ?? readStoredCheckout();
      const addons = currentCheckout?.addons ?? [];
      const basePlan = SUBSCRIPTION_PLANS.find((p) => p.id === sub.planId);
      const basePrice = basePlan?.price ?? sub.price;
      const addonsTotal = addons.reduce((sum, addonId) => {
        const addon = SUBSCRIPTION_ADDONS.find((a) => a.id === addonId);
        return sum + (addon?.price ?? 0);
      }, 0);
      const total = basePrice + addonsTotal;
      const invoices = readStoredInvoices();
      const invoice: SubscriptionInvoice = {
        id: `INV-${Date.now()}`,
        mode,
        planId: sub.planId,
        planName: sub.planName,
        basePrice,
        addons,
        addonsTotal,
        total,
        createdAt: new Date().toISOString(),
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        businessDetails: currentCheckout?.businessDetails ?? null,
      };
      writeStoredInvoices([...invoices, invoice]);
    },
    [checkout],
  );

  const setCheckoutAndPersist = useCallback((next: SubscriptionCheckoutData) => {
    setCheckout(next);
    writeStoredCheckout(next);
  }, []);

  const purchasePlan = useCallback(
    (planId: SubscriptionPlanId) => {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
      if (!plan) return;
      const start = new Date();
      const expiry = addDays(start, SUBSCRIPTION_DAYS);
      const sub: Subscription = {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        startDate: toISODate(start),
        expiryDate: toISODate(expiry),
        status: "active",
      };
      persist(sub);
      createInvoice(sub, "buy");
    },
    [persist, createInvoice],
  );

  const renewPlan = useCallback(
    (planId: SubscriptionPlanId) => {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
      if (!plan) return;
      const start = new Date();
      const expiry = addDays(start, SUBSCRIPTION_DAYS);
      const sub: Subscription = {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        startDate: toISODate(start),
        expiryDate: toISODate(expiry),
        status: "active",
      };
      persist(sub);
      createInvoice(sub, "renew");
    },
    [persist, createInvoice],
  );

  const getPlanById = useCallback((id: SubscriptionPlanId) => {
    return SUBSCRIPTION_PLANS.find((p) => p.id === id);
  }, []);

  const getAddonById = useCallback((id: SubscriptionAddon["id"]) => {
    return SUBSCRIPTION_ADDONS.find((a) => a.id === id);
  }, []);

  const initCheckout = useCallback(
    (mode: SubscriptionCheckoutMode, planId: SubscriptionPlanId) => {
      const existing = checkout ?? readStoredCheckout();
      const now = new Date().toISOString();

      const next: SubscriptionCheckoutData = {
        mode,
        planId,
        businessDetails: mode === "renew" ? existing?.businessDetails ?? null : null,
        addons: mode === "renew" ? existing?.addons ?? [] : [],
        documents: mode === "renew" ? existing?.documents ?? [] : [],
        lastUpdatedAt: now,
      };

      setCheckoutAndPersist(next);
      return next;
    },
    [checkout, setCheckoutAndPersist]
  );

  const saveBusinessDetails = useCallback(
    (details: BusinessDetails) => {
      if (!checkout) return;
      setCheckoutAndPersist({
        ...checkout,
        businessDetails: details,
        lastUpdatedAt: new Date().toISOString(),
      });
    },
    [checkout, setCheckoutAndPersist]
  );

  const setAddons = useCallback(
    (addonIds: SubscriptionAddon["id"][]) => {
      if (!checkout) return;
      const current = checkout.addons ?? [];
      if (
        current.length === addonIds.length &&
        current.every((id, index) => id === addonIds[index])
      ) {
        return;
      }
      setCheckoutAndPersist({
        ...checkout,
        addons: addonIds,
        lastUpdatedAt: new Date().toISOString(),
      });
    },
    [checkout, setCheckoutAndPersist]
  );

  const upsertDocument = useCallback(
    (doc: Omit<VerifiedDocument, "uploadedAt">) => {
      if (!checkout) return;
      const uploadedAt = new Date().toISOString();
      const nextDocs = [
        ...checkout.documents.filter((d) => d.type !== doc.type),
        { ...doc, uploadedAt },
      ];
      setCheckoutAndPersist({
        ...checkout,
        documents: nextDocs,
        lastUpdatedAt: new Date().toISOString(),
      });
    },
    [checkout, setCheckoutAndPersist]
  );

  const clearCheckout = useCallback(() => {
    setCheckout(null);
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(CHECKOUT_STORAGE_KEY);
    } catch (e) {
      console.warn("Checkout clear failed:", e);
    }
  }, []);

  const remainingDays = subscriptionWithStatus
    ? getRemainingDays(subscriptionWithStatus.expiryDate)
    : 0;

  const value = useMemo<SubscriptionContextValue>(() => {
    return {
      subscription: subscriptionWithStatus,
      remainingDays,
      purchasePlan,
      renewPlan,
      getPlanById,
      getAddonById,
      checkout,
      initCheckout,
      saveBusinessDetails,
      setAddons,
      upsertDocument,
      clearCheckout,
    };
  }, [
    subscriptionWithStatus,
    remainingDays,
    purchasePlan,
    renewPlan,
    getPlanById,
    getAddonById,
    checkout,
    initCheckout,
    saveBusinessDetails,
    setAddons,
    upsertDocument,
    clearCheckout,
  ]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}

export { getRemainingDays, getStatus };
