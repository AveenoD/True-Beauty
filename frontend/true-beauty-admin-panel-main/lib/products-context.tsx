"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { api, ApiSuccess } from "./api";
import { useAdminAuth } from "./admin-auth-context";

export type ProductStockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type ProductStatus = "active" | "draft" | "inactive";

export function deriveStockStatus(stock: number): ProductStockStatus {
  if (stock <= 0) return "out_of_stock";
  return "in_stock";
}

export interface Product {
  id?: string;
  name: string;
  categoryId?: string | null;
  categoryName?: string | null;
  price: number;
  discountPrice?: number | null;
  stock: number;
  stockStatus: string;
  status: string;
  image?: string | null;
  images?: string[];
  sku?: string | null;
  description?: string | null;
  isAffiliateProduct: boolean;
  commissionRate?: number | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProductFormValues = Omit<Product, "deletedAt" | "createdAt" | "updatedAt" | "stockStatus"> & {
  id?: string;
  stockThreshold?: number | null;
  stockLocation?: string | null;
  supplier?: string | null;
  inventoryNotes?: string | null;
  // Client-only fields (not persisted directly). Used for uploads.
  imageFile?: File | null;
  imageFiles?: File[];
};

interface ProductsContextValue {
  products: Product[];
  loading: boolean;
  error: string | null;
  /** Modal copy for plan / subscription blocks (403 from API). */
  planGateMessage: string | null;
  dismissPlanGate: () => void;
  fetchProducts: () => Promise<void>;
  addProduct: (values: ProductFormValues) => Promise<void>;
  updateProduct: (id: string, values: Partial<ProductFormValues>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

function isSubscriptionPlanGate(err: unknown): boolean {
  const ax = err as { response?: { status?: number; data?: { message?: string } } };
  if (ax.response?.status !== 403) return false;
  const msg = (ax.response?.data?.message ?? "").toLowerCase();
  return (
    msg.includes("subscription") ||
    msg.includes("plan") ||
    msg.includes("renew") ||
    msg.includes("upgrade")
  );
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planGateMessage, setPlanGateMessage] = useState<string | null>(null);

  const dismissPlanGate = useCallback(() => setPlanGateMessage(null), []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ApiSuccess<{ data: Product[] }>>("/admin/products?limit=100");
      setProducts(data.data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = useCallback(async (values: ProductFormValues) => {
    setError(null);
    setPlanGateMessage(null);
    const uploadFiles = async (files: File[]) => {
      const urls: string[] = [];
      for (const file of files) {
        const form = new FormData();
        // Backend expects field name "image" (multer middleware).
        form.append("image", file);
        const res = await api.post<ApiSuccess<{ url: string }>>(
          "/upload/admin/products/image",
          form,
          {
            transformRequest: [
              (data, headers) => {
                if (typeof FormData !== "undefined" && data instanceof FormData) {
                  delete (headers as Record<string, unknown>)["Content-Type"];
                }
                return data as FormData;
              },
            ],
          }
        );
        const url = res.data?.data?.url;
        if (url) urls.push(url);
      }
      return urls;
    };

    const files =
      (values.imageFiles && values.imageFiles.length > 0
        ? values.imageFiles
        : values.imageFile
          ? [values.imageFile]
          : []) as File[];

    const uploadedUrls = files.length > 0 ? await uploadFiles(files.slice(0, 5)) : [];

    const payload = {
      name: values.name,
      categoryName: values.categoryName || values.name?.split(" ")[0] || "General",
      price: values.price,
      discountPrice: values.discountPrice ?? undefined,
      stock: values.stock,
      description: values.description ?? undefined,
      // Prefer uploaded Cloudinary URLs if any files were selected.
      image: (uploadedUrls[0] ?? values.image) ?? undefined,
      images: uploadedUrls.length > 0 ? uploadedUrls : (values.images ?? []),
      sku: values.sku ?? undefined,
      status: values.status ?? "active",
      isAffiliateProduct: values.isAffiliateProduct ?? false,
      commissionRate: values.isAffiliateProduct ? (values.commissionRate ?? 0) : undefined,
    };
    try {
      const { data } = await api.post<ApiSuccess<Product>>("/admin/products", payload);
      const created = data.data;
      if (created) {
        setProducts((prev) => [created, ...prev]);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to create product";
      if (isSubscriptionPlanGate(err)) {
        setPlanGateMessage(message);
      } else {
        setError(message);
      }
      throw err;
    }
  }, []);

  const updateProduct = useCallback(async (id: string, values: Partial<ProductFormValues>) => {
    setError(null);
    const payload: Record<string, unknown> = {};
    if (values.name !== undefined) payload.name = values.name;
    if (values.categoryName !== undefined) payload.categoryName = values.categoryName;
    if (values.categoryId !== undefined) payload.categoryId = values.categoryId;
    if (values.price !== undefined) payload.price = values.price;
    if (values.discountPrice !== undefined) payload.discountPrice = values.discountPrice;
    if (values.stock !== undefined) payload.stock = values.stock;
    if (values.description !== undefined) payload.description = values.description;
    if (values.image !== undefined) payload.image = values.image;
    if (values.images !== undefined) payload.images = values.images;
    if (values.sku !== undefined) payload.sku = values.sku;
    if (values.status !== undefined) payload.status = values.status;
    if (values.isAffiliateProduct !== undefined) payload.isAffiliateProduct = values.isAffiliateProduct;
    if (values.commissionRate !== undefined) payload.commissionRate = values.commissionRate;

    try {
      const { data } = await api.put<ApiSuccess<Product>>(`/admin/products/${id}`, payload);
      const updated = data.data;
      if (updated) {
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to update product";
      setError(message);
      throw err;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setError(null);
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to delete product";
      setError(message);
      throw err;
    }
  }, []);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  // Wait for AdminAuthProvider to finish auth init before fetching.
  // This is the correct solution — ProductsProvider explicitly waits for
  // AdminAuthProvider's isReady signal instead of relying on module variable timing.
  const { isReady: authReady, isLoggedIn } = useAdminAuth();

  useEffect(() => {
    if (!authReady || !isLoggedIn) return;
    fetchProducts();
  }, [authReady, isLoggedIn, fetchProducts]);

  const value: ProductsContextValue = {
    products,
    loading,
    error,
    planGateMessage,
    dismissPlanGate,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
  };

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
