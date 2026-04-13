"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useUsers } from "@/lib/users-context";
import type { OrderItem } from "@/lib/users-data";
import { ProductOrderCard } from "@/components/ui/Card";

export default function CancelDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { getUserById } = useUsers();

  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const orderId = searchParams.get("orderId");
  const productName = searchParams.get("product");

  const user = id ? getUserById(id as string) : undefined;

  const cancelledItem = useMemo<OrderItem | undefined>(() => {
    if (!user || !orderId) return undefined;
    const fromCancelled = user.cancelledOrders ?? [];
    let found = fromCancelled.find(
      (item) =>
        item.orderId === orderId &&
        (!productName || item.productName === productName)
    );
    if (!found) {
      found = fromCancelled.find((item) => item.orderId === orderId);
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

  if (!cancelledItem) {
    return (
      <div className="space-y-6">
        <Link
          href={`/users/${id}?tab=cancelled`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cancelled
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-gray-500 text-sm">
            Cancellation details not found for this order.
          </p>
        </div>
      </div>
    );
  }

  const cancelledByLabel =
    cancelledItem.cancelledBy === "admin"
      ? "Admin"
      : cancelledItem.cancelledBy === "user"
      ? "User"
      : "Unknown";

  const refundStatusLabel = (() => {
    switch (cancelledItem.refundStatus) {
      case "pending":
        return "Refund pending";
      case "processed":
        return "Refund processed";
      case "not_applicable":
      default:
        return "Not applicable";
    }
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/users/${id}?tab=cancelled`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cancelled
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7] flex items-center justify-between">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900">
            Cancellation details
          </h1>
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
            Cancelled
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Order info */}
          <section className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Order info
            </p>
            <p className="text-sm text-gray-800">
              Order ID: <span className="font-medium">{cancelledItem.orderId}</span>
            </p>
            <p className="text-xs text-gray-500">
              Ordered on{" "}
              {new Date(cancelledItem.orderDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </section>

          {/* Product info — horizontal layout (image left, details center, status + total right) */}
          <section>
            <ProductOrderCard
              layout="horizontal"
              productImage={cancelledItem.productImage}
              productName={cancelledItem.productName}
              price={cancelledItem.price}
              quantity={cancelledItem.quantity}
              totalAmount={cancelledItem.totalAmount}
              orderDate={cancelledItem.orderDate}
              orderStatus={cancelledItem.orderStatus}
              formatDate={(d) =>
                new Date(d).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              }
            />
          </section>

          {/* Cancellation info */}
          <section className="rounded-2xl bg-[#fef5f7] border border-[#f8c6d0]/60 px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-800">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Cancellation reason
                </p>
                <p className="truncate md:whitespace-normal">
                  {cancelledItem.cancelReason ?? "No specific reason provided."}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Cancelled by
                </p>
                <p>{cancelledByLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Refund status
                </p>
                <p>{refundStatusLabel}</p>
              </div>
            </div>
          </section>

          {/* Business notes */}
          <section className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Cancellation logic (informational)
            </p>
            <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
              <li>Orders are cancellable only before they are shipped.</li>
              <li>Inventory is automatically restored when an order is cancelled.</li>
              <li>Seller earnings and affiliate commissions are reversed on cancellation.</li>
              <li>For prepaid orders, refund initiation is automatic after cancellation.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}