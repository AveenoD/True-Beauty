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
  Video,
  Pencil,
  Trash2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useProducts, type ProductFormValues } from "@/lib/products-context";
import { Drawer } from "@/components/ui/Drawer";
import { ProductForm } from "@/components/ui/ProductForm";
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

function toYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase();
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const embed = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embed?.[1]) return `https://www.youtube.com/embed/${embed[1]}`;
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
    }
  } catch {
    // ignore
  }
  return null;
}

function isLikelyDirectVideoUrl(src: string): boolean {
  const s = src.trim().toLowerCase();
  if (s.startsWith("blob:") || s.startsWith("file:")) return false;
  if (s.includes("/video/upload")) return true; // Cloudinary video resource
  return /\.(mp4|webm|ogg)(\?|$)/i.test(s);
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getProductById, updateProduct, deleteProduct } = useProducts();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const product = id ? getProductById(id) : undefined;
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

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
  const safeImages = images
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter(Boolean);

  const howToUseText =
    typeof product.howToUseText === "string" ? product.howToUseText.trim() : "";
  const howToUseVideo =
    typeof product.howToUseVideo === "string" ? product.howToUseVideo.trim() : "";
  const youtubeEmbed = howToUseVideo ? toYoutubeEmbedUrl(howToUseVideo) : null;
  const showNativeVideo =
    Boolean(howToUseVideo) && !youtubeEmbed && isLikelyDirectVideoUrl(howToUseVideo);
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
              {safeImages.length > 0 ? (
                safeImages.map((src, i) => (
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
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold text-gray-900 truncate">{product.name}</h1>
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

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-[#fef5f7] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
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
                    <p className="text-gray-900 font-medium mt-0.5">
                      {product.categoryName ?? "—"}
                    </p>
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

              {(howToUseText || howToUseVideo) && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="w-5 h-5 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900">How to use</h3>
                  </div>

                  {howToUseText && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Instructions (text)
                      </p>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {howToUseText}
                      </p>
                    </div>
                  )}

                  {howToUseVideo && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Video URL
                      </p>
                      <div className="rounded-xl overflow-hidden border border-gray-100 bg-[#fef5f7] max-w-md">
                        {youtubeEmbed ? (
                          <div className="relative aspect-video">
                            <iframe
                              src={youtubeEmbed}
                              className="absolute inset-0 h-full w-full"
                              title="How to use video"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          </div>
                        ) : showNativeVideo ? (
                          <div className="relative aspect-video">
                            <video
                              src={howToUseVideo}
                              className="absolute inset-0 h-full w-full object-contain"
                              controls
                              playsInline
                              preload="metadata"
                            />
                          </div>
                        ) : (
                          <div className="p-4">
                            <a
                              href={howToUseVideo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#D96A86] hover:underline break-all"
                            >
                              {howToUseVideo}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit drawer */}
      <Drawer open={editOpen} onClose={() => setEditOpen(false)} title="Edit Product" width="lg">
        <ProductForm
          initialValues={product}
          onCancel={() => setEditOpen(false)}
          onSubmit={async (values: ProductFormValues) => {
            if (!id) return;
            await updateProduct(id, values);
            setEditOpen(false);
          }}
        />
      </Drawer>

      {/* Delete confirm */}
      <DeletePopup
        open={deleteOpen}
        title="Remove product"
        description={`Remove \"${product.name}\" from the list? This cannot be undone.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          if (!id) return;
          await deleteProduct(id);
          setDeleteOpen(false);
          router.push("/products");
        }}
      />
    </div>
  );
}
