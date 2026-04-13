"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, MoreVertical, Ban } from "lucide-react";
import Table from "@/components/Table";
import { Filters, type FilterOption } from "@/components/ui/filters";
import { KpiCard } from "@/components/ui/kpiCard";
import { useAffiliates } from "@/lib/affiliates-context";
import {
  AFFILIATE_STATUS_CLASSES,
  AFFILIATE_STATUS_LABELS,
} from "@/lib/affiliates-ui";
import type { AffiliateStatus, Affiliate } from "@/lib/affiliates-data";

interface AffiliateActionsMenuProps {
  affiliate: Affiliate;
  onToggleBlock: (affiliate: Affiliate) => void;
}

function AffiliateActionsMenu({
  affiliate,
  onToggleBlock,
}: AffiliateActionsMenuProps) {
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

  const isBlocked = affiliate.status === "blocked";

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
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
          <Link
            href={`/affiliates/${affiliate.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors text-left"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onToggleBlock(affiliate);
            }}
            className={`flex w-full items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
              isBlocked
                ? "text-emerald-700 hover:bg-emerald-50"
                : "text-red-600 hover:bg-red-50"
            }`}
          >
        <Ban className="w-4 h-4" />
        <span>{isBlocked ? "Unblock affiliate" : "Block affiliate"}</span>
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
  { value: "active", label: AFFILIATE_STATUS_LABELS.active },
  { value: "blocked", label: AFFILIATE_STATUS_LABELS.blocked },
];

export default function AffiliatesPage() {
  const { affiliates, setAffiliateStatus, updateWithdrawalStatus } =
    useAffiliates();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | AffiliateStatus>("");

  const filteredAffiliates = useMemo(() => {
    let list = [...affiliates];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((a) => {
        return (
          a.name.toLowerCase().includes(q) ||
          a.referralCode.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter) {
      list = list.filter((a) => a.status === statusFilter);
    }

    return list;
  }, [affiliates, search, statusFilter]);

  const kpis = useMemo(() => {
    const totalAffiliates = affiliates.length;
    const activeAffiliates = affiliates.filter(
      (a) => a.status === "active"
    ).length;
    const blockedAffiliates = affiliates.filter(
      (a) => a.status === "blocked"
    ).length;
    const totalCommission = affiliates.reduce(
      (sum, a) => sum + a.totalCommission,
      0
    );
    const totalWalletBalance = affiliates.reduce(
      (sum, a) => sum + a.walletBalance,
      0
    );

    return {
      totalAffiliates,
      activeAffiliates,
      blockedAffiliates,
      totalCommission,
      totalWalletBalance,
    };
  }, [affiliates]);

  const handleToggleBlock = (affiliate: Affiliate) => {
    const nextStatus: AffiliateStatus =
      affiliate.status === "active" ? "blocked" : "active";
    const confirmed = window.confirm(
      nextStatus === "blocked"
        ? "Block this affiliate? They will stop earning new commission."
        : "Unblock this affiliate and allow them to earn again?"
    );
    if (!confirmed) return;
    setAffiliateStatus(affiliate.id, nextStatus);
  };

  const columns = [
    {
      header: "Name",
      accessor: (affiliate: (typeof affiliates)[number]) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{affiliate.name}</span>
          <span className="text-xs text-gray-500">{affiliate.email}</span>
        </div>
      ),
    },
    {
      header: "Referral Code",
      accessor: (affiliate: (typeof affiliates)[number]) => (
        <span className="text-sm font-mono text-gray-800">
          {affiliate.referralCode}
        </span>
      ),
    },
    {
      header: "Total Referrals",
      accessor: (affiliate: (typeof affiliates)[number]) => (
        <span className="text-sm text-gray-800">
          {affiliate.totalReferrals.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Total Orders",
      accessor: (affiliate: (typeof affiliates)[number]) => (
        <span className="text-sm text-gray-800">
          {affiliate.totalOrders.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (affiliate: (typeof affiliates)[number]) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            AFFILIATE_STATUS_CLASSES[affiliate.status] ??
            "bg-gray-50 text-gray-700"
          }`}
        >
          {AFFILIATE_STATUS_LABELS[affiliate.status] ?? affiliate.status}
        </span>
      ),
    },
    {
      header: "Joined Date",
      accessor: (affiliate: (typeof affiliates)[number]) => (
        <span className="text-sm text-gray-600">
          {formatDate(affiliate.joinedAt)}
        </span>
      ),
    },
    {
      header: "Actions",
      cellClassName: "text-center",
      accessor: (affiliate: (typeof affiliates)[number]) => (
        <div className="inline-flex justify-center w-full">
          <AffiliateActionsMenu
            affiliate={affiliate}
            onToggleBlock={handleToggleBlock}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-6">
        <KpiCard
          title="Total Affiliates"
          value={kpis.totalAffiliates.toLocaleString()}
          icon="users"
          iconClassName="bg-blue-50 text-blue-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Active Affiliates"
          value={kpis.activeAffiliates.toLocaleString()}
          icon="user-check"
          iconClassName="bg-emerald-50 text-emerald-700"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Blocked Affiliates"
          value={kpis.blockedAffiliates.toLocaleString()}
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
            searchPlaceholder="Search by name, referral code, email or phone..."
            searchPlaceholderMobile="Search ..."
            filterOptions={STATUS_FILTER_OPTIONS}
            filterValue={statusFilter}
            onFilterChange={(value) =>
              setStatusFilter(value as "" | AffiliateStatus)
            }
          />
        </div>
      </div>

      {filteredAffiliates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
          <p className="text-gray-500 mb-2 text-sm sm:text-base">
            No affiliates match your filters.
          </p>
          <p className="text-xs text-gray-400">
            Try adjusting the filters or search term.
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {filteredAffiliates.map((affiliate) => (
              <div
                key={affiliate.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {affiliate.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {affiliate.email}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-gray-600">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="uppercase tracking-wide text-gray-500">
                          Code
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-[#fef5f7] font-mono text-[11px] text-gray-900">
                          {affiliate.referralCode}
                        </span>
                      </div>
                      <span className="text-gray-600 text-right">
                        {affiliate.totalReferrals.toLocaleString()} referrals ·{" "}
                        {affiliate.totalOrders.toLocaleString()} orders
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[11px] text-gray-600 pt-1.5">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${
                          AFFILIATE_STATUS_CLASSES[affiliate.status] ??
                          "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {AFFILIATE_STATUS_LABELS[affiliate.status] ??
                          affiliate.status}
                      </span>
                      <span className="text-gray-500 text-right shrink-0">
                        Joined {formatDate(affiliate.joinedAt)}
                      </span>
                    </div>
                  </div>
                  <AffiliateActionsMenu
                    affiliate={affiliate}
                    onToggleBlock={handleToggleBlock}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table
              data={filteredAffiliates}
              columns={columns}
              searchable={false}
              filterable={false}
              itemsPerPage={10}
              onRowClick={(affiliate) => router.push(`/affiliates/${affiliate.id}`)}
            />
          </div>
        </>
      )}
    </div>
  );
}

