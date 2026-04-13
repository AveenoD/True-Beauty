"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  MOCK_PRODUCTS,
  DEFAULT_STOCK_THRESHOLD,
  generateProductId,
  type Product,
  type ProductStatus,
  type ProductStockStatus,
} from "./products-data";

export type ProductFormValues = Omit<
  Product,
  "id" | "deletedAt" | "createdAt" | "updatedAt"
> & {
  id?: string;
  imageFile?: File | null;
};

export function deriveStockStatus(
  stock: number,
  threshold: number = DEFAULT_STOCK_THRESHOLD
): ProductStockStatus {
  if (stock <= 0) return "out_of_stock";
  if (stock < threshold) return "low_stock";
  return "in_stock";
}

interface ProductsContextValue {
  products: Product[];
  addProduct: (values: ProductFormValues) => Product;
  updateProduct: (id: string, values: Partial<ProductFormValues>) => void;
  softDeleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() =>
    MOCK_PRODUCTS.map((p) => ({ ...p }))
  );

  const visibleProducts = useMemo(
    () => products.filter((p) => !p.deletedAt),
    [products]
  );

  const addProduct = useCallback((values: ProductFormValues): Product => {
    const now = new Date().toISOString();
    const threshold = values.stockThreshold ?? DEFAULT_STOCK_THRESHOLD;
    const stockStatus = values.stockStatus ?? deriveStockStatus(values.stock, threshold);
    const newProduct: Product = {
      id: generateProductId(),
      name: values.name,
      category: values.category,
      price: values.price,
      discountPrice: values.discountPrice,
      commissionRate: values.commissionRate ?? 0,
      stock: values.stock,
      stockStatus,
      status: values.status,
      image: values.image ?? null,
      images: values.images ?? (values.image ? [values.image] : []),
      description: values.description ?? "",
      isAffiliateProduct: values.isAffiliateProduct ?? false,
      sku: values.sku,
      stockThreshold: values.stockThreshold ?? DEFAULT_STOCK_THRESHOLD,
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  }, []);

  const updateProduct = useCallback(
    (id: string, values: Partial<ProductFormValues>) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const stock = values.stock ?? p.stock;
          const threshold = values.stockThreshold ?? p.stockThreshold ?? DEFAULT_STOCK_THRESHOLD;
          const stockStatus =
            values.stockStatus ?? deriveStockStatus(stock, threshold);
          return {
            ...p,
            ...values,
            stock,
            stockStatus,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  const softDeleteProduct = useCallback((id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, deletedAt: new Date().toISOString() } : p
      )
    );
  }, []);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const value: ProductsContextValue = {
    products: visibleProducts,
    addProduct,
    updateProduct,
    softDeleteProduct,
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
