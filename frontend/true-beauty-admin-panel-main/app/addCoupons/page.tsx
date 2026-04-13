"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  Plus,
  Ban,
  CheckCircle,
} from "lucide-react";
import { useCoupons } from "@/lib/coupons-context";
import { useProducts } from "@/lib/products-context";
import type { Coupon, CouponDiscountType, CouponStatus } from "@/lib/coupons-data";
import type { CouponFormValues } from "@/lib/coupons-context";
import { Drawer } from "@/components/ui/Drawer";
import { CouponForm } from "@/components/ui/CouponForm";
import Table from "@/components/Table";
import { Filters, type FilterOption } from "@/components/ui/filters";
import { KpiCard } from "@/components/ui/kpiCard";
import DeletePopup from "@/components/ui/deletePopup";

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
];

const TYPE_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All types" },
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed" },
];

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  disabled: "Disabled",
};

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  disabled: "bg-gray-100 text-gray-600",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Two-column detail row: label left, value right (Notification drawer style). */
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

function CouponActionsMenu({
  coupon,
  onView,
  onEdit,
  onDisable,
  onDelete,
}: {
  coupon: Coupon;
  onView: (c: Coupon) => void;
  onEdit: (c: Coupon) => void;
  onDisable: (c: Coupon) => void;
  onDelete: (c: Coupon) => void;
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

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-[#fef5f7] transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onView(coupon);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors text-left"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit(coupon);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors text-left"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDisable(coupon);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors text-left"
          >
            {coupon.status === "active" ? (
              <>
                <Ban className="w-4 h-4" />
                Disable
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Enable
              </>
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete(coupon);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ViewCouponDrawer({
  coupon,
  open,
  onClose,
  onEdit,
  productOptions = [],
}: {
  coupon: Coupon | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (c: Coupon) => void;
  productOptions?: { id: string; name: string }[];
}) {
  const sectionPadding = "px-5 py-5 sm:px-6 sm:py-6";
  const cardBg = "rounded-xl bg-gray-50/80 border border-gray-100";

  const applicableRoleLabel =
    coupon?.applicableRole === "all"
      ? "All"
      : coupon?.applicableRole === "customers"
        ? "Customers"
        : coupon?.applicableRole === "affiliate"
          ? "Affiliate users"
          : coupon?.applicableRole ?? "";

  const applicableCategoryLabel =
    coupon?.applicableCategoryIds?.length && coupon.applicableCategoryIds[0]
      ? coupon.applicableCategoryIds[0]
      : "All categories";

  const applicableProductLabel =
    coupon?.applicableProductIds?.length && coupon.applicableProductIds[0]
      ? productOptions.find((p) => p.id === coupon.applicableProductIds[0])?.name ?? coupon.applicableProductIds[0]
      : "All products";

  if (!coupon) return null;
  return (
    <Drawer open={open} onClose={onClose} title="Coupon Details" width="md">
      <div className="min-h-0 flex flex-col">
        {/* Header Section */}
        <div className={`${sectionPadding} pb-5 border-b border-gray-100`}>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900 leading-tight flex-1 min-w-0 font-mono">
              {coupon.code}
            </h2>
            <span
              className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                STATUS_CLASSES[coupon.status] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {STATUS_LABELS[coupon.status] ?? coupon.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Valid {formatDate(coupon.startDate)} – {formatDate(coupon.expiryDate)}
          </p>
        </div>

        {/* Discount & eligibility */}
        <div className={`${sectionPadding} py-5 border-t border-gray-100`}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Discount & eligibility
          </h3>
          <div className={`${cardBg} p-4 sm:p-5`}>
            <dl className="space-y-0">
              <DetailRow
                label="Type"
                value={<span className="capitalize">{coupon.discountType}</span>}
              />
              <DetailRow
                label="Discount"
                value={
                  coupon.discountType === "percentage"
                    ? `${coupon.discountValue}%`
                    : formatCurrency(coupon.discountValue)
                }
                valueBold
              />
              <DetailRow label="Min order value" value={formatCurrency(coupon.minOrderValue)} />
              {coupon.discountType === "percentage" && coupon.maxDiscountCap != null && (
                <DetailRow label="Max discount cap" value={formatCurrency(coupon.maxDiscountCap)} />
              )}
              <DetailRow
                label="Usage limit (total)"
                value={coupon.usageLimitTotal ?? "Unlimited"}
              />
              <DetailRow
                label="Usage limit (per user)"
                value={coupon.usageLimitPerUser ?? "Unlimited"}
              />
              <DetailRow label="Used count" value={coupon.usedCount} />
              <DetailRow label="Applicable role" value={applicableRoleLabel} />
              <DetailRow label="Applicable category" value={applicableCategoryLabel} />
              <DetailRow label="Applicable product" value={applicableProductLabel} />
            </dl>
          </div>
        </div>

        {/* Action */}
        {onEdit && (
          <div className={`${sectionPadding} pt-5 mt-auto border-t border-gray-100`}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(coupon);
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit coupon
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default function AddCouponsPage() {
  const { coupons, addCoupon, updateCoupon, toggleCouponStatus, deleteCoupon } =
    useCoupons();
  const { products } = useProducts();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [viewingCoupon, setViewingCoupon] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | CouponStatus>("");
  const [typeFilter, setTypeFilter] = useState<"" | CouponDiscountType>("");

  const productOptions = useMemo(
    () =>
      products
        .filter((p) => !p.deletedAt)
        .map((p) => ({
          id: p.id,
          name: p.name,
          price: p.discountPrice ?? p.price,
          category: p.category,
        })),
    [products]
  );

  const kpis = useMemo(() => {
    const now = Date.now();
    const total = coupons.length;
    const active = coupons.filter((c) => c.status === "active").length;
    const disabled = coupons.filter((c) => c.status === "disabled").length;
    const expired = coupons.filter(
      (c) => new Date(c.expiryDate).getTime() < now
    ).length;
    return { total, active, disabled, expired };
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    let list = [...coupons];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => c.code.toLowerCase().includes(q));
    }
    if (statusFilter) {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (typeFilter) {
      list = list.filter((c) => c.discountType === typeFilter);
    }
    return list;
  }, [coupons, search, statusFilter, typeFilter]);

  const handleCreate = () => {
    setEditingCoupon(null);
    setDrawerOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setDrawerOpen(true);
  };

  const handleView = (coupon: Coupon) => {
    setViewingCoupon(coupon);
    setViewDrawerOpen(true);
  };

  const handleFormSubmit = (values: CouponFormValues) => {
    if (editingCoupon) {
      updateCoupon(editingCoupon.id, values);
    } else {
      addCoupon(values);
    }
    setDrawerOpen(false);
    setEditingCoupon(null);
  };

  const handleFormCancel = () => {
    setDrawerOpen(false);
    setEditingCoupon(null);
  };

  const handleDisable = (coupon: Coupon) => {
    toggleCouponStatus(coupon.id);
  };

  const handleDelete = (coupon: Coupon) => {
    setDeleteTarget(coupon);
  };

  const columns = useMemo(
    () => [
      {
        header: "Coupon Code",
        accessor: (c: Coupon) => (
          <span className="font-mono font-medium text-gray-900">{c.code}</span>
        ),
      },
      {
        header: "Discount",
        accessor: (c: Coupon) => {
          const pct =
            c.discountType === "percentage"
              ? c.discountValue
              : c.minOrderValue > 0
                ? Math.round((c.discountValue / c.minOrderValue) * 100)
                : 0;
          return (
            <span className="text-gray-900">{pct}%</span>
          );
        },
      },
      {
        header: "Category",
        accessor: (c: Coupon) => (
          <span className="text-gray-700">
            {c.applicableCategoryIds && c.applicableCategoryIds.length > 0
              ? c.applicableCategoryIds.join(", ")
              : "All categories"}
          </span>
        ),
      },
      {
        header: "Product Amount",
        accessor: (c: Coupon) => (
          <span className="text-gray-700">{formatCurrency(c.minOrderValue)}</span>
        ),
      },
      {
        header: "Expiry Date",
        accessor: (c: Coupon) => (
          <span className="text-gray-700">{formatDate(c.expiryDate)}</span>
        ),
      },
      {
        header: "Status",
        accessor: (c: Coupon) => (
          <span
            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
              STATUS_CLASSES[c.status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {STATUS_LABELS[c.status] ?? c.status}
          </span>
        ),
      },
      {
        header: "Actions",
        cellClassName: "text-center",
        accessor: (c: Coupon) => (
          <div className="inline-flex justify-center w-full">
            <CouponActionsMenu
              coupon={c}
              onView={handleView}
              onEdit={handleEdit}
              onDisable={handleDisable}
              onDelete={handleDelete}
            />
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          My Coupons
        </h1>
        <button
          type="button"
          onClick={handleCreate}
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors shadow-sm text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Create Coupon
        </button>
      </div>

      {/* KPI Cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <KpiCard
          title="Total Coupons"
          value={kpis.total.toLocaleString()}
          icon="shopping-cart"
          iconClassName="bg-blue-50 text-blue-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Total Active Coupons"
          value={kpis.active.toLocaleString()}
          icon="user-check"
          iconClassName="bg-emerald-50 text-emerald-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Total Disabled Coupons"
          value={kpis.disabled.toLocaleString()}
          icon="user-x"
          iconClassName="bg-gray-100 text-gray-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Total Expired Coupons"
          value={kpis.expired.toLocaleString()}
          icon="trending-up"
          iconClassName="bg-red-50 text-red-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
      </div>

      <Filters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by coupon code..."
        searchPlaceholderMobile="Search..."
        filterOptions={STATUS_FILTER_OPTIONS}
        filterValue={statusFilter}
        onFilterChange={(value) => setStatusFilter(value as "" | CouponStatus)}
        categoryOptions={TYPE_FILTER_OPTIONS}
        categoryValue={typeFilter}
        onCategoryChange={(value) => setTypeFilter(value as "" | CouponDiscountType)}
      />

      {filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
          <p className="text-gray-500 mb-4 text-sm sm:text-base">
            No coupons match your filters.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Create Coupon
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {filteredCoupons.map((coupon, index) => (
              <div
                key={coupon.id}
                onClick={() => {
                  setViewingCoupon(coupon);
                  setViewDrawerOpen(true);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setViewingCoupon(coupon);
                    setViewDrawerOpen(true);
                  }
                }}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex flex-col gap-3 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] text-gray-500 mb-0.5">#{index + 1}</p>
                    <p className="font-mono font-semibold text-gray-900 text-sm">
                      {coupon.code}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        STATUS_CLASSES[coupon.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {STATUS_LABELS[coupon.status] ?? coupon.status}
                    </span>
                    <CouponActionsMenu
                      coupon={coupon}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDisable={handleDisable}
                      onDelete={handleDelete}
                    />
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-gray-50/80 border border-gray-100 px-3 py-3">
                  <dl className="space-y-0 text-xs text-gray-600">
                    <DetailRow
                      label="Type"
                      value={
                        <span className="capitalize text-gray-900">
                          {coupon.discountType}
                        </span>
                      }
                    />
                    <DetailRow
                      label="Discount"
                      value={
                        <span className="text-gray-900">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}%`
                            : formatCurrency(coupon.discountValue)}
                        </span>
                      }
                      valueBold
                    />
                    <DetailRow
                      label="Category"
                      value={
                        <span className="text-gray-900 break-words">
                          {coupon.applicableCategoryIds && coupon.applicableCategoryIds.length > 0
                            ? coupon.applicableCategoryIds.join(", ")
                            : "All categories"}
                        </span>
                      }
                    />
                    <DetailRow
                      label="Min order"
                      value={
                        <span className="text-gray-900">
                          {formatCurrency(coupon.minOrderValue)}
                        </span>
                      }
                    />
                    <DetailRow
                      label="Expiry"
                      value={
                        <span className="text-gray-900">
                          {formatDate(coupon.expiryDate)}
                        </span>
                      }
                    />
                  </dl>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <Table<Coupon>
              data={filteredCoupons}
              columns={columns}
              searchable={false}
              filterable={false}
              itemsPerPage={10}
              onRowClick={(coupon) => {
                setViewingCoupon(coupon);
                setViewDrawerOpen(true);
              }}
            />
          </div>
        </>
      )}

      <Drawer
        open={drawerOpen}
        onClose={handleFormCancel}
        title={editingCoupon ? "Edit Coupon" : "Create Coupon"}
        width="lg"
      >
        <CouponForm
          initialValues={editingCoupon}
          productOptions={productOptions}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Drawer>

      <ViewCouponDrawer
        coupon={viewingCoupon}
        open={viewDrawerOpen}
        onClose={() => {
          setViewDrawerOpen(false);
          setViewingCoupon(null);
        }}
        onEdit={(c) => {
          setViewDrawerOpen(false);
          setViewingCoupon(null);
          setEditingCoupon(c);
          setDrawerOpen(true);
        }}
        productOptions={productOptions}
      />

      <DeletePopup
        open={deleteTarget != null}
        title="Delete coupon"
        description={
          deleteTarget
            ? `Permanently delete coupon "${deleteTarget.code}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteCoupon(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
