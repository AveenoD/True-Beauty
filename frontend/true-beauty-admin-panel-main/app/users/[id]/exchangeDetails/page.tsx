"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useUsers } from "@/lib/users-context";
import type { ExchangeStatus, OrderItem } from "@/lib/users-data";
import { ProductOrderCard } from "@/components/ui/Card";

const EXCHANGE_STATUS_LABELS: Record<ExchangeStatus, string> = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  pickup: "Pickup",
  replacement_shipped: "Replacement shipped",
  replacement_delivered: "Replacement delivered",
};

const EXCHANGE_STATUS_CLASSES: Record<ExchangeStatus, string> = {
  pending_review: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  pickup: "bg-blue-50 text-blue-700",
  replacement_shipped: "bg-purple-50 text-purple-700",
  replacement_delivered: "bg-emerald-50 text-emerald-700",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

export default function ExchangeDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { getUserById } = useUsers();

  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const orderId = searchParams.get("orderId");
  const productName = searchParams.get("product");

  const user = id ? getUserById(id as string) : undefined;

  const initialItem = useMemo<OrderItem | undefined>(() => {
    if (!user || !orderId) return undefined;
    const fromExchanges = user.exchangeOrders ?? [];
    let found = fromExchanges.find(
      (item) =>
        item.orderId === orderId &&
        (!productName || item.productName === productName)
    );
    if (!found) {
      found = fromExchanges.find((item) => item.orderId === orderId);
    }
    return found ?? undefined;
  }, [user, orderId, productName]);

  const [exchangeItem, setExchangeItem] = useState<OrderItem | undefined>(
    initialItem
  );

  if (!id || !user) {
    return (
      <div className="space-y-6">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-gray-500 text-sm">User not found.</p>
        </div>
      </div>
    );
  }

  if (!exchangeItem) {
    return (
      <div className="space-y-6">
        <Link
          href={`/users/${id}?tab=returns&subtab=exchange`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Exchange
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-gray-500 text-sm">
            Exchange details not found for this order.
          </p>
        </div>
      </div>
    );
  }

  const status: ExchangeStatus = exchangeItem.exchangeStatus ?? "pending_review";

  const handleStatusChange = (nextStatus: ExchangeStatus, note: string) => {
    const now = new Date().toISOString();
    const updatedTimeline = [
      ...(exchangeItem.exchangeTimeline ?? []),
      { status: nextStatus, date: now, note },
    ];
    setExchangeItem({
      ...exchangeItem,
      exchangeStatus: nextStatus,
      exchangeTimeline: updatedTimeline,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/users/${id}?tab=returns&subtab=exchange`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Exchange
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7] flex items-center justify-between">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900">
            Exchange details
          </h1>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              EXCHANGE_STATUS_CLASSES[status]
            }`}
          >
            {EXCHANGE_STATUS_LABELS[status]}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Order info */}
          <section className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Order info
            </p>
            <p className="text-sm text-gray-800">
              Order ID: <span className="font-medium">{exchangeItem.orderId}</span>
            </p>
            {exchangeItem.exchangeRequestedAt && (
              <p className="text-xs text-gray-500">
                Exchange requested on{" "}
                {new Date(exchangeItem.exchangeRequestedAt).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </p>
            )}
          </section>

          {/* Product info — horizontal layout (image left, details center, status + total right) */}
          <section>
            <ProductOrderCard
              layout="horizontal"
              productImage={exchangeItem.productImage}
              productName={exchangeItem.productName}
              price={exchangeItem.price}
              quantity={exchangeItem.quantity}
              totalAmount={exchangeItem.totalAmount}
              orderDate={exchangeItem.orderDate}
              orderStatus={EXCHANGE_STATUS_LABELS[status]}
              formatDate={(d) =>
                new Date(d).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              }
            />
          </section>

          {/* Exchange reason & description */}
          <section className="rounded-2xl bg-[#fef5f7] border border-[#f8c6d0]/60 px-4 py-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Exchange reason
              </p>
              <p className="text-sm text-gray-800">
                {exchangeItem.exchangeReason ??
                  "User did not provide a short reason for this exchange."}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Customer description
              </p>
              <p className="text-sm text-gray-800">
                {exchangeItem.exchangeDescription ??
                  "No additional description provided by customer."}
              </p>
            </div>
          </section>

          {/* Replacement details */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Replacement details
            </p>
            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-800">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Replacement product
                </p>
                <p>
                  {exchangeItem.replacementProductName ??
                    exchangeItem.productName}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Variant
                </p>
                <p>
                  {exchangeItem.replacementVariant ?? "Same as original item"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Quantity
                </p>
                <p>{exchangeItem.replacementQuantity ?? exchangeItem.quantity}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Replacement tracking ID
                </p>
                <p>
                  {exchangeItem.replacementTrackingId ?? "Not yet generated"}
                </p>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Timeline
            </p>
            {exchangeItem.exchangeTimeline &&
            exchangeItem.exchangeTimeline.length > 0 ? (
              <ol className="space-y-2 text-sm text-gray-700">
                {exchangeItem.exchangeTimeline.map((entry, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#D96A86]" />
                    <div>
                      <p className="font-medium">
                        {EXCHANGE_STATUS_LABELS[entry.status]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.date).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {entry.note && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-gray-500">
                No timeline entries recorded yet.
              </p>
            )}
          </section>

          {/* Admin actions */}
          <section className="pt-1 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                handleStatusChange("approved", "Exchange approved by admin.")
              }
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              Approve Exchange
            </button>
            <button
              type="button"
              onClick={() =>
                handleStatusChange("rejected", "Exchange rejected by admin.")
              }
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
            >
              Reject Exchange
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

