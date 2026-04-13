"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  generateCouponCode,
  type Coupon,
  type CouponStatus,
} from "@/lib/coupons-data";
import { PRODUCT_CATEGORIES } from "@/lib/products-data";
import type { CouponFormValues } from "@/lib/coupons-context";

const STATUS_OPTIONS: { value: CouponStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  ...PRODUCT_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
];

const emptyForm: CouponFormValues = {
  code: "",
  discountType: "fixed",
  discountValue: 0,
  minOrderValue: 0,
  maxDiscountCap: null,
  usageLimitTotal: null,
  usageLimitPerUser: null,
  applicableRole: "all",
  applicableProductIds: [],
  applicableCategoryIds: [],
  startDate: "",
  expiryDate: "",
  status: "active",
};

function toLocalDateOnly(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

interface CouponFormProps {
  initialValues?: Coupon | null;
  productOptions?: { id: string; name: string; price: number; category: string }[];
  onSubmit: (values: CouponFormValues) => void;
  onCancel: () => void;
}

export function CouponForm({
  initialValues,
  productOptions = [],
  onSubmit,
  onCancel,
}: CouponFormProps) {
  const [values, setValues] = useState<CouponFormValues>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialValues) {
      const percent =
        initialValues.discountType === "percentage"
          ? initialValues.discountValue
          : initialValues.minOrderValue > 0
            ? (initialValues.discountValue / initialValues.minOrderValue) * 100
            : 0;
      setValues({
        code: initialValues.code,
        discountType: "percentage",
        discountValue: percent,
        minOrderValue: initialValues.minOrderValue,
        maxDiscountCap: initialValues.maxDiscountCap,
        usageLimitTotal: initialValues.usageLimitTotal,
        usageLimitPerUser: initialValues.usageLimitPerUser,
        applicableRole: initialValues.applicableRole,
        applicableProductIds: initialValues.applicableProductIds ?? [],
        applicableCategoryIds: initialValues.applicableCategoryIds ?? [],
        startDate: toLocalDateOnly(initialValues.startDate),
        expiryDate: toLocalDateOnly(initialValues.expiryDate),
        status: initialValues.status,
      });
    } else {
      setValues(emptyForm);
    }
    setErrors({});
  }, [initialValues]);

  const validate = useMemo(() => {
    return (
      v: CouponFormValues,
      isEdit: boolean
    ): Record<string, string> => {
      const err: Record<string, string> = {};
      if (!v.code.trim()) err.code = "Coupon code is required.";
      const discount = Number(v.discountValue);
      if (Number.isNaN(discount) || discount <= 0 || discount > 100) {
        err.discountValue = "Discount percentage must be between 1 and 100.";
      }
      if (!v.startDate?.trim()) err.startDate = "Start date is required.";
      if (!v.expiryDate?.trim()) err.expiryDate = "Expiry date is required.";
      const start = v.startDate ? new Date(v.startDate).getTime() : 0;
      const expiry = v.expiryDate ? new Date(v.expiryDate).getTime() : 0;
      if (v.expiryDate && v.startDate && expiry < start)
        err.expiryDate = err.expiryDate || "Expiry date must be after start date.";
      if (!isEdit && v.expiryDate && new Date(v.expiryDate) < new Date())
        err.expiryDate = err.expiryDate || "Expiry date cannot be in the past.";
      return err;
    };
  }, []);

  const handleAutoGenerate = () => {
    setValues((prev) => ({ ...prev, code: generateCouponCode() }));
    setErrors((prev) => ({ ...prev, code: "" }));
  };

  const totalAmount = useMemo(() => {
    const productIds = values.applicableProductIds ?? [];
    const categoryIds = values.applicableCategoryIds ?? [];

    if (productIds.length > 0) {
      return productIds.reduce(
        (sum, id) => sum + (productOptions.find((p) => p.id === id)?.price ?? 0),
        0
      );
    }

    if (categoryIds.length > 0) {
      return productOptions
        .filter((p) => categoryIds.includes(p.category))
        .reduce((sum, p) => sum + p.price, 0);
    }

    return productOptions.reduce((sum, p) => sum + p.price, 0);
  }, [values.applicableProductIds, values.applicableCategoryIds, productOptions]);

  const discountPercent = Number(values.discountValue) || 0;
  const derivedAmount = totalAmount > 0 ? (totalAmount * discountPercent) / 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = { ...values };
    const err = validate(v, !!initialValues);
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    const num = (x: number | string | null | undefined): number | null =>
      x == null || x === "" ? null : Number(x);
    onSubmit({
      ...v,
      code: v.code.trim().toUpperCase(),
      discountType: "percentage",
      discountValue: Number(v.discountValue) || 0,
      minOrderValue: totalAmount,
      maxDiscountCap: null,
      usageLimitTotal: null,
      usageLimitPerUser: null,
      applicableProductIds: v.applicableProductIds ?? [],
      applicableCategoryIds: v.applicableCategoryIds ?? [],
    });
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Coupon Code */}
      <div>
        <label htmlFor="coupon-code" className={labelClass}>
          Coupon Code <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            id="coupon-code"
            type="text"
            value={values.code}
            onChange={(e) =>
              setValues((v) => ({ ...v, code: e.target.value.toUpperCase() }))
            }
            className={`${inputClass} flex-1`}
            placeholder="e.g. SAVE20"
          />
          <button
            type="button"
            onClick={handleAutoGenerate}
            className="shrink-0 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-medium transition-colors"
          >
            Auto generate
          </button>
        </div>
        {errors.code && (
          <p className="mt-1 text-sm text-red-600">{errors.code}</p>
        )}
      </div>

      {/* Applicable Categories */}
      <div>
        <label htmlFor="applicable-categories" className={labelClass}>
          Applicable Categories
        </label>
        <select
          id="applicable-categories"
          value={(values.applicableCategoryIds ?? [])[0] ?? ""}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              applicableCategoryIds: e.target.value ? [e.target.value] : [],
            }))
          }
          className={`${inputClass} bg-white`}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Applicable Products */}
      <div>
        <label htmlFor="applicable-products" className={labelClass}>
          Applicable Products
        </label>
        <select
          id="applicable-products"
          value={(values.applicableProductIds ?? [])[0] ?? ""}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              applicableProductIds: e.target.value ? [e.target.value] : [],
            }))
          }
          className={`${inputClass} bg-white`}
        >
          <option value="">All products</option>
          {productOptions.map((prod) => (
            <option key={prod.id} value={prod.id}>
              {prod.name}
            </option>
          ))}
        </select>
      </div>

      {/* Total amount */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
        <p className="text-sm font-medium text-gray-700">
          {values.applicableProductIds?.length
            ? "Total amount (selected products)"
            : values.applicableCategoryIds?.length
              ? `Total amount (${values.applicableCategoryIds[0]})`
              : "Total amount (all categories)"}
        </p>
        <p className="mt-1 text-xl font-semibold text-gray-900">
          {totalAmount > 0
            ? `₹${totalAmount.toLocaleString("en-IN")}`
            : "—"}
        </p>
        {totalAmount === 0 && productOptions.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Select a category or product above to see total and set discount.
          </p>
        )}
      </div>

      {/* Discount: % and Amount (synced) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="discount-percent" className={labelClass}>
            Discount (%) <span className="text-red-500">*</span>
          </label>
          <input
            id="discount-percent"
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={discountPercent === 0 ? "" : discountPercent}
            onChange={(e) => {
              const raw = e.target.value;
              const num = raw === "" ? 0 : Number(raw);
              setValues((v) => ({ ...v, discountValue: num }));
              setErrors((e) => ({ ...e, discountValue: "" }));
            }}
            className={inputClass}
            placeholder="e.g. 20"
          />
          {totalAmount > 0 && discountPercent > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              = ₹{Math.round(derivedAmount).toLocaleString("en-IN")} off
            </p>
          )}
        </div>
        <div>
          <label htmlFor="discount-amount" className={labelClass}>
            Discount (₹)
          </label>
          <input
            id="discount-amount"
            type="number"
            min={0}
            max={totalAmount}
            step={1}
            disabled={totalAmount === 0}
            value={totalAmount > 0 && derivedAmount > 0 ? Math.round(derivedAmount) : ""}
            onChange={(e) => {
              const raw = e.target.value;
              const amount = raw === "" ? 0 : Number(raw);
              const pct =
                totalAmount > 0 && amount >= 0
                  ? Math.min(100, (amount / totalAmount) * 100)
                  : 0;
              setValues((v) => ({ ...v, discountValue: pct }));
              setErrors((e) => ({ ...e, discountValue: "" }));
            }}
            className={inputClass}
            placeholder="e.g. 100"
          />
          {totalAmount > 0 && derivedAmount > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              = {discountPercent.toFixed(1)}%
            </p>
          )}
        </div>
      </div>
      {errors.discountValue && (
        <p className="text-sm text-red-600">{errors.discountValue}</p>
      )}

      {/* Start & Expiry Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className={labelClass}>
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            id="start-date"
            type="date"
            value={values.startDate}
            onChange={(e) =>
              setValues((v) => ({ ...v, startDate: e.target.value }))
            }
            className={inputClass}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>
        <div>
          <label htmlFor="expiry-date" className={labelClass}>
            Expiry Date <span className="text-red-500">*</span>
          </label>
          <input
            id="expiry-date"
            type="date"
            value={values.expiryDate}
            onChange={(e) =>
              setValues((v) => ({ ...v, expiryDate: e.target.value }))
            }
            className={inputClass}
          />
          {errors.expiryDate && (
            <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="coupon-status" className={labelClass}>
          Status
        </label>
        <select
          id="coupon-status"
          value={values.status}
          onChange={(e) =>
            setValues((v) => ({ ...v, status: e.target.value as CouponStatus }))
          }
          className={`${inputClass} bg-white`}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors"
        >
          {initialValues ? "Update Coupon" : "Create Coupon"}
        </button>
      </div>
    </form>
  );
}
