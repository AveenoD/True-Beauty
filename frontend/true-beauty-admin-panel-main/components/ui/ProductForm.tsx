"use client";

import React, { useEffect } from "react";
import { PRODUCT_CATEGORIES, type Product } from "@/lib/products-data";
import type { ProductFormValues } from "@/lib/products-context";

const STATUS_OPTIONS: { value: Product["status"]; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "inactive", label: "Inactive" },
];

const CATEGORY_OPTIONS = PRODUCT_CATEGORIES;

interface ProductFormProps {
  initialValues?: Product | null;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

const emptyForm: ProductFormValues = {
  name: "",
  category: "",
  price: 0,
  discountPrice: 0,
  commissionRate: 0,
  stock: 0,
  stockStatus: "in_stock",
  status: "active",
  image: "",
  images: [],
  description: "",
  imageFile: null,
  isAffiliateProduct: false,
};

export function ProductForm({
  initialValues,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [values, setValues] = React.useState<ProductFormValues>(emptyForm);

  useEffect(() => {
    if (initialValues) {
      setValues({
        name: initialValues.name,
        category: initialValues.category,
        price: initialValues.price,
        discountPrice: initialValues.discountPrice ?? 0,
        commissionRate: initialValues.commissionRate ?? 0,
        stock: initialValues.stock,
        stockStatus: initialValues.stockStatus,
        status: initialValues.status,
        image: initialValues.image ?? "",
        images: initialValues.images ?? (initialValues.image ? [initialValues.image] : []),
        description: initialValues.description ?? "",
        imageFile: null,
        isAffiliateProduct: initialValues.isAffiliateProduct ?? false,
      });
    } else {
      setValues(emptyForm);
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return;
    onSubmit({
      ...values,
      name: values.name.trim(),
      category: values.category.trim() || "Uncategorized",
      price: values.price || 0,
      discountPrice: values.discountPrice || 0,
      stock: values.stock ?? 0,
      commissionRate: values.isAffiliateProduct
        ? typeof values.commissionRate === "number" && !Number.isNaN(values.commissionRate)
          ? Math.max(0, values.commissionRate)
          : 0
        : 0,
      description: values.description?.trim() ?? "",
      isAffiliateProduct: values.isAffiliateProduct ?? false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
          placeholder="e.g. True Beauty Night Cream"
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          required
          value={values.category}
          onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all bg-white"
        >
          <option value="" disabled>
            Select category
          </option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-xl border border-gray-100 bg-[#fef5f7] p-4">
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Add this Affiliate product
        </span>
        <div className="flex items-center gap-4 mt-1">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="isAffiliateProduct"
              checked={values.isAffiliateProduct === true}
              onChange={() =>
                setValues((v) => ({
                  ...v,
                  isAffiliateProduct: true,
                }))
              }
              className="h-4 w-4 text-[#D96A86] border-gray-300 focus:ring-[#f8c6d0]"
            />
            <span>Yes</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="isAffiliateProduct"
              checked={values.isAffiliateProduct === false}
              onChange={() =>
                setValues((v) => ({
                  ...v,
                  isAffiliateProduct: false,
                  commissionRate: 0,
                }))
              }
              className="h-4 w-4 text-[#D96A86] border-gray-300 focus:ring-[#f8c6d0]"
            />
            <span>No</span>
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          If you select &quot;Yes&quot;, this product will be available in the affiliate product list
          on the user side.
        </p>
      </div>
      {values.isAffiliateProduct && (
        <div>
          <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-1">
            Commission Rate (%)
          </label>
          <input
            id="commissionRate"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={
              typeof values.commissionRate === "number" && values.commissionRate !== 0
                ? values.commissionRate
                : ""
            }
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                commissionRate: e.target.value === "" ? 0 : Number(e.target.value) || 0,
              }))
            }
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
            placeholder="e.g. 10"
          />
          <p className="mt-1 text-xs text-gray-500">
            Percentage of the product price that will be given as commission.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            id="price"
            type="number"
            min={0}
            step={0.01}
            required
            value={values.price === 0 ? "" : values.price}
            onChange={(e) => setValues((v) => ({ ...v, price: Number(e.target.value) || 0 }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
          />
        </div>
        <div>
          <label htmlFor="discountPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Discount Price (₹)
          </label>
          <input
            id="discountPrice"
            type="number"
            min={0}
            step={0.01}
            value={values.discountPrice === 0 ? "" : values.discountPrice}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                discountPrice: Number(e.target.value) || 0,
              }))
            }
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
          />
        </div>
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
            Stock <span className="text-red-500">*</span>
          </label>
          <input
            id="stock"
            type="number"
            min={0}
            step={1}
            required
            value={values.stock === 0 ? "" : values.stock}
            onChange={(e) => setValues((v) => ({ ...v, stock: Math.max(0, Math.floor(Number(e.target.value))) }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          value={values.status}
          onChange={(e) =>
            setValues((v) => ({ ...v, status: e.target.value as Product["status"] }))
          }
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all bg-white"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
          Product Image
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);

            if (files.length === 0) {
              setValues((v) => ({
                ...v,
                imageFile: null,
                image: "",
                images: [],
              }));
              return;
            }

            const limitedFiles = files.slice(0, 5);
            const imageUrls = limitedFiles.map((file) => URL.createObjectURL(file));
            const primaryFile = limitedFiles[0] ?? null;

            setValues((v) => ({
              ...v,
              imageFile: primaryFile,
              image: imageUrls[0] ?? null,
              images: imageUrls,
            }));
          }}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#fef5f7] file:text-[#D96A86] hover:file:bg-[#f8e0e6]"
        />
        <p className="mt-1 text-xs text-gray-500">
          Upload up to 5 product images (JPEG, PNG, etc.). This replaces the URL input.
        </p>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={values.description ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all resize-none"
          placeholder="Product description..."
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors"
        >
          {initialValues ? "Update Product" : "Add Product"}
        </button>
      </div>
    </form>
  );
}
