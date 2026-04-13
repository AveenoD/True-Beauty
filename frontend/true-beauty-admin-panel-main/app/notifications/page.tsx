"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  ShoppingCart,
  Wallet,
  Settings,
  Users,
  UserCheck,
  Package,
  Scissors,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Filters, type FilterOption } from "@/components/ui/filters";
import DeletePopup from "@/components/ui/deletePopup";
import { useNotifications } from "@/lib/notifications-context";
import type {
  Notification,
  NotificationCategory,
  TargetRole,
} from "@/lib/notifications-data";

// Force this route to be dynamically rendered on the server.
// This avoids static prerendering on Vercel and prevents build-time
// failures due to client-only hooks or browser APIs used in this tree.
export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<NotificationCategory, LucideIcon> = {
  system: Settings,
  customers: Users,
  affiliate_users: UserCheck,
  new_products: Package,
  new_services: Scissors,
  new_orders: ShoppingCart,
  withdraw_request: Wallet,
};

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  system: "System",
  customers: "Customers",
  affiliate_users: "Affiliate Users",
  new_products: "New Products",
  new_services: "New Services",
  new_orders: "New Orders",
  withdraw_request: "Withdraw Request",
};

const CREATE_CATEGORIES = [
  { value: "orders", label: "Orders" },
  { value: "returns", label: "Returns" },
  { value: "refunds", label: "Refunds" },
  { value: "withdrawals", label: "Withdrawals" },
  { value: "promotions", label: "Promotions" },
  { value: "system_updates", label: "System Updates" },
  { value: "account_alerts", label: "Account Alerts" },
  { value: "kyc_verification", label: "KYC / Verification" },
  { value: "wallet", label: "Wallet" },
  { value: "commission", label: "Commission" },
] as const;

type CreateCategory = (typeof CREATE_CATEGORIES)[number]["value"];

const CREATE_CATEGORY_TO_NOTIFICATION: Record<CreateCategory, NotificationCategory> = {
  orders: "new_orders",
  returns: "system",
  refunds: "system",
  withdrawals: "withdraw_request",
  promotions: "system",
  system_updates: "system",
  account_alerts: "system",
  kyc_verification: "system",
  wallet: "withdraw_request",
  commission: "affiliate_users",
};

const SEND_TO_OPTIONS = [
  { value: "all_users", label: "All users" },
  { value: "paid_users", label: "Paid users" },
  { value: "unpaid_users", label: "Unpaid users" },
  { value: "all_affiliates", label: "All affiliates" },
  { value: "non_affiliates", label: "Non-affiliates" },
] as const;

type SendToOption = (typeof SEND_TO_OPTIONS)[number]["value"];

const SEND_TO_TO_TARGET_ROLE: Record<SendToOption, TargetRole> = {
  all_users: "all",
  paid_users: "customers",
  unpaid_users: "customers",
  all_affiliates: "affiliate_users",
  non_affiliates: "customers",
};

function mapTargetRoleToSendTo(role?: TargetRole): SendToOption {
  if (role === "affiliate_users") return "all_affiliates";
  if (role === "customers") return "all_users";
  return "all_users";
}

function mapNotificationCategoryToCreateCategory(
  category: NotificationCategory
): CreateCategory | "" {
  switch (category) {
    case "new_orders":
      return "orders";
    case "withdraw_request":
      return "withdrawals";
    case "affiliate_users":
      return "commission";
    case "system":
      return "system_updates";
    default:
      return "promotions";
  }
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

/** Two-column detail row: label left, value right. */
function DetailRow({
  label,
  value,
  valueBold = false,
}: {
  label: string;
  value: React.ReactNode;
  valueBold?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-3 border-b border-gray-100 last:border-0">
      <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
      <dd
        className={`text-sm text-right text-gray-900 min-w-0 ${
          valueBold ? "font-semibold" : "font-medium"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function NotificationDetailDrawer({
  notification,
  onClose,
  onNavigate,
}: {
  notification: Notification;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const { payload } = notification;
  const isWithdraw = notification.category === "withdraw_request" && payload?.withdraw;
  const isOrder = (notification.category === "new_orders" && payload?.order) || false;
  const isReturn = !!payload?.return;

  const [bankRevealed, setBankRevealed] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);

  const handleApprove = () => {
    onClose();
    onNavigate(
      payload?.withdraw?.affiliateId && payload?.withdraw?.withdrawalId
        ? `/withdraw-requests/${payload.withdraw.affiliateId}/${payload.withdraw.withdrawalId}`
        : "/withdraw-requests"
    );
    setConfirmAction(null);
  };

  const handleReject = () => {
    onClose();
    onNavigate(
      payload?.withdraw?.affiliateId && payload?.withdraw?.withdrawalId
        ? `/withdraw-requests/${payload.withdraw.affiliateId}/${payload.withdraw.withdrawalId}`
        : "/withdraw-requests"
    );
    setConfirmAction(null);
  };

  const sectionPadding = "px-5 py-5 sm:px-6 sm:py-6";
  const cardBg = "rounded-xl bg-gray-50/80 border border-gray-100";

  const renderPrimaryActionButton = () => {
    if (isOrder) {
      return (
        <button
          type="button"
          onClick={() => {
            onClose();
            const path =
              payload?.order?.userId
                ? `/users/${payload.order.userId}`
                : (notification.redirectLink || "/orders");
            onNavigate(path);
          }}
          className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Order
        </button>
      );
    }

    if (isReturn) {
      return (
        <button
          type="button"
          onClick={() => {
            onClose();
            const path =
              payload?.return?.userId
                ? `/users/${payload.return.userId}`
                : (notification.redirectLink || "/users");
            onNavigate(path);
          }}
          className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          View Return
        </button>
      );
    }

    if (!isWithdraw && !isOrder && !isReturn && notification.redirectLink) {
      return (
        <button
          type="button"
          onClick={() => {
            onClose();
            onNavigate(notification.redirectLink!);
          }}
          className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors"
        >
          <Eye className="w-4 h-4" />
          View details
        </button>
      );
    }

    return null;
  };

  return (
    <div className="min-h-0 flex flex-col">
      {/* Header Section */}
      <div className={`${sectionPadding} pb-5 border-b border-gray-100`}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900 leading-tight flex-1 min-w-0">
            {notification.title}
          </h2>
          <span
            className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
              notification.read ? "bg-gray-100 text-gray-600" : "bg-[#D96A86]/10 text-[#D96A86]"
            }`}
          >
            {notification.read ? "Read" : "Unread"}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">{formatDateTime(notification.timestamp)}</p>
      </div>

      {/* Event Summary */}
      <div className={`${sectionPadding} py-5`}>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Event summary
        </h3>
        <div className={`${cardBg} p-4 sm:p-5`}>
          <p className="text-sm text-gray-700 leading-relaxed">{notification.description}</p>
        </div>
      </div>

      {/* Details Section */}
      {(isWithdraw || isOrder || isReturn) && (
        <div className={`${sectionPadding} py-5 border-t border-gray-100`}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {isWithdraw ? "Withdraw details" : isOrder ? "Order details" : "Return details"}
          </h3>
          <div className={`${cardBg} p-4 sm:p-5`}>
            <dl className="space-y-0">
              {isWithdraw && payload?.withdraw && (
                <>
                  <DetailRow label="Affiliate" value={payload.withdraw.affiliateName} />
                  <DetailRow
                    label="Requested amount"
                    value={formatCurrency(payload.withdraw.requestedAmount)}
                    valueBold
                  />
                  <DetailRow
                    label="Wallet balance"
                    value={formatCurrency(payload.withdraw.walletBalance)}
                    valueBold
                  />
                  <div className="flex justify-between items-center gap-4 py-3 border-b border-gray-100">
                    <dt className="text-sm text-gray-500 shrink-0">Bank / UPI</dt>
                    <dd className="flex items-center gap-2 min-w-0 justify-end">
                      <span className="font-mono text-sm text-gray-900">
                        {bankRevealed && payload.withdraw.fullBankDetails
                          ? payload.withdraw.fullBankDetails
                          : payload.withdraw.bankUpiMasked}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBankRevealed((v) => !v)}
                        className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                        aria-label={bankRevealed ? "Mask" : "Reveal"}
                      >
                        {bankRevealed ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </dd>
                  </div>
                </>
              )}
              {isOrder && payload?.order && (
                <>
                  <DetailRow label="Order ID" value={payload.order.orderId} />
                  <DetailRow label="Customer" value={payload.order.customerName} />
                  <DetailRow
                    label="Amount"
                    value={formatCurrency(payload.order.amount)}
                    valueBold
                  />
                  <DetailRow label="Payment method" value={payload.order.paymentMethod} />
                </>
              )}
              {isReturn && payload?.return && (
                <>
                  <DetailRow label="Order ID" value={payload.return.orderId} />
                  <DetailRow label="Product" value={payload.return.productName} />
                  <div className="py-3 border-b border-gray-100">
                    <dt className="text-sm text-gray-500 mb-1">Return reason</dt>
                    <dd className="text-sm text-gray-900 font-medium">
                      {payload.return.returnReason}
                    </dd>
                  </div>
                  <DetailRow label="Status" value={payload.return.returnStatus} />
                </>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* Action Section */}
      <div className={`${sectionPadding} pt-5 mt-auto border-t border-gray-100`}>
        <div className="flex flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          {renderPrimaryActionButton()}
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmAction && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            aria-hidden
            onClick={() => setConfirmAction(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,360px)] bg-white rounded-2xl shadow-xl border border-gray-100 p-6 z-[70]"
          >
            <p className="text-sm font-medium text-gray-900">
              {confirmAction === "approve"
                ? "Approve this withdrawal request? You will be taken to the request details."
                : "Reject this withdrawal request? You will be taken to the request details."}
            </p>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction === "approve" ? handleApprove : handleReject}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
                  confirmAction === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmAction === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationCard({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const Icon = CATEGORY_ICONS[notification.icon];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border shadow-sm transition-all hover:shadow-md p-4 sm:p-5 flex gap-4 ${
        notification.read
          ? "bg-white border-gray-100"
          : "bg-[#fef5f7]/60 border-[#f8c6d0]/60"
      }`}
    >
      <div
        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          notification.read ? "bg-gray-100 text-gray-600" : "bg-[#D96A86]/10 text-[#D96A86]"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3
            className={`text-sm font-semibold ${
              notification.read ? "text-gray-700" : "text-gray-900"
            }`}
          >
            {notification.title}
          </h3>
          <span className="text-xs text-gray-500 shrink-0">
            {formatTimestamp(notification.timestamp)}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {notification.description}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Related: {notification.relatedUser}
        </p>
        {!notification.read && (
          <span className="inline-block mt-2 w-2 h-2 rounded-full bg-[#D96A86]" />
        )}
      </div>
    </button>
  );
}

function NotificationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    notifications,
    markAsRead,
    deleteNotification,
    createNotification,
    updateNotification,
  } = useNotifications();

  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "read" | "unread">("");
  const [categoryFilter, setCategoryFilter] = useState<"" | CreateCategory>("");

  const [createForm, setCreateForm] = useState<{
    title: string;
    description: string;
    image: string;
    link: string;
    state: string;
    city: string;
    pincode: string;
    category: CreateCategory | "";
    sendTo: SendToOption;
    scheduleType: "now" | "later";
    scheduleDate: string;
    scheduleTime: string;
  }>({
    title: "",
    description: "",
    image: "",
    link: "",
    state: "",
    city: "",
    pincode: "",
    category: "",
    sendTo: "all_users",
    scheduleType: "now",
    scheduleDate: "",
    scheduleTime: "",
  });

  const STATUS_FILTER_OPTIONS: FilterOption[] = [
    { value: "", label: "All statuses" },
    { value: "unread", label: "Unread" },
    { value: "read", label: "Read" },
  ];

  const CATEGORY_FILTER_OPTIONS: FilterOption[] = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...CREATE_CATEGORIES.map((cat) => ({
        value: cat.value,
        label: cat.label,
      })),
    ],
    []
  );

  const filtered = useMemo(() => {
    let list = [...notifications];

    // Status filter
    if (statusFilter === "unread") {
      list = list.filter((n) => !n.read);
    } else if (statusFilter === "read") {
      list = list.filter((n) => n.read);
    }

    // Category filter
    if (categoryFilter) {
      const mappedCategory = CREATE_CATEGORY_TO_NOTIFICATION[categoryFilter];
      list = list.filter((n) => n.category === mappedCategory);
    }

    // Search by title / description
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
      );
    }

    return list.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [notifications, search, statusFilter, categoryFilter]);

  const focusId = searchParams.get("focusId");

  useEffect(() => {
    if (!focusId) return;
    const match = filtered.find((n) => n.id === focusId);
    if (!match || match.read) return;
    markAsRead(match.id);
    setSelectedNotification({ ...match, read: true });
  }, [focusId, filtered, markAsRead]);

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id);
    setSelectedNotification({ ...n, read: true });
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      description: "",
      image: "",
      link: "",
      state: "",
      city: "",
      pincode: "",
      category: "",
      sendTo: "all_users",
      scheduleType: "now",
      scheduleDate: "",
      scheduleTime: "",
    });
    setCreateError(null);
  };

  const openCreateDrawer = () => {
    setEditingNotification(null);
    resetCreateForm();
    setCreateOpen(true);
  };

  const handleEditNotification = (notification: Notification) => {
    setEditingNotification(notification);
    setCreateForm({
      title: notification.title,
      description: notification.description,
      image: notification.imageName ?? "",
      link: notification.redirectLink ?? "",
      state: notification.locationState ?? "",
      city: notification.locationCity ?? "",
      pincode: notification.locationPincode ?? "",
      category: mapNotificationCategoryToCreateCategory(notification.category),
      sendTo: mapTargetRoleToSendTo(notification.targetRole),
      scheduleType: "now",
      scheduleDate: "",
      scheduleTime: "",
    });
    setCreateError(null);
    setCreateOpen(true);
  };

  const handleCreateSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.description.trim()) {
      setCreateError("Title and description are required.");
      return;
    }
    if (!createForm.category) {
      setCreateError("Please select a category.");
      return;
    }

    let scheduledTimestamp: string | undefined;
    if (createForm.scheduleType === "later") {
      if (!createForm.scheduleDate || !createForm.scheduleTime) {
        setCreateError("Please select schedule date and time.");
        return;
      }
      const dt = new Date(`${createForm.scheduleDate}T${createForm.scheduleTime}:00`);
      if (Number.isNaN(dt.getTime())) {
        setCreateError("Invalid schedule date or time.");
        return;
      }
      scheduledTimestamp = dt.toISOString();
    }

    setCreateSubmitting(true);
    try {
      const payload = {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        targetRole: SEND_TO_TO_TARGET_ROLE[createForm.sendTo],
        redirectLink: createForm.link.trim() || undefined,
        category: CREATE_CATEGORY_TO_NOTIFICATION[createForm.category],
        timestamp: scheduledTimestamp,
        imageName: createForm.image || undefined,
        locationState: createForm.state.trim() || undefined,
        locationCity: createForm.city.trim() || undefined,
        locationPincode: createForm.pincode.trim() || undefined,
      };

      if (editingNotification) {
        updateNotification(editingNotification.id, payload);
      } else {
        createNotification(payload);
      }

      setCreateOpen(false);
      resetCreateForm();
      setEditingNotification(null);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDeleteNotification = (notification: Notification) => {
    setDeleteTarget(notification);
    setActionMenuFor(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Notification History</h1>
          <button
            type="button"
            onClick={openCreateDrawer}
            className="shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
            <span className="hidden sm:inline">Notification</span>
          </button>
        </div>
        <div className="mt-4">
          <Filters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by title or description..."
            searchPlaceholderMobile="Search..."
            filterOptions={STATUS_FILTER_OPTIONS}
            filterValue={statusFilter}
            onFilterChange={(value) =>
              setStatusFilter(value as "" | "read" | "unread")
            }
            categoryOptions={CATEGORY_FILTER_OPTIONS}
            categoryValue={categoryFilter}
            onCategoryChange={(value) =>
              setCategoryFilter(value as "" | CreateCategory)
            }
          />
        </div>
      </div>

      {/* List - table / card layout */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications match this filter.</p>
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {filtered.map((notification, index) => (
              <div
                key={notification.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNotificationClick(notification)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleNotificationClick(notification);
                  }
                }}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex flex-col gap-3 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-500 mb-0.5">
                      #{index + 1}
                    </p>
                    <h3
                      className={`text-sm font-semibold leading-snug line-clamp-2 ${
                        notification.read ? "text-gray-700" : "text-gray-900"
                      }`}
                    >
                      {notification.title}
                    </h3>
                    <span
                      className={`mt-1 inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        notification.read
                          ? "bg-gray-100 text-gray-600"
                          : "bg-[#D96A86]/10 text-[#D96A86]"
                      }`}
                    >
                      {notification.read ? "Read" : "Unread"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuFor((prev) =>
                            prev === notification.id ? null : notification.id
                          );
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {actionMenuFor === notification.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuFor(null);
                              handleNotificationClick(notification);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuFor(null);
                              handleEditNotification(notification);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {notification.description}
                </p>
                <div className="mt-1 rounded-xl bg-gray-50/80 border border-gray-100 px-3 py-3">
                  <dl className="space-y-0">
                    <DetailRow
                      label="Image"
                      value={
                        notification.imageName ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#D96A86]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D96A86]" />
                            Image attached
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No image</span>
                        )
                      }
                    />
                    <DetailRow
                      label="Link"
                      value={
                        notification.redirectLink ? (
                          <a
                            href={notification.redirectLink}
                            className="text-xs text-[#D96A86] underline-offset-2 hover:underline break-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {notification.redirectLink}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )
                      }
                    />
                    <DetailRow
                      label="Date &amp; time"
                      value={
                        <span className="text-xs text-gray-900">
                          {formatDateTime(notification.timestamp)}
                        </span>
                      }
                    />
                  </dl>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#fef5f7] text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 px-4 text-left font-semibold">Sr No</th>
                    <th className="py-3 px-4 text-left font-semibold">Title</th>
                    <th className="py-3 px-4 text-left font-semibold">Description</th>
                    <th className="py-3 px-4 text-left font-semibold">Image</th>
                    <th className="py-3 px-4 text-left font-semibold">Link</th>
                    <th className="py-3 px-4 text-left font-semibold">Date &amp; Time</th>
                    <th className="py-3 px-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((notification, index) => (
                    <tr
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="border-b border-gray-50 last:border-0 hover:bg-[#fef5f7]/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-900 font-medium max-w-[160px] truncate">
                        {notification.title}
                      </td>
                      <td className="py-3 px-4 text-gray-700 max-w-[260px]">
                        <span
                          className="block truncate"
                          title={notification.description}
                        >
                          {notification.description}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {notification.imageName ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#fef5f7] text-[#D96A86]"
                            title={notification.imageName}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D96A86]" />
                            Image attached
                          </span>
                        ) : (
                          <span className="text-gray-400">No image</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {notification.redirectLink ? (
                          <a
                            href={notification.redirectLink}
                            className="text-[#D96A86] hover:underline"
                            onClick={(e) => e.preventDefault()}
                          >
                            {notification.redirectLink}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {formatDateTime(notification.timestamp)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="relative inline-flex justify-end w-full">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuFor((prev) =>
                                prev === notification.id ? null : notification.id
                              );
                            }}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {actionMenuFor === notification.id && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuFor(null);
                                  handleNotificationClick(notification);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuFor(null);
                                  handleEditNotification(notification);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteNotification(notification)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Notification detail drawer */}
      <Drawer
        open={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title="Notification"
        width="lg"
      >
        {selectedNotification && (
          <NotificationDetailDrawer
            notification={selectedNotification}
            onClose={() => setSelectedNotification(null)}
            onNavigate={(path) => router.push(path)}
          />
        )}
      </Drawer>

      <DeletePopup
        open={deleteTarget != null}
        title="Delete notification"
        description={
          deleteTarget
            ? `Permanently delete notification "${deleteTarget.title}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteNotification(deleteTarget.id);
            if (selectedNotification?.id === deleteTarget.id) {
              setSelectedNotification(null);
            }
          }
          setDeleteTarget(null);
        }}
      />

      {/* Create notification drawer */}
      <Drawer
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
        }}
        title="Add Notification"
        width="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter notification title"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D96A86] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Write a short message for users"
                rows={4}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D96A86] focus:border-transparent resize-none"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Add image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      image: e.target.files?.[0]?.name ?? "",
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#fef5f7] file:text-[#D96A86] hover:file:bg-[#f8e0e6]"
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Location <span className="text-xs text-gray-400">(optional)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      value={createForm.state}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, state: e.target.value }))
                      }
                      placeholder="e.g. Maharashtra"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D96A86] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={createForm.city}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, city: e.target.value }))
                      }
                      placeholder="e.g. Mumbai"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D96A86] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={createForm.pincode}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, pincode: e.target.value }))
                      }
                      placeholder="e.g. 400001"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D96A86] focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500">
                  Use these fields to target notifications to users in a specific state, city or pincode.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Add link
                </label>
                <input
                  type="text"
                  value={createForm.link}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, link: e.target.value }))
                  }
                  placeholder="https:// or internal path (optional)"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D96A86] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </p>
            <select
              value={createForm.category}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  category: e.target.value as CreateCategory,
                }))
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D96A86] focus:border-transparent"
            >
              <option value="">Select category</option>
              {CREATE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Send to <span className="text-red-500">*</span>
            </p>
            <select
              value={createForm.sendTo}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  sendTo: e.target.value as SendToOption,
                }))
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D96A86] focus:border-transparent"
            >
              {SEND_TO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Schedule
            </p>
            <div className="flex flex-wrap gap-2">
              {(["now", "later"] as const).map((mode) => {
                const active = createForm.scheduleType === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      setCreateForm((prev) => ({ ...prev, scheduleType: mode }))
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      active
                        ? "border-[#D96A86] bg-[#fef5f7] text-[#D96A86]"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-[#fef5f7]"
                    }`}
                  >
                    {mode === "now" ? "Send now" : "Schedule for later"}
                  </button>
                );
              })}
            </div>
            {createForm.scheduleType === "later" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={createForm.scheduleDate}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        scheduleDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D96A86] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    value={createForm.scheduleTime}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        scheduleTime: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D96A86] focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {createError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {createError}
            </p>
          )}

          <div className="flex flex-row items-stretch sm:items-center justify-start gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false);
              }}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Bell className="w-4 h-4" />
              {createSubmitting ? "Sending..." : "Send notification"}
            </button>
          </div>
        </form>
      </Drawer>

    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-7 w-48 bg-gray-100 rounded-lg animate-pulse" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-pulse" />
            <p className="text-gray-400 text-sm">Loading notifications...</p>
          </div>
        </div>
      }
    >
      <NotificationsPageContent />
    </Suspense>
  );
}
