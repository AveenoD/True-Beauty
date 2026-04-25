'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Eye, Zap, Heart } from 'lucide-react';
import type { Product as DummyProduct, BeautyService } from '../../utils/catalog';
import {
  DEFAULT_COUPON_CODE,
  getCouponDisplayState,
} from '../../utils/coupons';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

const cardBaseClass =
  'group bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden border border-rose-100/80 flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:shadow-rose-100/40 hover:border-rose-200/80';

type StoreProduct = {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  image?: string | null;
  stock?: number;
  stockStatus?: string | null;
  categoryName?: string | null;
  categoryId?: string | null;
  description?: string | null;
};

type ProductLike = (DummyProduct & { id: number }) | StoreProduct;

type ProductCardProps = {
  variant: 'product';
  item: ProductLike;
  onBuyNow: (product: any) => void;
};

type ServiceCardProps = {
  variant: 'service';
  item: BeautyService;
  onBook: () => void;
};

export type CardProps = ProductCardProps | ServiceCardProps;

export function Card(props: CardProps) {
  const productId = props.variant === 'product' ? props.item.id : null;
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [couponState, setCouponState] = useState<ReturnType<typeof getCouponDisplayState>>({ show: false });
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (productId == null || typeof window === 'undefined') return;
    // Warm-check wishlist state from API (tenant-safe)
    (async () => {
      try {
        if (!isLoggedIn) {
          setIsInWishlist(false);
          setWishlistItemId(null);
          return;
        }
        const { data } = await api.get<any>('/wishlist');
        const items = data?.data ?? [];
        const match = items.find((it: any) => it?.product?.id === productId);
        setIsInWishlist(!!match);
        setWishlistItemId(match?.id ?? null);
      } catch {
        // ignore
      }
    })();
  }, [productId, isLoggedIn]);

  useEffect(() => {
    if (props.variant !== 'product' || typeof window === 'undefined') return;
    // Coupon display logic currently depends on dummy catalog fields like `originalPrice`/`category`.
    // For API-backed products, we skip coupon badge for now.
    const product = props.item as any;
    if (typeof product?.originalPrice !== 'number' || typeof product?.category !== 'string') {
      setCouponState({ show: false });
      return;
    }
    const authToken = localStorage.getItem('authToken');
    const profileData = localStorage.getItem('profile');
    const userData = localStorage.getItem('user');
    const user = authToken && (profileData || userData)
      ? { ...(userData ? JSON.parse(userData) : {}), ...(profileData ? JSON.parse(profileData) : {}) }
      : null;
    setCouponState(getCouponDisplayState(product as DummyProduct, user, { page: 'card' }));
  }, [props.variant, props.item]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId) return;
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (wishlistBusy) return;
    setWishlistBusy(true);
    try {
      if (!isInWishlist) {
        const { data } = await api.post<any>('/wishlist', { productId });
        setIsInWishlist(true);
        setWishlistItemId(data?.data?.id ?? null);
      } else if (wishlistItemId) {
        await api.delete(`/wishlist/${wishlistItemId}`);
        setIsInWishlist(false);
        setWishlistItemId(null);
      }
    } catch {
      // ignore for now
    } finally {
      setWishlistBusy(false);
    }
  };

  if (props.variant === 'product') {
    const { item: product, onBuyNow } = props;
    const rawImage = (product as any).image || '';
    const safeImage =
      typeof rawImage === 'string' &&
      rawImage &&
      !rawImage.startsWith('blob:') &&
      !rawImage.startsWith('file:')
        ? rawImage
        : '';
    const showCouponBadge = couponState.show && couponState.type === 'has_coupon';
    const displayPrice =
      (product as any).discountPrice != null
        ? (product as any).discountPrice
        : (product as any).price;
    const originalPrice =
      (product as any).discountPrice != null
        ? (product as any).price
        : (product as any).originalPrice ?? (product as any).price;

    return (
      <article className={cardBaseClass}>
        <Link
          href={`/product/${product.id}`}
          className="relative block aspect-square sm:aspect-[4/3] overflow-hidden bg-rose-50/60"
        >
          <img
            src={safeImage}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
          />
          <button
            type="button"
            onClick={(e) => toggleWishlist(e)}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 shadow-md border border-rose-100 transition-opacity duration-200 hover:bg-rose-50 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-400 ${
              isInWishlist ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isInWishlist ? 'fill-rose-500 text-rose-500' : 'text-gray-500 hover:text-rose-500'
              }`}
            />
          </button>
        </Link>
        <div className="flex flex-col flex-1 p-3 sm:p-4 min-h-0 min-w-0 overflow-hidden">
          <h3 className="font-playfair font-semibold text-gray-800 text-sm sm:text-base md:text-lg leading-snug line-clamp-2">
            {product.name}
          </h3>
          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-base sm:text-lg font-bold text-gray-900">
                ₹{Number(displayPrice).toLocaleString('en-IN')}
              </span>
              {Number(originalPrice) > Number(displayPrice) && (
                <span className="text-xs sm:text-sm text-gray-400 line-through">
                  ₹{Number(originalPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {showCouponBadge && couponState.type === 'has_coupon' && (
              <div className="hidden sm:flex flex-col items-end">
                <div className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5">
                  <span className="mr-1">🎟</span>
                  {couponState.discountDisplay} OFF
                </div>
                <p className="mt-0.5 text-[10px] text-emerald-700">
                  Code: <span className="font-semibold">{DEFAULT_COUPON_CODE}</span>
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:items-stretch sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onBuyNow(product)}
              className="w-full sm:flex-1 min-w-0 h-10 sm:h-11 px-3 md:px-4 inline-flex items-center justify-center gap-1.5 md:gap-2 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white rounded-lg text-xs sm:text-sm md:text-base font-medium hover:opacity-95 transition-all duration-300 shrink-0 whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              Buy Now
            </button>
            <Link
              href={`/product/${product.id}`}
              className="hidden sm:inline-flex sm:flex-1 min-w-0 h-11 px-3 md:px-4 items-center justify-center gap-1.5 md:gap-2 bg-blue-500 text-white rounded-lg text-xs sm:text-sm md:text-base font-medium hover:bg-blue-600 transition-colors duration-300 shrink-0 whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              View Details
            </Link>
          </div>
          <Link
            href={`/product/${product.id}`}
            className="mt-1 inline-block text-[11px] text-rose-600 hover:text-rose-700 hover:underline sm:hidden"
          >
            View details
          </Link>
        </div>
      </article>
    );
  }

  const { item: service, onBook } = props;
  return (
    <article className={cardBaseClass}>
      <div className="relative h-40 sm:h-48 overflow-hidden bg-rose-50/60">
        <img
          src={service.image}
          alt={service.serviceName}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out"
        />
      </div>
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <div className="mb-2">
          <p className="text-xs uppercase tracking-wide text-rose-500 font-semibold">
            Beauty Parlour Service
          </p>
          <h3 className="font-playfair font-semibold text-gray-800 text-base sm:text-lg leading-tight line-clamp-2">
            {service.parlourName}
          </h3>
        </div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 min-w-0 flex-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
            <span className="line-clamp-1">{service.location}</span>
          </p>
          <span className="text-xs text-gray-500 uppercase tracking-wide whitespace-nowrap flex-shrink-0">
            Starting from
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-sm text-gray-700 font-medium line-clamp-2 min-w-0 flex-1">
            {service.serviceName}
          </p>
          <span className="text-lg font-bold text-gray-900 whitespace-nowrap flex-shrink-0">
            ₹{service.startingPrice.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-row flex-nowrap items-stretch gap-2 md:gap-3 min-w-0">
            <button
              type="button"
              onClick={onBook}
              className="flex-1 min-w-0 md:min-w-[110px] min-h-[40px] md:min-h-[44px] px-3 sm:px-4 py-2 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white text-xs sm:text-sm font-medium hover:opacity-95 transition-all duration-200 shrink-0 whitespace-nowrap"
            >
              Book Appointment
            </button>
            <Link
              href={`/appointment/appointmentDetails?id=${service.id}`}
              className="flex-1 min-w-0 md:min-w-[110px] min-h-[40px] md:min-h-[44px] px-3 sm:px-4 py-2 inline-flex items-center justify-center rounded-lg bg-blue-500 text-white text-xs sm:text-sm font-medium hover:bg-blue-600 transition-colors duration-200 shrink-0 whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5 flex-shrink-0 mr-1.5" />
              View Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default Card;
