"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Package,
  Truck,
  User,
  Clock,
  UserCheck,
  IndianRupee,
} from "lucide-react";
import { useOrders } from "@/lib/orders-context";
import { useAffiliates } from "@/lib/affiliates-context";
import { useProducts } from "@/lib/products-context";
import type { PaymentStatus } from "@/lib/orders-data";

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

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
};

const ORDER_STATUS_CLASSES: Record<string, string> = {
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

export default function OrderDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = typeof params.id === "string" ? params.id : params.id?.[0];
  const orderId = searchParams.get("orderId") ?? "";
  const itemId = searchParams.get("itemId") ?? "";
  const { getOrderById } = useOrders();
  const { affiliates } = useAffiliates();
  const { products } = useProducts();
  const order = orderId ? getOrderById(orderId) : undefined;
  const selectedItem = order?.items.find((i) => i.id === itemId);
  const matchedProduct = selectedItem
    ? products.find((p) => p.name === selectedItem.productName)
    : undefined;
  const affiliate = orderId
    ? affiliates.find((a) =>
        a.commissionLogs.some((log) => log.orderId === orderId)
      )
    : undefined;
  const orderCommissionLog = affiliate?.commissionLogs.find(
    (log) => log.orderId === orderId && log.type === "order_commission"
  );

  const [isTrackingModalOpen, setIsTrackingModalOpen] = React.useState(false);

  if (!userId) {
    return (
      <div className="space-y-6">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">Invalid user.</p>
        </div>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="space-y-6">
        <Link
          href={`/users/${userId}?tab=purchases`}
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

  if (!itemId || !selectedItem) {
    return (
      <div className="space-y-6">
        <Link
          href={`/users/${userId}?tab=purchases`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">Product item not found.</p>
        </div>
      </div>
    );
  }

  const statusKey = (order.orderStatus ?? "").toLowerCase();
  const isDelivered = order.orderStatus === "delivered";
  const isPending = order.orderStatus === "pending";
  const statusBadgeClass =
    ORDER_STATUS_CLASSES[statusKey] ?? "bg-gray-50 text-gray-700";
  const paymentBadgeClass =
    PAYMENT_STATUS_CLASSES[order.paymentStatus] ?? "bg-gray-50 text-gray-700";
  const hasAddress =
    order.customerAddress ||
    order.customerCity ||
    order.customerState ||
    order.customerPincode;
  const hasTracking = order.trackingNumber || order.trackingUrl;

  const createdAtDate = new Date(order.createdAt);
  const expectedArrivalDate = new Date(createdAtDate);
  expectedArrivalDate.setDate(expectedArrivalDate.getDate() + 5);
  const expectedArrivalDisplay = formatDate(expectedArrivalDate.toISOString());

  const shippingDate =
    order.orderStatus === "shipped" || order.orderStatus === "delivered"
      ? formatDate(order.updatedAt)
      : "Not shipped yet";

  const arrivalDate =
    order.orderStatus === "delivered"
      ? formatDate(order.updatedAt)
      : `Expected by ${expectedArrivalDisplay}`;

  return (
    <div className="space-y-6">
      <Link
        href={`/users/${userId}?tab=purchases`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order summary header */}
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
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <span>Order:</span>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass}`}
                  >
                    {ORDER_STATUS_LABELS[statusKey] ?? order.orderStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Payment:</span>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${paymentBadgeClass}`}
                  >
                    {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
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
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isDelivered
                        ? "Delivered Date"
                        : isPending
                          ? "Arrival Date"
                          : "Last Updated"}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {formatDate(order.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected product (clicked card) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7] flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Product Details
              </h2>
            </div>
            <div className="p-6 flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 w-full sm:w-40 h-40 rounded-xl bg-[#fef5f7] overflow-hidden flex items-center justify-center">
                {selectedItem.productImage ? (
                  <Image
                    src={selectedItem.productImage}
                    alt={selectedItem.productName}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-3xl font-light">—</span>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col sm:justify-center gap-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedItem.productName}
                </h3>
                {matchedProduct?.category && (
                  <p className="text-sm text-gray-600">
                    Category: {matchedProduct.category}
                  </p>
                )}
                <p className="text-base font-medium text-red-600 flex items-center justify-between gap-2">
                  <span>
                    {formatCurrency(selectedItem.price)} × {selectedItem.quantity}
                  </span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </span>
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass}`}
                  >
                    {ORDER_STATUS_LABELS[statusKey] ?? order.orderStatus}
                  </span>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(selectedItem.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery / Shipping */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Delivery & Shipping
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {hasAddress && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
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
              {hasTracking && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tracking
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {order.trackingNumber && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-sm font-medium text-gray-800">
                        <Truck className="w-4 h-4 text-gray-500" />
                        {order.trackingNumber}
                      </span>
                    )}
                    {order.trackingUrl && (
                      <button
                        type="button"
                        onClick={() => setIsTrackingModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D96A86] hover:underline"
                      >
                        Track shipment →
                      </button>
                    )}
                  </div>
                </div>
              )}
              {!hasAddress && !hasTracking && (
                <p className="text-sm text-gray-500">
                  No delivery details available.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - fixed so Item Total + Customer card stay in view */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7]">
              <h2 className="text-base font-semibold text-gray-900">
                Item Total
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600">Unit price</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(selectedItem.price)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600">Quantity</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedItem.quantity}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-2">
                <span className="text-base font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-xl font-semibold text-gray-900">
                  {formatCurrency(selectedItem.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7] flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Customer
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {order.customerName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5 break-all">
                  {order.customerEmail}
                </p>
              </div>
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

          {affiliate && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-l-4 border-l-violet-400">
              <div className="px-6 py-4 border-b border-gray-100 bg-violet-50/80 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-violet-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  Via Affiliate
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Affiliate
                  </p>
                  <Link
                    href={`/affiliates/${affiliate.id}`}
                    className="text-sm font-medium text-violet-600 hover:underline mt-0.5 inline-block"
                  >
                    {affiliate.name}
                  </Link>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission rate
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {affiliate.commissionRate}%
                  </p>
                </div>
                {orderCommissionLog != null && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission (this order)
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 flex items-center gap-1">
                      <IndianRupee className="w-4 h-4 text-gray-500" />
                      {formatCurrency(orderCommissionLog.amount)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Shipment timeline
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {order.trackingNumber ?? "Tracking details"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackingModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close tracking details"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-4">
                {[
                  {
                    label: "Booking date",
                    value: formatDate(order.createdAt),
                  },
                  {
                    label: "Shipping date",
                    value: shippingDate,
                  },
                  {
                    label: "Arrival date",
                    value: arrivalDate,
                  },
                ].map((item, index, arr) => (
                  <div key={item.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="mt-1 h-2 w-2 rounded-full bg-[#D96A86]" />
                      {index < arr.length - 1 && (
                        <div className="h-10 w-px bg-gray-200" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
