"use client";

import React from "react";
import Image from "next/image";

/** Reusable card wrapper – same look as product cards (rounded-2xl, border, shadow). */
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#f8c6d0]/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

export interface ProductOrderCardProps {
  productImage?: string | null;
  productName: string;
  price: number;
  quantity: number;
  totalAmount: number;
  orderDate: string;
  orderStatus: string;
  /** Optional category label shown in horizontal layout */
  category?: string;
  currency?: string;
  formatDate?: (dateStr: string) => string;
  onClick?: () => void;
  /** Show "Via Affiliate" badge when order was made through affiliate link */
  showAffiliateBadge?: boolean;
  /** Card layout: vertical (image on top) or horizontal (image on left) */
  layout?: "vertical" | "horizontal";
}

function defaultFormatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

function defaultFormatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function inferCategoryFromName(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (
    lower.includes("moisturizer") ||
    lower.includes("cream") ||
    lower.includes("face wash") ||
    lower.includes("cleanser") ||
    lower.includes("toner") ||
    lower.includes("serum") ||
    lower.includes("sunscreen") ||
    lower.includes("mask")
  ) {
    return "Skincare";
  }
  if (lower.includes("hair")) {
    return "Haircare";
  }
  if (
    lower.includes("lip") ||
    lower.includes("bb cream") ||
    lower.includes("primer") ||
    lower.includes("makeup")
  ) {
    return "Makeup";
  }
  return undefined;
}

export function ProductOrderCard({
  productImage,
  productName,
  price,
  quantity,
  totalAmount,
  orderDate,
  orderStatus,
  category,
  currency = "INR",
  formatDate = defaultFormatDate,
  onClick,
  showAffiliateBadge = false,
  layout = "vertical",
}: ProductOrderCardProps) {
  const statusColors: Record<string, string> = {
    delivered: "bg-green-50 text-green-700",
    completed: "bg-green-50 text-green-700",
    shipped: "bg-blue-50 text-blue-700",
    processing: "bg-amber-50 text-amber-700",
    returned: "bg-amber-50 text-amber-700",
    cancelled: "bg-red-50 text-red-700",
    refunded: "bg-teal-50 text-teal-700",
    pending: "bg-gray-50 text-gray-700",
    inprogress: "bg-amber-50 text-amber-700",
    instock: "bg-emerald-50 text-emerald-700",
    lowstock: "bg-amber-50 text-amber-700",
    outofstock: "bg-red-50 text-red-700",
  };
  const statusKey = orderStatus.toLowerCase().replace(/\s+/g, "");
  const statusClass = statusColors[statusKey] ?? "bg-gray-50 text-gray-700";

  const displayCategory = category ?? inferCategoryFromName(productName);

  const imageBlock = (
    <div className="rounded-xl bg-[#fef5f7] overflow-hidden flex items-center justify-center shrink-0">
      {productImage ? (
        <Image
          src={productImage}
          alt={productName}
          width={layout === "horizontal" ? 160 : 320}
          height={layout === "horizontal" ? 160 : 192}
          className={
            layout === "horizontal"
              ? "w-36 h-36 sm:w-40 sm:h-40 object-cover"
              : "w-full h-40 sm:h-48 object-cover"
          }
        />
      ) : (
        <div
          className={
            layout === "horizontal"
              ? "w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center text-gray-400 text-2xl font-light"
              : "w-full h-40 sm:h-48 flex items-center justify-center text-gray-400 text-3xl font-light"
          }
        >
          —
        </div>
      )}
    </div>
  );

  const isHorizontal = layout === "horizontal";

  const detailsBlock = isHorizontal ? (
    <div className="flex-1 min-w-0 flex flex-row gap-4 items-stretch">
      {/* Center: name, category, unit price, qty + date */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 justify-center">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
          {productName}
        </h3>
        {displayCategory && (
          <p className="text-xs text-gray-500">
            Category:{" "}
            <span className="font-medium text-gray-800">{displayCategory}</span>
          </p>
        )}
        <p className="text-sm font-semibold text-gray-900">
          {defaultFormatCurrency(price, currency)}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
          <span>Qty: {quantity}</span>
          <span>{formatDate(orderDate)}</span>
          {showAffiliateBadge && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200/60">
              Via Affiliate
            </span>
          )}
        </div>
      </div>
      {/* Right: status, TOTAL label, total price (red) */}
      <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}
        >
          {orderStatus}
        </span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          TOTAL
        </span>
        <span className="text-sm font-bold text-red-600">
          {defaultFormatCurrency(totalAmount, currency)}
        </span>
      </div>
    </div>
  ) : (
    <div className="mt-4 flex-1 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
            {productName}
          </h3>
          {displayCategory && (
            <p className="mt-1.5 text-xs text-gray-500">
              Category:{" "}
              <span className="font-medium text-gray-800">
                {displayCategory}
              </span>
            </p>
          )}
        </div>
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusClass}`}
        >
          {orderStatus}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>Qty: {quantity}</span>
          <span>{formatDate(orderDate)}</span>
          {showAffiliateBadge && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200/60">
              Via Affiliate
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-red-600">
          {defaultFormatCurrency(totalAmount, currency)}
        </span>
      </div>
    </div>
  );

  return (
    <div
      className={`p-4 rounded-2xl border border-[#f8c6d0]/60 bg-white shadow-sm hover:shadow-md transition-shadow ${
        onClick ? "cursor-pointer" : ""
      } ${isHorizontal ? "flex flex-row gap-4" : "flex flex-col h-full"}`}
      onClick={onClick}
    >
      {imageBlock}
      {detailsBlock}
    </div>
  );
}
