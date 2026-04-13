"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  CheckCircle2,
  XCircle,
  Banknote,
  MoreVertical,
} from "lucide-react";
import Table from "@/components/Table";
import { Filters, type FilterOption } from "@/components/ui/filters";
import { KpiCard } from "@/components/ui/kpiCard";
import { useAffiliates } from "@/lib/affiliates-context";
import {
  WITHDRAWAL_STATUS_CLASSES,
  WITHDRAWAL_STATUS_LABELS,
} from "@/lib/affiliates-ui";
import type { WithdrawalStatus } from "@/lib/affiliates-data";
import {
  flattenWithdrawals,
  formatCurrency,
  formatDate,
  type WithdrawRequestRow,
} from "@/lib/withdraw-requests-utils";

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: WITHDRAWAL_STATUS_LABELS.pending },
  { value: "approved", label: WITHDRAWAL_STATUS_LABELS.approved },
  { value: "rejected", label: WITHDRAWAL_STATUS_LABELS.rejected },
  { value: "paid", label: WITHDRAWAL_STATUS_LABELS.paid },
];

interface WithdrawRequestActionsMenuProps {
  row: WithdrawRequestRow;
  onApprove: (row: WithdrawRequestRow) => void;
  onReject: (row: WithdrawRequestRow) => void;
  onMarkPaid: (row: WithdrawRequestRow) => void;
}

function WithdrawRequestActionsMenu({
  row,
  onApprove,
  onReject,
  onMarkPaid,
}: WithdrawRequestActionsMenuProps) {
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

  const isPending = row.status === "pending";
  const isApproved = row.status === "approved";

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
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
          <Link
            href={`/withdraw-requests/${row.affiliateId}/${row.requestId}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors text-left w-full"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </Link>
          {isPending && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onApprove(row);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onReject(row);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </>
          )}
          {isApproved && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onMarkPaid(row);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors text-left"
            >
              <Banknote className="w-4 h-4" />
              <span>Mark Paid</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function WithdrawRequestsPage() {
  const { affiliates, updateWithdrawalStatus } = useAffiliates();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | WithdrawalStatus>("");

  const allRows = useMemo(
    () => flattenWithdrawals(affiliates),
    [affiliates]
  );

  const filteredRows = useMemo(() => {
    let list = [...allRows];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (r) =>
          r.requestId.toLowerCase().includes(q) ||
          r.affiliateName.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      list = list.filter((r) => r.status === statusFilter);
    }

    return list;
  }, [allRows, search, statusFilter]);

  const kpis = useMemo(() => {
    const totalRequests = allRows.length;
    const totalPendingRequests = allRows.filter((r) => r.status === "pending").length;
    const totalApproved = allRows.filter((r) => r.status === "approved").length;
    const totalPaid = allRows.filter((r) => r.status === "paid").length;
    const totalRejected = allRows.filter((r) => r.status === "rejected").length;

    return { totalRequests, totalPendingRequests, totalApproved, totalPaid, totalRejected };
  }, [allRows]);

  const handleApprove = (row: WithdrawRequestRow) => {
    if (row.status !== "pending") return;
    if (
      window.confirm(
        `Approve withdrawal of ${formatCurrency(row.amount)} for ${row.affiliateName}? Wallet balance will be deducted.`
      )
    ) {
      updateWithdrawalStatus(row.affiliateId, row.requestId, "approved");
    }
  };

  const handleReject = (row: WithdrawRequestRow) => {
    if (row.status !== "pending") return;
    const notes = window.prompt("Rejection reason (optional):");
    if (window.confirm("Reject this withdrawal request?")) {
      updateWithdrawalStatus(
        row.affiliateId,
        row.requestId,
        "rejected",
        notes ?? undefined
      );
    }
  };

  const handleMarkPaid = (row: WithdrawRequestRow) => {
    if (row.status !== "approved") return;
    if (
      window.confirm(
        `Mark withdrawal ${row.requestId} as paid? Confirm that payment has been sent to ${row.bankUpiMasked}.`
      )
    ) {
      updateWithdrawalStatus(row.affiliateId, row.requestId, "paid");
    }
  };

  const columns = [
    {
      header: "Affiliate Name",
      accessor: (row: WithdrawRequestRow) => (
        <span className="font-medium text-gray-900">{row.affiliateName}</span>
      ),
    },
    {
      header: "Request ID",
      accessor: (row: WithdrawRequestRow) => (
        <span className="font-mono font-medium text-gray-900">{row.requestId}</span>
      ),
    },
    {
      header: "Amount",
      accessor: (row: WithdrawRequestRow) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      header: "Wallet Balance",
      accessor: (row: WithdrawRequestRow) => (
        <span className="text-sm text-gray-700">
          {formatCurrency(row.availableWallet)}
        </span>
      ),
    },
    {
      header: "Request Date",
      accessor: (row: WithdrawRequestRow) => (
        <span className="text-sm text-gray-600">{formatDate(row.requestDate)}</span>
      ),
    },
    {
      header: "Status",
      accessor: (row: WithdrawRequestRow) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            WITHDRAWAL_STATUS_CLASSES[row.status] ?? "bg-gray-50 text-gray-700"
          }`}
        >
          {WITHDRAWAL_STATUS_LABELS[row.status] ?? row.status}
        </span>
      ),
    },
    {
      header: "Actions",
      cellClassName: "text-center",
      accessor: (row: WithdrawRequestRow) => (
        <div className="inline-flex justify-center w-full">
          <WithdrawRequestActionsMenu
            row={row}
            onApprove={handleApprove}
            onReject={handleReject}
            onMarkPaid={handleMarkPaid}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <KpiCard
          title="Total Requests"
          value={kpis.totalRequests.toLocaleString()}
          icon="users"
          iconClassName="bg-gray-100 text-gray-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Total Pending Requests"
          value={kpis.totalPendingRequests.toLocaleString()}
          icon="indian-rupee"
          iconClassName="bg-amber-50 text-amber-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Total Approved Requests"
          value={kpis.totalApproved.toLocaleString()}
          icon="user-check"
          iconClassName="bg-emerald-50 text-emerald-700"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Total Rejected Requests"
          value={kpis.totalRejected.toLocaleString()}
          icon="shopping-cart"
          iconClassName="bg-blue-50 text-blue-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
        <div className="flex-1">
          <Filters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by Request ID or Affiliate name..."
            searchPlaceholderMobile="Search ..."
            filterOptions={STATUS_FILTER_OPTIONS}
            filterValue={statusFilter}
            onFilterChange={(value) =>
              setStatusFilter(value as "" | WithdrawalStatus)
            }
          />
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
          <p className="text-gray-500 mb-2 text-sm sm:text-base">
            No withdrawal requests match your filters.
          </p>
          <p className="text-xs text-gray-400">
            Try adjusting the filters or search term.
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {filteredRows.map((row) => (
              <div
                key={`${row.affiliateId}-${row.requestId}`}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-xs font-mono font-semibold text-gray-500">
                      {row.requestId}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {row.affiliateName}
                      </p>
                      <p className="text-base font-bold text-gray-900 shrink-0">
                        {formatCurrency(row.amount)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          WITHDRAWAL_STATUS_CLASSES[row.status] ??
                          "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {WITHDRAWAL_STATUS_LABELS[row.status] ?? row.status}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {formatDate(row.requestDate)}
                      </span>
                    </div>
                  </div>
                  <WithdrawRequestActionsMenu
                    row={row}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onMarkPaid={handleMarkPaid}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table
              data={filteredRows}
              columns={columns}
              searchable={false}
              filterable={false}
              itemsPerPage={10}
              onRowClick={(row) =>
                router.push(
                  `/withdraw-requests/${row.affiliateId}/${row.requestId}`
                )
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
