"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Eye, MoreVertical, Trash2 } from "lucide-react";
import { useUsers } from "@/lib/users-context";
import { type User, type UserStatus, MOCK_USERS } from "@/lib/users-data";
import { KpiCard } from "@/components/ui/kpiCard";
import { Filters, type FilterOption } from "@/components/ui/filters";
import Table from "@/components/Table";
import DeletePopup from "@/components/ui/deletePopup";

function UserActionsMenu({ user }: { user: User }) {
  const { setUserStatus, deleteUser } = useUsers();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isActive = user.status === "active";

  const toggleStatus = () => {
    setUserStatus(user.id, isActive ? "blocked" : "active");
  };

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
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
          <Link
            href={`/users/${user.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleStatus();
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors text-left ${
              isActive
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-[#fef5f7]"
            }`}
          >
            <Ban className="w-4 h-4 shrink-0" />
            <span>{isActive ? "Block" : "Unblock"}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              setShowDeleteConfirm(true);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Delete</span>
          </button>
        </div>
      )}
      <DeletePopup
        open={showDeleteConfirm}
        title="Delete user"
        description={`Delete user "${user.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          deleteUser(user.id);
          setShowDeleteConfirm(false);
        }}
      />
    </div>
  );
}

const STATUS_OPTIONS: FilterOption[] = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function UsersPage() {
  const { users } = useUsers();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | UserStatus>("");

  const filtered = useMemo(() => {
    let list = [...users];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.mobile.includes(q) ||
          u.address.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      list = list.filter((u) => u.status === statusFilter);
    }
    return list;
  }, [users, search, statusFilter]);

  const columns = [
    {
      header: "Name",
      accessor: (user: User) => (
        <div className="font-medium text-gray-900">{user.name}</div>
      ),
    },
    {
      header: "Email",
      accessor: (user: User) => (
        <span className="text-sm text-gray-600">{user.email}</span>
      ),
    },
    {
      header: "Mobile",
      accessor: (user: User) => (
        <span className="text-sm text-gray-600">{user.mobile}</span>
      ),
    },
    {
      header: "Status",
      accessor: (user: User) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            user.status === "active"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {user.status === "active" ? "Active" : "Blocked"}
        </span>
      ),
    },
    {
      header: "Total Orders",
      accessor: (user: User) => (
        <span className="text-sm text-gray-600">{user.totalOrders}</span>
      ),
    },
    {
      header: "Actions",
      accessor: (user: User) => <UserActionsMenu user={user} />,
      cellClassName: "text-center",
    },
  ];

  const kpis = useMemo(() => {
    const totalUsers = users.length;
    const totalOrders = users.reduce((s, u) => s + u.totalOrders, 0);
    const activeCount = users.filter((u) => u.status === "active").length;
    const blockedCount = users.filter((u) => u.status === "blocked").length;
    const deletedUsers = Math.max(0, MOCK_USERS.length - users.length);
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const newThisMonth = users.filter((u) => {
      const d = new Date(u.joinedDate);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;
    return {
      totalUsers,
      totalOrders,
      activeCount,
      blockedCount,
      deletedUsers,
      newThisMonth,
    };
  }, [users]);

  return (
    <div className="space-y-6">
      {/* KPI Cards — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-5 md:gap-6">
        <KpiCard
          title="Total Users"
          value={kpis.totalUsers.toLocaleString()}
          icon="users"
          iconClassName="bg-blue-50 text-blue-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Total Orders"
          value={kpis.totalOrders.toLocaleString()}
          icon="shopping-cart"
          iconClassName="bg-green-50 text-green-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Active Users"
          value={kpis.activeCount.toLocaleString()}
          icon="user-check"
          iconClassName="bg-emerald-50 text-emerald-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Blocked Users"
          value={kpis.blockedCount.toLocaleString()}
          icon="user-x"
          iconClassName="bg-red-50 text-red-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Deleted Users"
          value={kpis.deletedUsers.toLocaleString()}
          icon="trending-up"
          iconClassName="bg-orange-50 text-orange-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
      </div>

      {/* Filters */}
      <Filters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, mobile, or address..."
        searchPlaceholderMobile="Search ..."
        filterOptions={STATUS_OPTIONS}
        filterValue={statusFilter}
        onFilterChange={(value) => setStatusFilter(value as "" | UserStatus)}
      />

      {/* Mobile: User cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500 text-sm">No users match your filters.</p>
          </div>
        ) : (
          filtered.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-600 truncate mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0">
                    <span className="truncate">{user.email}</span>
                    <span className="text-gray-400 shrink-0">·</span>
                    <span className="truncate">{user.mobile}</span>
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {user.status === "active" ? "Active" : "Blocked"}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      Total orders: {user.totalOrders}
                    </span>
                  </div>
                </div>
                <UserActionsMenu user={user} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block">
        <Table<User>
          data={filtered}
          columns={columns}
          searchable={false}
          filterable={false}
          itemsPerPage={10}
          onRowClick={(user) => router.push(`/users/${user.id}`)}
        />
      </div>
    </div>
  );
}
