"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useUsers } from "@/lib/users-context";
import type { OrderItem, ReturnStatus } from "@/lib/users-data";
import { ProductOrderCard } from "@/components/ui/Card";
import { useProducts } from "@/lib/products-context";

const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  pickup_scheduled: "Pickup scheduled",
  pickup_completed: "Pickup completed",
  refund_initiated: "Refund initiated",
  completed: "Completed",
};

const RETURN_STATUS_CLASSES: Record<ReturnStatus, string> = {
  pending_review: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  pickup_scheduled: "bg-blue-50 text-blue-700",
  pickup_completed: "bg-blue-50 text-blue-700",
  refund_initiated: "bg-purple-50 text-purple-700",
  completed: "bg-emerald-50 text-emerald-700",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function maskAccountNumber(account?: string) {
  if (!account) return "";
  const last4 = account.slice(-4);
  return `••••••••${last4}`;
}

function maskUpiId(upi?: string) {
  if (!upi) return "";
  const [name, domain] = upi.split("@");
  if (!domain || name.length <= 2) return `••••@${domain ?? ""}`;
  return `${name.slice(0, 2)}••••@${domain}`;
}

export default function ReturnDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { getUserById } = useUsers();
  const { products } = useProducts();

  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const orderId = searchParams.get("orderId");
  const productName = searchParams.get("product");

  const user = id ? getUserById(id as string) : undefined;

  const initialItem = useMemo<OrderItem | undefined>(() => {
    if (!user || !orderId) return undefined;
    const fromReturns = user.returnsOrders ?? [];
    let found = fromReturns.find(
      (item) =>
        item.orderId === orderId &&
        (!productName || item.productName === productName)
    );
    if (!found) {
      found = fromReturns.find((item) => item.orderId === orderId);
    }
    return found ?? undefined;
  }, [user, orderId, productName]);

  const [returnItem, setReturnItem] = useState<OrderItem | undefined>(initialItem);
  const matchedProduct = returnItem
    ? products.find((p) => p.name === returnItem.productName)
    : undefined;

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

  if (!returnItem) {
    return (
      <div className="space-y-6">
        <Link
          href={`/users/${id}?tab=returns`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Returns
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-gray-500 text-sm">
            Return details not found for this order.
          </p>
        </div>
      </div>
    );
  }

  const status: ReturnStatus = returnItem.returnStatus ?? "pending_review";
  const [showSensitive, setShowSensitive] = useState(false);

  const handleStatusChange = (nextStatus: ReturnStatus, note: string) => {
    const now = new Date().toISOString();
    const updatedTimeline = [
      ...(returnItem.returnTimeline ?? []),
      { status: nextStatus, date: now, note },
    ];
    setReturnItem({
      ...returnItem,
      returnStatus: nextStatus,
      returnTimeline: updatedTimeline,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/users/${id}?tab=returns`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Returns
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7] flex items-center justify-between">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900">
            Return details
          </h1>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              RETURN_STATUS_CLASSES[status]
            }`}
          >
            {RETURN_STATUS_LABELS[status]}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Order info */}
          <section className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Order info
            </p>
            <p className="text-sm text-gray-800">
              Order ID: <span className="font-medium">{returnItem.orderId}</span>
            </p>
            {returnItem.returnRequestedAt && (
              <p className="text-xs text-gray-500">
                Return requested on{" "}
                {new Date(returnItem.returnRequestedAt).toLocaleDateString(
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

          {/* Product info — horizontal card */}
          <section className="w-full">
            <ProductOrderCard
              layout="horizontal"
              productImage={returnItem.productImage}
              productName={returnItem.productName}
              category={matchedProduct?.category}
              price={returnItem.price}
              quantity={returnItem.quantity}
              totalAmount={returnItem.totalAmount}
              orderDate={returnItem.orderDate}
              orderStatus={RETURN_STATUS_LABELS[status]}
              formatDate={(d) =>
                new Date(d).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              }
            />
          </section>

          {/* Reason & description */}
          <section className="rounded-2xl bg-[#fef5f7] border border-[#f8c6d0]/60 px-4 py-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Return reason
              </p>
              <p className="text-sm text-gray-800">
                {returnItem.returnReason ??
                  "User did not provide a short reason for this return."}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Customer description
              </p>
              <p className="text-sm text-gray-800">
                {returnItem.returnDescription ??
                  "No additional description provided by customer."}
              </p>
            </div>
          </section>

          {/* Images */}
          {returnItem.returnImages && returnItem.returnImages.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Uploaded images
              </p>
              <div className="flex flex-wrap gap-3">
                {returnItem.returnImages.map((src, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${src}-${idx}`}
                    src={src}
                    alt={`Return image ${idx + 1}`}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-100"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Refund details */}
          <section className="rounded-2xl border border-gray-100 bg-white px-4 py-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Refund details
              </p>
              {returnItem.refundDetails && (
                <button
                  type="button"
                  onClick={() => {
                    if (!showSensitive) {
                      const ok = window.confirm(
                        "Sensitive refund information will be revealed. Proceed?"
                      );
                      if (!ok) return;
                    }
                    setShowSensitive((prev) => !prev);
                  }}
                  className="text-xs font-medium text-[#D96A86] hover:text-[#C85A76]"
                >
                  {showSensitive ? "Hide details" : "Reveal details"}
                </button>
              )}
            </div>

            {!returnItem.refundDetails ? (
              <p className="text-xs text-gray-500">
                No refund destination has been recorded yet. Refund will be
                processed when configured.
              </p>
            ) : (
              (() => {
                const details = returnItem.refundDetails!;
                if (details.method === "bank_transfer") {
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Account holder
                        </p>
                        <p className="text-gray-800">
                          {details.accountHolderName ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Bank name
                        </p>
                        <p className="text-gray-800">
                          {details.bankName ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Account number
                        </p>
                        <p className="text-gray-800 font-mono">
                          {showSensitive
                            ? details.accountNumber ?? "-"
                            : maskAccountNumber(details.accountNumber) || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          IFSC code
                        </p>
                        <p className="text-gray-800">
                          {showSensitive
                            ? details.ifscCode ?? "-"
                            : details.ifscCode
                            ? "••••••••"
                            : "-"}
                        </p>
                      </div>
                    </div>
                  );
                }

                if (details.method === "upi") {
                  return (
                    <div className="text-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        UPI ID
                      </p>
                      <p className="text-gray-800 font-mono">
                        {showSensitive
                          ? details.upiId ?? "-"
                          : maskUpiId(details.upiId) || "-"}
                      </p>
                    </div>
                  );
                }

                return (
                  <p className="text-sm text-gray-800">
                    Refund will be sent back to the{" "}
                    <span className="font-medium">
                      original payment source
                    </span>
                    .
                  </p>
                );
              })()
            )}

            {returnItem.refundAuditLog &&
              returnItem.refundAuditLog.length > 0 && (
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Refund audit log
                  </p>
                  <ul className="space-y-1 text-xs text-gray-600">
                    {returnItem.refundAuditLog.map((log, idx) => (
                      <li key={idx}>
                        <span className="font-medium text-gray-800">
                          {log.action}
                        </span>{" "}
                        by {log.by} on{" "}
                        {new Date(log.date).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {log.note ? ` — ${log.note}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </section>

          {/* Timeline */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Timeline
            </p>
            {returnItem.returnTimeline && returnItem.returnTimeline.length > 0 ? (
              <ol className="space-y-2 text-sm text-gray-700">
                {returnItem.returnTimeline.map((entry, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#D96A86]" />
                    <div>
                      <p className="font-medium">
                        {RETURN_STATUS_LABELS[entry.status]}
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

          {/* Admin controls */}
          <section className="pt-1 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                handleStatusChange("approved", "Return approved by admin.")
              }
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              Approve Return
            </button>
            <button
              type="button"
              onClick={() =>
                handleStatusChange("rejected", "Return rejected by admin.")
              }
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
            >
              Reject Return
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

