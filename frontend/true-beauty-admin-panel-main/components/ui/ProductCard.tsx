"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/lib/products-data";

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

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const stockClass = STOCK_CLASSES[product.stockStatus] ?? "bg-gray-100 text-gray-700";
  const statusClass = STATUS_CLASSES[product.status] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Image */}
      <div className="h-44 sm:h-48 bg-[#fef5f7] relative overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl font-light">
            —
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate pr-8" title={product.name}>
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">{product.category}</p>
        <p className="text-base font-semibold text-gray-900 mt-2">
          {formatPrice(product.price)}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
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

      {/* 3-dot menu */}
      <div className="absolute top-3 right-3" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="p-2 rounded-lg bg-white/90 shadow-sm border border-gray-100 hover:bg-[#fef5f7] transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
            <Link
              href={`/products/${product.id}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors"
            >
              <Eye className="w-4 h-4" />
              View
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit(product);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete(product);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
