"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useUsers } from "@/lib/users-context";
import type { OrderItem } from "@/lib/users-data";
import { ProductOrderCard } from "@/components/ui/Card";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

export default function RefundDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { getUserById } = useUsers();

  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const orderId = searchParams.get("orderId");
  const productName = searchParams.get("product");

  const user = id ? getUserById(id as string) : undefined;

  const refundedItem = useMemo<OrderItem | undefined>(() => {
    if (!user || !orderId) return undefined;
    const fromRefunded = user.refundedOrders ?? [];
    let found = fromRefunded.find(
      (item) =>
        item.orderId === orderId &&
        (!productName || item.productName === productName)
    );
    if (!found) {
      found = fromRefunded.find((item) => item.orderId === orderId);
    }
    return found ?? undefined;
  }, [user, orderId, productName]);

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

  if (!refundedItem) {
    return (
      <div className="space-y-6">
        <Link
          href={`/users/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to User
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-gray-500 text-sm">
            Refund details not found for this order.
          </p>
        </div>
      </div>
    );
  }

  const refundStatusLabel =
    refundedItem.refundStatus === "processed"
      ? "Refund completed"
      : "Refund initiated";

  const refundMethodLabel = (() => {
    const details = refundedItem.refundDetails;
    if (!details) return "Original payment source";
    switch (details.method) {
      case "bank_transfer":
        return "Bank transfer";
      case "upi":
        return "UPI";
      case "original_source":
      default:
        return "Original payment source";
    }
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/users/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to User
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7] flex items-center justify-between">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900">
            Refund details
          </h1>
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            {refundStatusLabel}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Order info */}
          <section className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Order info
            </p>
            <p className="text-sm text-gray-800">
              Order ID: <span className="font-medium">{refundedItem.orderId}</span>
            </p>
            <p className="text-xs text-gray-500">
              Ordered on{" "}
              {new Date(refundedItem.orderDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </section>

          {/* Product info — same card as list view */}
          <section>
            <ProductOrderCard
              productImage={refundedItem.productImage}
              productName={refundedItem.productName}
              price={refundedItem.price}
              quantity={refundedItem.quantity}
              totalAmount={refundedItem.totalAmount}
              orderDate={refundedItem.orderDate}
              orderStatus={refundedItem.orderStatus}
              formatDate={(d) =>
                new Date(d).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              }
            />
          </section>

          {/* Refund summary */}
          <section className="rounded-2xl bg-[#fef5f7] border border-[#f8c6d0]/60 px-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-800">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Refund summary
                </p>
                <p>{refundStatusLabel}</p>
                <p className="text-xs text-gray-500">
                  Amount: {formatCurrency(refundedItem.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Refund method
                </p>
                <p>{refundMethodLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Transaction ID
                </p>
                <p>{refundedItem.refundTransactionId ?? "Not available"}</p>
              </div>
            </div>
          </section>

          {/* Financial adjustments */}
          <section className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Financial adjustments
            </p>
            <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
              <li>Seller earnings for this order have been reversed.</li>
              <li>
                Any affiliate commission associated with this order has been
                reversed.
              </li>
              <li>
                Refund is processed only to the recorded refund destination or
                original payment source.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}