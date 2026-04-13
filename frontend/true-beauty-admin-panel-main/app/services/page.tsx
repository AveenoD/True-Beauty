"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useServices } from "@/lib/services-context";
import type { Service, ServiceStatus } from "@/lib/services-data";
import type { ServiceFormValues } from "@/lib/services-context";
import { Drawer } from "@/components/ui/Drawer";
import { ServiceForm } from "@/components/ui/ServiceForm";
import Table from "@/components/Table";
import { Filters, type FilterOption } from "@/components/ui/filters";
import { KpiCard } from "@/components/ui/kpiCard";
import DeletePopup from "@/components/ui/deletePopup";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
};

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-red-50 text-red-700",
};

const STATUS_OPTIONS: FilterOption[] = [
  { value: "", label: "All statuses" },
  { value: "active", label: STATUS_LABELS.active },
  { value: "inactive", label: STATUS_LABELS.inactive },
];

function formatPrice(amount: number) {
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

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function ServiceActionsMenu({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
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
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
          <Link
            href={`/services/${service.id}`}
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
              onEdit(service);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors text-left"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete(service);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  const { services, addService, updateService, softDeleteService } = useServices();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ServiceStatus>("");
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const filteredServices = useMemo(() => {
    let list = [...services];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }
    if (statusFilter) {
      list = list.filter((s) => s.status === statusFilter);
    }
    return list;
  }, [services, search, statusFilter]);

  const kpis = useMemo(() => {
    const totalServices = services.length;
    const activeCount = services.filter((s) => s.status === "active").length;
    const inactiveCount = services.filter((s) => s.status === "inactive").length;
    const categoriesCount = new Set(services.map((s) => s.category)).size;
    return {
      totalServices,
      activeCount,
      inactiveCount,
      categoriesCount,
    };
  }, [services]);

  const handleAdd = () => {
    setEditingService(null);
    setDrawerOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setDrawerOpen(true);
  };

  const handleDelete = (service: Service) => {
    setDeleteTarget(service);
  };

  const handleFormSubmit = (values: ServiceFormValues) => {
    if (editingService) {
      updateService(editingService.id, values);
    } else {
      addService(values);
    }
    setDrawerOpen(false);
    setEditingService(null);
  };

  const handleFormCancel = () => {
    setDrawerOpen(false);
    setEditingService(null);
  };

  const columns = [
    {
      header: "Service Name",
      accessor: (service: Service) => (
        <div className="font-medium text-gray-900">{service.name}</div>
      ),
    },
    {
      header: "Category",
      accessor: (service: Service) => (
        <span className="text-sm text-gray-700">{service.category}</span>
      ),
    },
    {
      header: "Price",
      accessor: (service: Service) => (
        <span className="font-medium text-gray-900">
          {formatPrice(service.price)}
        </span>
      ),
    },
    {
      header: "Duration",
      accessor: (service: Service) => (
        <span className="text-sm text-gray-700">
          {formatDuration(service.durationMinutes)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (service: Service) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            STATUS_CLASSES[service.status] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {STATUS_LABELS[service.status] ?? service.status}
        </span>
      ),
    },
    {
      header: "Created Date",
      accessor: (service: Service) => (
        <span className="text-sm text-gray-600">
          {formatDate(service.createdAt)}
        </span>
      ),
    },
    {
      header: "Actions",
      cellClassName: "text-center",
      accessor: (service: Service) => (
        <div className="inline-flex justify-center w-full">
          <ServiceActionsMenu
            service={service}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate min-w-0">
          My Services
        </h1>
        <button
          type="button"
          onClick={handleAdd}
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors shadow-sm text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Add</span>
          <span className="hidden sm:inline">Service</span>
        </button>
      </div>

      {/* KPI Cards — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <KpiCard
          title="Total Services"
          value={kpis.totalServices.toLocaleString()}
          icon="shopping-cart"
          iconClassName="bg-blue-50 text-blue-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Active Services"
          value={kpis.activeCount.toLocaleString()}
          icon="user-check"
          iconClassName="bg-emerald-50 text-emerald-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Inactive Services"
          value={kpis.inactiveCount.toLocaleString()}
          icon="user-x"
          iconClassName="bg-red-50 text-red-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Categories"
          value={kpis.categoriesCount.toLocaleString()}
          icon="trending-up"
          iconClassName="bg-orange-50 text-orange-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
      </div>

      <Filters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, category, or description..."
        searchPlaceholderMobile="Search ..."
        filterOptions={STATUS_OPTIONS}
        filterValue={statusFilter}
        onFilterChange={(value) => setStatusFilter(value as "" | ServiceStatus)}
      />

      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
          <p className="text-gray-500 mb-4 text-sm sm:text-base">
            No services match your filters.
          </p>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Service
          </button>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {service.name}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5 flex items-center justify-between gap-2 min-w-0">
                      <span className="truncate">{service.category}</span>
                      <span className="shrink-0 font-medium text-gray-900">
                        {formatDuration(service.durationMinutes)}
                      </span>
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {formatPrice(service.price)}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          STATUS_CLASSES[service.status] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STATUS_LABELS[service.status] ?? service.status}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {formatDate(service.createdAt)}
                      </span>
                    </div>
                  </div>
                  <ServiceActionsMenu
                    service={service}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table<Service>
              data={filteredServices}
              columns={columns}
              searchable={false}
              filterable={false}
              itemsPerPage={10}
              onRowClick={(service) => router.push(`/services/${service.id}`)}
            />
          </div>
        </>
      )}

      <Drawer
        open={drawerOpen}
        onClose={handleFormCancel}
        title={editingService ? "Edit Service" : "Add Service"}
        width="lg"
      >
        <ServiceForm
          initialValues={editingService}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Drawer>
      <DeletePopup
        open={deleteTarget != null}
        title="Remove service"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.name}" from the list? This can be restored later.`
            : ""
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            softDeleteService(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
