"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, MoreVertical, RotateCcw, XCircle } from "lucide-react";
import { useOrders } from "@/lib/orders-context";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/orders-data";
import Table from "@/components/Table";
import { Filters, type FilterOption } from "@/components/ui/filters";
import { KpiCard } from "@/components/ui/kpiCard";
import {
  ORDER_STATUS_CLASSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_CLASSES,
  PAYMENT_STATUS_LABELS,
} from "@/lib/orders-ui";

function OrderActionsMenu({
  order,
  onCancel,
  onApproveRefund,
}: {
  order: Order;
  onCancel: (order: Order) => void;
  onApproveRefund: (order: Order) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const isCancelled = order.orderStatus === "cancelled";
  const canApproveRefund = order.refundStatus === "requested";

  return (
    <div
      className="relative inline-block text-left"
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-[#fef5f7] transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
          <Link
            href={`/orders/${order.id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors text-left"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onCancel(order);
            }}
            disabled={isCancelled}
            className={`flex w-full items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
              isCancelled
                ? "text-gray-400 cursor-not-allowed"
                : "text-red-600 hover:bg-red-50"
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>{isCancelled ? "Cancelled" : "Cancel order"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!canApproveRefund) return;
              setOpen(false);
              onApproveRefund(order);
            }}
            disabled={!canApproveRefund}
            className={`flex w-full items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
              canApproveRefund
                ? "text-emerald-700 hover:bg-emerald-50"
                : "text-gray-400 cursor-not-allowed"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Approve refund</span>
          </button>
        </div>
      )}
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: ORDER_STATUS_LABELS.pending },
  { value: "shipped", label: ORDER_STATUS_LABELS.shipped },
  { value: "delivered", label: ORDER_STATUS_LABELS.delivered },
  { value: "cancelled", label: ORDER_STATUS_LABELS.cancelled },
  { value: "returned", label: ORDER_STATUS_LABELS.returned },
  { value: "refunded", label: ORDER_STATUS_LABELS.refunded },
];

const PAYMENT_STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All payments" },
  { value: "pending", label: PAYMENT_STATUS_LABELS.pending },
  { value: "paid", label: PAYMENT_STATUS_LABELS.paid },
  { value: "failed", label: PAYMENT_STATUS_LABELS.failed },
  { value: "refunded", label: PAYMENT_STATUS_LABELS.refunded },
];

export default function OrdersPage() {
  const router = useRouter();
  const { orders, updateOrderStatus, approveRefund } = useOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    "" | PaymentStatus
  >("");

  const filteredOrders = useMemo(() => {
    let list = [...orders];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      list = list.filter((o) => o.orderStatus === statusFilter);
    }
    if (paymentStatusFilter) {
      list = list.filter((o) => o.paymentStatus === paymentStatusFilter);
    }
    return list;
  }, [orders, search, statusFilter, paymentStatusFilter]);

  const kpis = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === "paid" || o.paymentStatus === "refunded")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrders = orders.filter((o) => o.orderStatus === "pending").length;
    const refundRequests = orders.filter((o) => o.refundStatus === "requested")
      .length;
    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      refundRequests,
    };
  }, [orders]);

  const handleCancel = (order: Order) => {
    if (order.orderStatus === "cancelled") return;
    if (
      window.confirm(
        `Cancel order ${order.id}? This will mark the order as cancelled.`
      )
    ) {
      updateOrderStatus(order.id, "cancelled");
    }
  };

  const handleApproveRefund = (order: Order) => {
    if (order.refundStatus === "approved") return;
    approveRefund(order.id);
  };

  const columns = [
    {
      header: "Customer Name",
      accessor: (order: (typeof orders)[number]) => (
        <span className="text-sm text-gray-800">{order.customerName}</span>
      ),
    },
    {
      header: "Order ID",
      accessor: (order: (typeof orders)[number]) => (
        <span className="font-medium text-gray-900">{order.id}</span>
      ),
    },
    {
      header: "Products",
      accessor: (order: (typeof orders)[number]) => (
        <span className="text-sm text-gray-700">{order.productsCount}</span>
      ),
    },
    {
      header: "Payment Method",
      accessor: (order: (typeof orders)[number]) => (
        <span className="text-xs uppercase tracking-wide text-gray-700">
          {order.paymentMethod.toUpperCase()}
        </span>
      ),
    },
    {
      header: "Payment Status",
      accessor: (order: (typeof orders)[number]) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            PAYMENT_STATUS_CLASSES[order.paymentStatus] ??
            "bg-gray-50 text-gray-700"
          }`}
        >
          {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
        </span>
      ),
    },
    {
      header: "Order Status",
      accessor: (order: (typeof orders)[number]) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            ORDER_STATUS_CLASSES[order.orderStatus] ??
            "bg-gray-50 text-gray-700"
          }`}
        >
          {ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
        </span>
      ),
    },
    {
      header: "Order Date",
      accessor: (order: (typeof orders)[number]) => (
        <span className="text-sm text-gray-600">
          {formatDate(order.createdAt)}
        </span>
      ),
    },
    {
      header: "Actions",
      cellClassName: "text-center",
      accessor: (order: (typeof orders)[number]) => (
        <div className="inline-flex justify-center w-full">
          <OrderActionsMenu
            order={order}
            onCancel={handleCancel}
            onApproveRefund={handleApproveRefund}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <KpiCard
          title="Total Orders"
          value={kpis.totalOrders.toLocaleString()}
          icon="shopping-cart"
          iconClassName="bg-green-50 text-green-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          icon="indian-rupee"
          iconClassName="bg-purple-50 text-purple-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Pending Orders"
          value={kpis.pendingOrders.toLocaleString()}
          icon="trending-up"
          iconClassName="bg-amber-50 text-amber-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Refund Requests"
          value={kpis.refundRequests.toLocaleString()}
          icon="user-x"
          iconClassName="bg-red-50 text-red-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
        <div className="flex-1">
          <Filters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by Order ID or customer..."
            searchPlaceholderMobile="Search ..."
            filterOptions={STATUS_FILTER_OPTIONS}
            filterValue={statusFilter}
            onFilterChange={(value) =>
              setStatusFilter(value as "" | OrderStatus)
            }
            categoryOptions={PAYMENT_STATUS_FILTER_OPTIONS}
            categoryValue={paymentStatusFilter}
            onCategoryChange={(value) =>
              setPaymentStatusFilter(value as "" | PaymentStatus)
            }
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
          <p className="text-gray-500 mb-2 text-sm sm:text-base">
            No orders match your filters.
          </p>
          <p className="text-xs text-gray-400">
            Try adjusting the date range or clearing filters.
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-semibold text-gray-500">
                      {order.id}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {order.customerName}
                    </p>
                    <p className="text-sm font-medium text-gray-900 flex items-center justify-between gap-2">
                      <span>{formatCurrency(order.totalAmount)}</span>
                      <span className="text-sm text-gray-700">
                        {order.productsCount} items
                      </span>
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          PAYMENT_STATUS_CLASSES[order.paymentStatus] ??
                          "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {PAYMENT_STATUS_LABELS[order.paymentStatus] ??
                          order.paymentStatus}
                      </span>
                      <div className="flex-1 flex justify-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            ORDER_STATUS_CLASSES[order.orderStatus] ??
                            "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.orderStatus] ??
                            order.orderStatus}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                  <OrderActionsMenu
                    order={order}
                    onCancel={handleCancel}
                    onApproveRefund={handleApproveRefund}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table
              data={filteredOrders}
              columns={columns}
              searchable={false}
              filterable={false}
              itemsPerPage={10}
              onRowClick={(order) => router.push(`/orders/${order.id}`)}
            />
          </div>
        </>
      )}
    </div>
  );
}

