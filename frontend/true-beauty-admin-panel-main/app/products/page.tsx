"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useProducts } from "@/lib/products-context";
import { PRODUCT_CATEGORIES, type Product, type ProductStatus } from "@/lib/products-data";
import type { ProductFormValues } from "@/lib/products-context";
import { Drawer } from "@/components/ui/Drawer";
import { ProductForm } from "@/components/ui/ProductForm";
import Table from "@/components/Table";
import { Filters, type FilterOption } from "@/components/ui/filters";
import { KpiCard } from "@/components/ui/kpiCard";
import DeletePopup from "@/components/ui/deletePopup";

const STOCK_LABELS: Record<string, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

const STOCK_CLASSES: Record<string, string> = {
  in_stock: "bg-green-50 text-green-700",
  low_stock: "bg-amber-50 text-amber-700",
  out_of_stock: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  draft: "Draft",
  inactive: "Inactive",
};

const STATUS_OPTIONS: FilterOption[] = [
  { value: "", label: "All statuses" },
  { value: "active", label: STATUS_LABELS.active },
  { value: "draft", label: STATUS_LABELS.draft },
  { value: "inactive", label: STATUS_LABELS.inactive },
];

const CATEGORY_OPTIONS: FilterOption[] = [
  { value: "", label: "All categories" },
  ...PRODUCT_CATEGORIES.map((category) => ({
    value: category,
    label: category,
  })),
];

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  draft: "bg-gray-100 text-gray-700",
  inactive: "bg-red-50 text-red-700",
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function ProductActionsMenu({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
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
            href={`/products/${product.id}`}
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
              onEdit(product);
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
              onDelete(product);
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

export default function ProductsPage() {
  const { products, addProduct, updateProduct, softDeleteProduct } = useProducts();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ProductStatus>("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const kpis = useMemo(() => {
    const totalProducts = products.length;
    const activeCount = products.filter((p) => p.status === "active").length;
    const draftCount = products.filter((p) => p.status === "draft").length;
    const inactiveCount = products.filter((p) => p.status === "inactive").length;
    const lowStockCount = products.filter((p) => p.stockStatus === "low_stock").length;
    const outOfStockCount = products.filter((p) => p.stockStatus === "out_of_stock").length;
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.price * p.stock,
      0
    );

    return {
      totalProducts,
      activeCount,
      draftCount,
      inactiveCount,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (categoryFilter) {
      list = list.filter((p) => p.category === categoryFilter);
    }

    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }

    return list;
  }, [products, search, categoryFilter, statusFilter]);

  const handleAdd = () => {
    setEditingProduct(null);
    setDrawerOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDrawerOpen(true);
  };

  const handleDelete = (product: Product) => {
    setDeleteTarget(product);
  };

  const handleFormSubmit = (values: ProductFormValues) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, values);
    } else {
      addProduct(values);
    }
    setDrawerOpen(false);
    setEditingProduct(null);
  };

  const handleFormCancel = () => {
    setDrawerOpen(false);
    setEditingProduct(null);
  };

  const columns = [
    {
      header: "Product name",
      accessor: (product: Product) => (
        <div className="font-medium text-gray-900">{product.name}</div>
      ),
    },
    {
      header: "Category",
      accessor: (product: Product) => (
        <span className="text-sm text-gray-700">{product.category}</span>
      ),
    },
    {
      header: "Price",
      accessor: (product: Product) => (
        <span className="font-medium text-gray-900">{formatPrice(product.price)}</span>
      ),
    },
    {
      header: "Commission",
      accessor: (product: Product) => (
        <span className="text-sm text-gray-700">
          {typeof product.commissionRate === "number"
            ? `${product.commissionRate}%`
            : "-"}
        </span>
      ),
    },
    {
      header: "Stock",
      accessor: (product: Product) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            STOCK_CLASSES[product.stockStatus] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {STOCK_LABELS[product.stockStatus] ?? product.stockStatus}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (product: Product) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            STATUS_CLASSES[product.status] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {STATUS_LABELS[product.status] ?? product.status}
        </span>
      ),
    },
    {
      header: "Actions",
      cellClassName: "text-center",
      accessor: (product: Product) => (
        <div className="inline-flex justify-center w-full">
          <ProductActionsMenu
            product={product}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header — heading left, Add button right (same row on mobile) */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate min-w-0">
          My Products
        </h1>
        <button
          type="button"
          onClick={handleAdd}
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors shadow-sm text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Add</span>
          <span className="hidden sm:inline">Product</span>
        </button>
      </div>

      {/* KPI Cards — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <KpiCard
          title="Total Products"
          value={kpis.totalProducts.toLocaleString()}
          icon="shopping-cart"
          iconClassName="bg-blue-50 text-blue-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Active Products"
          value={kpis.activeCount.toLocaleString()}
          icon="user-check"
          iconClassName="bg-emerald-50 text-emerald-600"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Draft Products"
          value={kpis.draftCount.toLocaleString()}
          icon="users"
          iconClassName="bg-gray-100 text-gray-700"
          className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
        />
        <KpiCard
          title="Out of Stock"
          value={kpis.outOfStockCount.toLocaleString()}
          icon="user-x"
          iconClassName="bg-red-50 text-red-600"
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
        onFilterChange={(value) => setStatusFilter(value as "" | ProductStatus)}
        categoryOptions={CATEGORY_OPTIONS}
        categoryValue={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
          <p className="text-gray-500 mb-4 text-sm sm:text-base">No products match your filters.</p>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Product
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: Product cards */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {product.name}
                    </p>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="text-sm text-gray-600">
                        {product.category}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            STOCK_CLASSES[product.stockStatus] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {STOCK_LABELS[product.stockStatus] ?? product.stockStatus}
                        </span>
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            STATUS_CLASSES[product.status] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {STATUS_LABELS[product.status] ?? product.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">
                        {product.stock} units
                      </span>
                    </div>
                  </div>
                  <ProductActionsMenu
                    product={product}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Product table */}
          <div className="hidden md:block">
            <Table<Product>
              data={filteredProducts}
              columns={columns}
              searchable={false}
              filterable={false}
              itemsPerPage={10}
              onRowClick={(product) => router.push(`/products/${product.id}`)}
            />
          </div>
        </>
      )}

      {/* Add/Edit drawer */}
      <Drawer
        open={drawerOpen}
        onClose={handleFormCancel}
        title={editingProduct ? "Edit Product" : "Add Product"}
        width="lg"
      >
        <ProductForm
          initialValues={editingProduct}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Drawer>
      <DeletePopup
        open={deleteTarget != null}
        title="Remove product"
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
            softDeleteProduct(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
