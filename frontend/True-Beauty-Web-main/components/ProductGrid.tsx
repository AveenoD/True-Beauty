'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { products, getProductsByCategory } from '../utils/catalog';
import { getCategoryNameBySlug } from '../utils/categories';
import type { Product } from '../utils/catalog';
import Card from './ui/Card';

const MOBILE_BREAKPOINT = 768;

type ProductGridProps = {
  /** When provided, filter by category (and optional subcategory). When omitted, show all products or use `products` prop. */
  categorySlug?: string;
  subcategorySlug?: string;
  /** Pre-filtered products (e.g. from category page). When provided, used as-is and categorySlug is ignored. */
  products?: Product[];
  /** Optional title above the grid. When categorySlug is set and title not provided, shows "Showing [Category] Products". */
  title?: string;
  /** Optional subtitle. */
  subtitle?: string;
  /** When true, hides the internal title/subtitle header block. */
  hideHeader?: boolean;
  /** Max items to show (e.g. 8 for homepage). When set, list is sliced. */
  limit?: number;
  /** When true and limit is set, show "View All Products" link below the grid. */
  showViewAll?: boolean;
  /** Desktop grid columns (lg breakpoint). Use 4 for homepage 2-row layout. */
  columnsLg?: 3 | 4;
};

const EMPTY_MESSAGE = 'No products available in this category yet.';

export default function ProductGrid({
  categorySlug,
  subcategorySlug,
  products: productsProp,
  title: titleProp,
  subtitle,
  hideHeader,
  limit,
  showViewAll = false,
  columnsLg = 3,
}: ProductGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFromUrl = categorySlug ?? searchParams.get('category') ?? '';
  const subcategoryFromUrl = subcategorySlug ?? searchParams.get('subcategory') ?? '';

  const addToCartAndGo = (product: Product) => {
    const cart: { id: number; name: string; price: number; image: string; quantity: number }[] =
      typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tb_cart') || '[]') : [];
    const existing = cart.find((p) => p.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
    if (typeof window !== 'undefined') localStorage.setItem('tb_cart', JSON.stringify(cart));
    router.push('/cart');
  };

  const allProducts = useMemo(() => {
    let list: Product[];
    if (productsProp) list = productsProp;
    else if (categoryFromUrl)
      list = getProductsByCategory(categoryFromUrl, subcategoryFromUrl || undefined);
    else list = products;
    return list;
  }, [productsProp, categoryFromUrl, subcategoryFromUrl]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handle = () => setIsMobile(mql.matches);
    handle();
    mql.addEventListener('change', handle);
    return () => mql.removeEventListener('change', handle);
  }, []);

  /** On mobile show 4 products when limit is set; on desktop use limit as-is. */
  const effectiveLimit = useMemo(() => {
    if (limit == null || limit <= 0) return allProducts.length;
    return isMobile ? Math.min(4, limit) : limit;
  }, [limit, allProducts.length, isMobile]);

  const visibleProducts = useMemo(
    () => allProducts.slice(0, Math.min(effectiveLimit, allProducts.length)),
    [allProducts, effectiveLimit]
  );

  useEffect(() => {
    if (!categoryFromUrl || typeof document === 'undefined') return;
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [categoryFromUrl]);

  const title = titleProp ?? (categoryFromUrl ? `Showing ${getCategoryNameBySlug(categoryFromUrl)} Products` : 'Shop Our Collection');
  const showSubtitle = subtitle && !categoryFromUrl;
  const showEmptyState = allProducts.length === 0;

  /** On mobile show "View All" when more than 4 products; on desktop when more than 6. */
  const showViewAllSection = limit != null && limit > 0 && (isMobile ? allProducts.length > 4 : allProducts.length > 6);

  return (
    <div className="w-full">
      {!hideHeader && (title || showSubtitle) && (
        <div className="text-center mb-8 md:mb-10">
          {title && (
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-gray-800 mb-2">
              {title}
            </h2>
          )}
          {showSubtitle && (
            <p className="text-gray-600 max-w-xl mx-auto text-sm md:text-base">{subtitle}</p>
          )}
        </div>
      )}

      {showEmptyState ? (
        <div className="text-center py-12 md:py-16 px-4 rounded-2xl bg-white/50 border border-rose-100/80">
          <p className="text-gray-600 text-base md:text-lg mb-4">{EMPTY_MESSAGE}</p>
          {categoryFromUrl && (
            <Link
              href="/"
              className="inline-flex items-center text-rose-600 hover:text-rose-700 font-medium text-sm"
            >
              ← Back to all products
            </Link>
          )}
        </div>
      ) : (
        <>
          <div
            className={`grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 ${
              columnsLg === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
            }`}
          >
            {visibleProducts.map((product) => (
              <Card
                key={product.id}
                variant="product"
                item={product}
                onBuyNow={addToCartAndGo}
              />
            ))}
          </div>
          {showViewAllSection && showViewAll && limit != null && limit > 0 && (
            <div className="mt-5 md:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white px-6 py-2.5 text-sm font-medium hover:opacity-95 transition-all duration-200"
              >
                View All Products
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
