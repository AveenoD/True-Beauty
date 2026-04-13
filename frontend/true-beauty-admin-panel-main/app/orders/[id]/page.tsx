"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Hash,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  Truck,
  CheckCircle2,
  XCircle,
  BadgeCheck,
  User,
} from "lucide-react";
import { useOrders } from "@/lib/orders-context";
import type { OrderStatus, PaymentStatus } from "@/lib/orders-data";
import { ProductOrderCard } from "@/components/ui/Card";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
};

const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-gray-50 text-gray-700",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  returned: "bg-orange-50 text-orange-700",
  refunded: "bg-teal-50 text-teal-700",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-teal-50 text-teal-700",
};

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
  { value: "refunded", label: "Refunded" },
];

export default function OrderDetailPage() {
  const params = useParams();
  const {
    getOrderById,
    updateOrderStatus,
    approveRefund,
    rejectRefund,
    updateTracking,
  } = useOrders();

  const id =
    typeof params.id === "string" ? params.id : (params.id?.[0] as string);
  const order = id ? getOrderById(id) : undefined;

  const [statusDraft, setStatusDraft] = useState<OrderStatus | "">(
    order?.orderStatus ?? ""
  );
  const [trackingNumberDraft, setTrackingNumberDraft] = useState(
    order?.trackingNumber ?? ""
  );
  const [trackingUrlDraft, setTrackingUrlDraft] = useState(
    order?.trackingUrl ?? ""
  );

  if (!id || !order) {
    return (
      <div className="space-y-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">Order not found.</p>
        </div>
      </div>
    );
  }

  const handleStatusUpdate = () => {
    if (!statusDraft) return;
    if (statusDraft === order.orderStatus) return;
    updateOrderStatus(order.id, statusDraft);
  };

  const handleTrackingSave = () => {
    updateTracking(order.id, trackingNumberDraft.trim(), trackingUrlDraft.trim());
  };

  const statusBadgeClass =
    ORDER_STATUS_CLASSES[order.orderStatus] ?? "bg-gray-50 text-gray-700";
  const paymentBadgeClass =
    PAYMENT_STATUS_CLASSES[order.paymentStatus] ?? "bg-gray-50 text-gray-700";

  const hasAddress =
    order.customerAddress ||
    order.customerCity ||
    order.customerState ||
    order.customerPincode;

  const hasRefundControls =
    order.refundStatus === "requested" ||
    order.refundStatus === "approved" ||
    order.refundStatus === "rejected";

  return (
    <div className="space-y-6">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7] flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Order Summary
                </p>
                <h1 className="text-lg font-semibold text-gray-900">
                  {order.id}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-900">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">ORDER:</span>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass}`}
                  >
                    {ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">PAYMENT:</span>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${paymentBadgeClass}`}
                  >
                    {PAYMENT_STATUS_LABELS[order.paymentStatus] ??
                      order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Date
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <Hash className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products Count
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {order.productsCount}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <IndianRupee className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {order.orderStatus === "delivered"
                        ? "Delivered Date"
                        : "Arrival Date"}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {formatDate(order.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Customer Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {order.customerName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {order.customerEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {order.customerPhone}
                    </p>
                  </div>
                </div>
              </div>
              {hasAddress && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                    Shipping Address
                  </p>
                  <p className="text-sm text-gray-800">
                    {order.customerAddress}
                    {order.customerCity && `, ${order.customerCity}`}
                    {order.customerState && `, ${order.customerState}`}
                    {order.customerPincode && ` - ${order.customerPincode}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7] flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Products
              </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {order.items.map((item) => (
                <ProductOrderCard
                  key={item.id}
                  productImage={item.productImage}
                  productName={item.productName}
                  price={item.price}
                  quantity={item.quantity}
                  totalAmount={item.totalAmount}
                  orderDate={order.createdAt}
                  orderStatus={ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
                  currency="INR"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Price Breakdown
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(order.subTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-emerald-700">
                  -{formatCurrency(order.discount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(order.tax)}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-dashed border-gray-200">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">
                  {order.shipping === 0
                    ? "Free"
                    : formatCurrency(order.shipping)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-base font-semibold text-gray-900">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">
                Update Order Status
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                Change the current order status to keep tracking accurate.
              </p>
              <div className="flex flex-col gap-3">
                <select
                  value={statusDraft || order.orderStatus}
                  onChange={(e) =>
                    setStatusDraft(e.target.value as OrderStatus)
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent"
                >
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!statusDraft || statusDraft === order.orderStatus}
                >
                  Save status
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Refunds
                  </h3>
                  <p className="text-xs text-gray-500">
                    Approve or reject refund requests for this order.
                  </p>
                </div>
                {order.refundStatus === "requested" && (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 whitespace-nowrap">
                    Refund requested
                  </span>
                )}
                {order.refundStatus === "approved" && (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap">
                    Refund approved
                  </span>
                )}
                {order.refundStatus === "rejected" && (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 whitespace-nowrap">
                    Refund rejected
                  </span>
                )}
              </div>
              {hasRefundControls && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => approveRefund(order.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve refund
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectRefund(order.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject refund
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Tracking
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tracking number
                  </label>
                  <input
                    type="text"
                    value={trackingNumberDraft}
                    onChange={(e) => setTrackingNumberDraft(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent"
                    placeholder="e.g. TRK123456789"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tracking URL (optional)
                  </label>
                  <input
                    type="url"
                    value={trackingUrlDraft}
                    onChange={(e) => setTrackingUrlDraft(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent"
                    placeholder="https://tracking.example.com/..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTrackingSave}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors"
                >
                  Save tracking
                </button>
                {order.trackingNumber && (
                  <p className="text-xs text-gray-500">
                    Current:{" "}
                    <span className="font-medium text-gray-800">
                      {order.trackingNumber}
                    </span>
                    {order.trackingUrl && (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#D96A86] hover:underline"
                        >
                          View tracking page
                        </a>
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

