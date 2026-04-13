"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  MOCK_COUPONS,
  generateCouponId,
  type Coupon,
  type CouponStatus,
} from "./coupons-data";

export type CouponFormValues = Omit<
  Coupon,
  "id" | "usedCount" | "createdAt" | "updatedAt"
> & {
  id?: string;
};

interface CouponsContextValue {
  coupons: Coupon[];
  addCoupon: (values: CouponFormValues) => Coupon;
  updateCoupon: (id: string, values: Partial<CouponFormValues>) => void;
  toggleCouponStatus: (id: string) => void;
  deleteCoupon: (id: string) => void;
  getCouponById: (id: string) => Coupon | undefined;
}

const CouponsContext = createContext<CouponsContextValue | null>(null);

export function CouponsProvider({ children }: { children: React.ReactNode }) {
  const [coupons, setCoupons] = useState<Coupon[]>(() =>
    MOCK_COUPONS.map((c) => ({ ...c }))
  );

  const addCoupon = useCallback((values: CouponFormValues): Coupon => {
    const now = new Date().toISOString();
    const newCoupon: Coupon = {
      id: generateCouponId(),
      code: values.code.trim().toUpperCase(),
      discountType: values.discountType,
      discountValue: values.discountValue,
      minOrderValue: values.minOrderValue ?? 0,
      maxDiscountCap: values.maxDiscountCap ?? null,
      usageLimitTotal: values.usageLimitTotal ?? null,
      usageLimitPerUser: values.usageLimitPerUser ?? null,
      usedCount: 0,
      applicableRole: values.applicableRole ?? "all",
      applicableProductIds: values.applicableProductIds ?? [],
      applicableCategoryIds: values.applicableCategoryIds ?? [],
      startDate: values.startDate,
      expiryDate: values.expiryDate,
      status: values.status ?? "active",
      createdAt: now,
      updatedAt: now,
    };
    setCoupons((prev) => [...prev, newCoupon]);
    return newCoupon;
  }, []);

  const updateCoupon = useCallback(
    (id: string, values: Partial<CouponFormValues>) => {
      setCoupons((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const code = values.code !== undefined ? values.code.trim().toUpperCase() : c.code;
          return {
            ...c,
            ...values,
            code,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  const toggleCouponStatus = useCallback((id: string) => {
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next: CouponStatus = c.status === "active" ? "disabled" : "active";
        return { ...c, status: next, updatedAt: new Date().toISOString() };
      })
    );
  }, []);

  const deleteCoupon = useCallback((id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getCouponById = useCallback(
    (id: string) => coupons.find((c) => c.id === id),
    [coupons]
  );

  const value = useMemo(
    () => ({
      coupons,
      addCoupon,
      updateCoupon,
      toggleCouponStatus,
      deleteCoupon,
      getCouponById,
    }),
    [
      coupons,
      addCoupon,
      updateCoupon,
      toggleCouponStatus,
      deleteCoupon,
      getCouponById,
    ]
  );

  return (
    <CouponsContext.Provider value={value}>{children}</CouponsContext.Provider>
  );
}

export function useCoupons(): CouponsContextValue {
  const ctx = useContext(CouponsContext);
  if (!ctx) {
    throw new Error("useCoupons must be used within CouponsProvider");
  }
  return ctx;
}
