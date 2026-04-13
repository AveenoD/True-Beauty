"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  Tag,
  IndianRupee,
  Boxes,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useProducts } from "@/lib/products-context";

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

export default function ProductDetailPage() {
  const params = useParams();
  const { getProductById } = useProducts();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const product = id ? getProductById(id) : undefined;

  if (!id || !product) {
    return (
      <div className="space-y-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Products
        </Link>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">Product not found.</p>
        </div>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : [];
  const stockClass = STOCK_CLASSES[product.stockStatus] ?? "bg-gray-100 text-gray-700";
  const statusClass = STATUS_CLASSES[product.status] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="space-y-6">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Images */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-[#fef5f7] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Images</h2>
            </div>
            <div className="p-4 space-y-4">
              {images.length > 0 ? (
                images.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl bg-[#fef5f7] overflow-hidden"
                  >
                    <Image
                      src={src}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      unoptimized
                    />
                  </div>
                ))
              ) : (
                <div className="aspect-square rounded-xl bg-[#fef5f7] flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7]">
              <h1 className="text-xl font-semibold text-gray-900">{product.name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${stockClass}`}
                >
                  {STOCK_LABELS[product.stockStatus] ?? product.stockStatus}
                </span>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}
                >
                  {STATUS_LABELS[product.status] ?? product.status}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <Tag className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </p>
                    <p className="text-gray-900 font-medium mt-0.5">{product.category}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <IndianRupee className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </p>
                    <div className="mt-0.5 space-y-1">
                      <p className="text-gray-900 font-medium">
                        {formatPrice(product.price)}
                      </p>
                      {typeof product.discountPrice === "number" &&
                        product.discountPrice > 0 && (
                          <p className="text-sm text-emerald-700 font-medium">
                            Discounted: {formatPrice(product.discountPrice)}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <Boxes className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </p>
                    <p className="text-gray-900 font-medium mt-0.5">{product.stock} units</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <Package className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </p>
                    <p className="text-gray-900 font-medium mt-0.5">
                      {STATUS_LABELS[product.status] ?? product.status}
                    </p>
                  </div>
                </div>
              </div>

              {product.description && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Description</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
