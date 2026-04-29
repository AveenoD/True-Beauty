'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { api } from '../../../lib/api';
import {
  DEFAULT_COUPON_CODE,
  DEFAULT_COUPON_MIN_CART_TOTAL,
  getCouponDisplayState,
  REWARD_ORDER_MIN_PRICE,
  REWARD_DISCOUNT_PERCENT,
} from '../../../utils/coupons';
import { ArrowLeft, ShoppingBag, Star, Zap, Image as ImageIcon, MessageSquare, CheckCircle, Instagram, Youtube, Facebook, Twitter, Link2 } from 'lucide-react';
import type { Product } from '../../../utils/catalog';

// Category-wise demo videos (how to use). Paths under public/ are served from root.
const CATEGORY_VIDEOS: Record<string, Record<number, string>> = {
  skincare: {
    1: '/productsVideo/skincare/dayCream.mp4',
    2: '/productsVideo/skincare/nightCream.mp4',
    3: '/productsVideo/skincare/sunscream.mp4',
    4: '/productsVideo/skincare/faceWash.mp4',
    5: '/productsVideo/skincare/serum.mp4',
    6: '/productsVideo/skincare/Moisturizer.mp4',
    // 7 toner, 8 faceMask, 9 lipBalm – fallback to dayCream
  },
  makeup: {
    12: '/productsVideo/makeup/Foundation & Glow.mp4',
    13: '/productsVideo/makeup/Lip & Cheek Palette.mp4',
    14: '/productsVideo/makeup/Eyeshadow Palette.mp4',
  },
  jewellery: {
    10: '/productsVideo/jewellery/Classic Pearl Studs.mp4',
    11: '/productsVideo/jewellery/Rose Gold Pendant.mp4',
    32: '/productsVideo/jewellery/Statement Ring.mp4',
  },
  wellness: {
    25: '/productsVideo/wellness/Vitamins & Supplements.mp4',
    26: '/productsVideo/wellness/Hair & Skin Gummies.mp4',
    27: '/productsVideo/wellness/herbalTeas.mp4',
    28: '/productsVideo/wellness/Wellness Kit.mp4',
  },
  haircare: {
    19: '/productsVideo/haircare/HairShampoo.mp4',
    20: '/productsVideo/haircare/Hair Conditioner.mp4',
    21: '/productsVideo/haircare/hairOil.mp4',
  },
  gifting: {
    29: '/productsVideo/gifting/Skincare Gift Set.mp4',
    30: '/productsVideo/gifting/Luxury Gift Box.mp4',
    31: '/productsVideo/gifting/Personalized Gift.mp4',
  },
  fragrance: {
    22: '/productsVideo/fragrance/Perfume.mp4',
    23: '/productsVideo/fragrance/Body Mist.mp4',
    24: '/productsVideo/fragrance/Roll-On Perfume.mp4',
  },
  'bath-body': {
    15: '/productsVideo/body&bath/bodyWash.mp4',
    16: '/productsVideo/body&bath/bodyLotion.mp4',
    17: '/productsVideo/body&bath/BodyScrub.mp4',
    18: '/productsVideo/body&bath/soapBar.mp4',
  },
  offers: {
    33: '/productsVideo/offers/FlashSale-SkincareDuo.mp4',
    34: '/productsVideo/offers/Lip&Cheek.mp4',
    35: '/productsVideo/offers/Wellness-Offers.mp4',
    37: '/productsVideo/offers/ComboOffers.mp4',
  },
};

const SKINCARE_DEFAULT_VIDEO = '/productsVideo/skincare/dayCream.mp4';
const MAKEUP_DEFAULT_VIDEO = '/productsVideo/makeup/Foundation & Glow.mp4';
const JEWELLERY_DEFAULT_VIDEO = '/productsVideo/jewellery/Classic Pearl Studs.mp4';
const WELLNESS_DEFAULT_VIDEO = '/productsVideo/wellness/Vitamins & Supplements.mp4';
const HAIRCARE_DEFAULT_VIDEO = '/productsVideo/haircare/HairShampoo.mp4';
const GIFTING_DEFAULT_VIDEO = '/productsVideo/gifting/Skincare Gift Set.mp4';
const FRAGRANCE_DEFAULT_VIDEO = '/productsVideo/fragrance/Perfume.mp4';
const BATH_BODY_DEFAULT_VIDEO = '/productsVideo/body&bath/bodyWash.mp4';
const OFFERS_DEFAULT_VIDEO = '/productsVideo/offers/ComboOffers.mp4';

function getProductDemoVideo(product: Product): string | null {
  const byCategory = CATEGORY_VIDEOS[product.category];
  const exact = byCategory?.[product.id];
  if (exact) return exact;

  if (product.category === 'skincare') return SKINCARE_DEFAULT_VIDEO;
  if (product.category === 'makeup') return MAKEUP_DEFAULT_VIDEO;
  if (product.category === 'jewellery') return JEWELLERY_DEFAULT_VIDEO;
  if (product.category === 'wellness') return WELLNESS_DEFAULT_VIDEO;
  if (product.category === 'haircare') return HAIRCARE_DEFAULT_VIDEO;
  if (product.category === 'gifting') return GIFTING_DEFAULT_VIDEO;
  if (product.category === 'fragrance') return FRAGRANCE_DEFAULT_VIDEO;
  if (product.category === 'bath-body') return BATH_BODY_DEFAULT_VIDEO;
  if (product.category === 'offers') return OFFERS_DEFAULT_VIDEO;

  return null;
}

type Review = { id: string; author: string; rating: number; text: string; date: string; verified?: boolean };
const MOCK_REVIEWS: Review[] = [
  { id: '1', author: 'Priya S.', rating: 5, text: 'Lightweight and absorbs quickly. My skin feels hydrated all day. Will repurchase!', date: '2 days ago', verified: true },
  { id: '2', author: 'Anita M.', rating: 4, text: 'Good texture and no breakouts. Only wish the tube was a bit bigger for the price.', date: '1 week ago', verified: true },
  { id: '3', author: 'Riya K.', rating: 5, text: 'Perfect for combination skin. Works well under makeup. Highly recommend.', date: '2 weeks ago', verified: true },
];

type SharedPhoto = { id: string; objectUrl: string; name?: string };

type SharedSocialPost = { id: string; platform: 'instagram' | 'youtube' | 'facebook' | 'twitter'; url: string; label?: string };

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [cartVersion, setCartVersion] = useState(0);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [sharedPhotos, setSharedPhotos] = useState<SharedPhoto[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [connectedInstagram, setConnectedInstagram] = useState(false);
  const [connectedYouTube, setConnectedYouTube] = useState(false);
  const [connectedFacebook, setConnectedFacebook] = useState(false);
  const [connectedTwitter, setConnectedTwitter] = useState(false);
  const [sharedSocialPosts, setSharedSocialPosts] = useState<SharedSocialPost[]>([]);
  const [socialPostUrl, setSocialPostUrl] = useState('');
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [storeProduct, setStoreProduct] = useState<any | null>(null);
  const [storeLoading, setStoreLoading] = useState(false);

  const productIdParam = String((params as any)?.id ?? '');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!productIdParam) return;
      setStoreLoading(true);
      try {
        const { data } = await api.get<any>(`/store/products/${encodeURIComponent(productIdParam)}`);
        if (!cancelled) setStoreProduct(data?.data ?? null);
      } catch {
        if (!cancelled) setStoreProduct(null);
      } finally {
        if (!cancelled) setStoreLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productIdParam]);

  const rawImage = storeProduct?.image || storeProduct?.images?.[0] || '';
  const safeImage =
    typeof rawImage === 'string' &&
    rawImage &&
    !rawImage.startsWith('blob:') &&
    !rawImage.startsWith('file:')
      ? rawImage
      : '';

  // Map API product -> legacy UI shape expected by coupon/video/review widgets
  const product: Product | null = storeProduct
    ? ({
        id: 0,
        name: String(storeProduct.name ?? ''),
        highlight: String(storeProduct.description ?? ''),
        image: safeImage || '/images/products/dayCream.png',
        price:
          storeProduct.discountPrice != null
            ? Number(storeProduct.discountPrice)
            : Number(storeProduct.price ?? 0),
        originalPrice:
          storeProduct.discountPrice != null
            ? Number(storeProduct.price ?? storeProduct.discountPrice)
            : Number(storeProduct.price ?? 0),
        rating: 4.8,
        reviewCount: 0,
        bullets: undefined,
        category: 'skincare',
        subcategory: 'all',
      } as Product)
    : null;

  const isVerifiedBuyer = isClient && product ? (() => {
    const cart = JSON.parse(localStorage.getItem('tb_cart') || '[]');
    return cart.some((p: { id: number }) => p.id === product.id);
  })() : false;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;
    const authToken = localStorage.getItem('authToken');
    const profileData = localStorage.getItem('profile');
    const userData = localStorage.getItem('user');
    setUser(
      authToken && (profileData || userData)
        ? { ...(userData ? JSON.parse(userData) : {}), ...(profileData ? JSON.parse(profileData) : {}) }
        : null
    );
  }, [isClient]);

  const addToCart = () => {
    if (!product) return;
    const cart: { id: number; name: string; price: number; image: string; quantity: number }[] = JSON.parse(localStorage.getItem('tb_cart') || '[]');
    const existing = cart.find((p) => p.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
    localStorage.setItem('tb_cart', JSON.stringify(cart));
    setCartVersion((v) => v + 1);
  };

  const isInCart = () => {
    if (!isClient || !product) return false;
    const cart = JSON.parse(localStorage.getItem('tb_cart') || '[]');
    return cart.some((p: { id: number }) => p.id === product.id);
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isVerifiedBuyer) return;
    const objectUrl = URL.createObjectURL(file);
    setSharedPhotos((prev) => [...prev, { id: `photo-${Date.now()}`, objectUrl, name: file.name }]);
    e.target.value = '';
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerifiedBuyer || reviewRating === null || !reviewText.trim()) return;
    setReviews((prev) => [
      { id: String(Date.now()), author: 'You', rating: reviewRating, text: reviewText.trim(), date: 'Just now', verified: true },
      ...prev,
    ]);
    setReviewText('');
    setReviewRating(null);
    setSubmitted(true);
  };

  const getSocialPlatform = (url: string): 'instagram' | 'youtube' | 'facebook' | 'twitter' | null => {
    const u = url.trim().toLowerCase();
    if (u.includes('instagram.com')) return 'instagram';
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('facebook.com') || u.includes('fb.watch')) return 'facebook';
    if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
    return null;
  };

  const handleShareSocialPost = (e: React.FormEvent) => {
    e.preventDefault();
    const url = socialPostUrl.trim();
    if (!url || !isVerifiedBuyer) return;
    const platform = getSocialPlatform(url);
    if (!platform) return;
    if (platform === 'instagram' && !connectedInstagram) return;
    if (platform === 'youtube' && !connectedYouTube) return;
    if (platform === 'facebook' && !connectedFacebook) return;
    if (platform === 'twitter' && !connectedTwitter) return;
    setSharedSocialPosts((prev) => [...prev, { id: `social-${Date.now()}`, platform, url }]);
    setSocialPostUrl('');
  };

  const hasAnySocialConnected = connectedInstagram || connectedYouTube || connectedFacebook || connectedTwitter;
  const canShareSocial = isVerifiedBuyer && hasAnySocialConnected;

  if (storeLoading && !storeProduct) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <main className="pt-24 pb-16 px-4 md:px-8">
          <div className="container mx-auto text-center py-16">
            <p className="text-gray-600">Loading product…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <main className="pt-24 pb-16 px-4 md:px-8">
          <div className="container mx-auto text-center py-16">
            <p className="text-gray-600 mb-4">Product not found</p>
            <Link href="/" className="text-rose-500 font-medium hover:underline">Back to home</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const discountPercent = Math.round((1 - product.price / product.originalPrice) * 100);
  const couponState = getCouponDisplayState(product, user, { page: 'detail' });
  const demoVideoSrc = getProductDemoVideo(product);

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="pt-24 pb-16 px-4 md:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-500 transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to shop
            </Link>
          </div>
          <div className="bg-white/95 rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-6 md:p-8">
              <div className="relative aspect-square max-w-md mx-auto md:mx-0 rounded-xl overflow-hidden bg-rose-50/60">
                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-semibold px-2 py-1 rounded-md">{discountPercent}% OFF</span>
                )}
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800 mb-2">{product.name}</h1>
                <p className="text-rose-600 font-medium mb-3">{product.highlight}</p>
                {'bullets' in product && Array.isArray((product as { bullets?: string[] }).bullets) && (
                  <ul className="space-y-1.5 mb-4">
                    {((product as { bullets: string[] }).bullets).map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 mt-1.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">{product.rating} ({product.reviewCount} reviews)</span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-2xl font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-base text-gray-400 line-through font-medium">₹{product.originalPrice.toFixed(2)}</span>
                  )}
                </div>
                {couponState.show && couponState.type === 'has_coupon' && (
                  <div className="mb-6">
                    <p className="text-sm text-emerald-700 font-medium">
                      Apply coupon {DEFAULT_COUPON_CODE} &amp; get {couponState.discountDisplay} OFF (Valid on orders above ₹
                      {DEFAULT_COUPON_MIN_CART_TOTAL.toLocaleString('en-IN')})
                    </p>
                  </div>
                )}
                {couponState.show && couponState.type === 'get_coupon' && (
                  <div className="mb-6">
                    <p className="text-sm text-rose-700 font-medium">
                      {couponState.message}
                    </p>
                  </div>
                )}
                {product.price >= REWARD_ORDER_MIN_PRICE && (
                  <div className="mb-6">
                    <p className="text-sm text-amber-700 font-medium">
                      Buy this product &amp; earn a {REWARD_DISCOUNT_PERCENT}% OFF reward coupon
                    </p>
                  </div>
                )}
                <div className="mt-auto flex flex-row gap-3">
                  <button onClick={() => { addToCart(); router.push('/cart'); }} className="flex-1 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-3 px-4 rounded-lg font-medium hover:opacity-95 transition-all flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" /> Buy Now
                  </button>
                  {isInCart() ? (
                    <Link href="/cart" className="flex-1 bg-white border-2 border-rose-500 text-rose-600 py-3 px-4 rounded-lg font-medium hover:bg-rose-50 transition-colors flex items-center justify-center gap-2">
                      <ShoppingBag className="w-5 h-5" /> Go to Cart
                    </Link>
                  ) : (
                    <button onClick={addToCart} className="flex-1 bg-white border-2 border-rose-500 text-rose-600 py-3 px-4 rounded-lg font-medium hover:bg-rose-50 transition-colors flex items-center justify-center gap-2">
                      <ShoppingBag className="w-5 h-5" /> Add to Cart
                    </button>
                  )}
                </div>
                <div className="mt-6 pt-6 border-t border-rose-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Return &amp; Exchange Policy</h3>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Easy returns within 14 days of delivery for unused, unopened products.</li>
                    <li>• Exchange for a different size/variant within 14 days; subject to availability.</li>
                    <li>• Initiate from &quot;My Orders&quot; → Order Details after delivery.</li>
                    <li>• Refunds are processed to the original payment method within 5–7 business days.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Demo video, reviews & verified buyer section – same card style as above */}
          <div className="mt-6 md:mt-8 bg-white/95 rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 space-y-8">
              {/* How to use – auto-play product video + scrollable shared videos */}
              <section>
                <h2 className="text-lg font-playfair font-semibold text-gray-800 mb-3">How to use</h2>
                {demoVideoSrc && (
                  <div className="rounded-xl overflow-hidden bg-rose-50/60 aspect-video max-w-2xl mx-auto mb-4">
                    <video
                      src={demoVideoSrc}
                      className="w-full h-full object-contain"
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      title="Product demo"
                    />
                  </div>
                )}
                {sharedPhotos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Shared by buyers</p>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-rose-200 scrollbar-track-transparent">
                      {sharedPhotos.map((p) => (
                        <div key={p.id} className="flex-shrink-0 w-48 sm:w-56 rounded-xl overflow-hidden border border-rose-100 bg-rose-50/60">
                          <img src={p.objectUrl} alt={p.name || 'Shared photo'} className="w-full aspect-square object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Customer reviews list */}
              <section>
                <h2 className="text-lg font-playfair font-semibold text-gray-800 mb-4">Customer reviews</h2>
                <ul className="space-y-4">
                  {(showAllReviews ? reviews : reviews.slice(0, 3)).map((r) => (
                    <li key={r.id} className="border-b border-rose-100/80 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-4 h-4 ${star <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{r.author}</span>
                        {r.verified && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600">
                            <CheckCircle className="w-3.5 h-3.5" /> Verified
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">{r.date}</span>
                      </div>
                      <p className="text-sm text-gray-600">{r.text}</p>
                    </li>
                  ))}
                </ul>
                {reviews.length > 3 && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setShowAllReviews((v) => !v)}
                      className="text-sm font-medium text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      {showAllReviews ? 'Show less' : 'Show more…'}
                    </button>
                  </div>
                )}
              </section>

              {/* Verified buyers: upload/share video + write review */}
              <section className="pt-4 border-t border-rose-100">
                <h2 className="text-lg font-playfair font-semibold text-gray-800 mb-2">Verified buyers</h2>
                {!isVerifiedBuyer && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                    Only verified buyers can share photos or write reviews. Add this product to cart to submit.
                  </p>
                )}

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Upload photo</p>
                    <label
                      htmlFor="verified-photo-upload"
                      className={`inline-flex flex-col sm:flex-row items-start sm:items-center gap-2 ${!isVerifiedBuyer ? 'opacity-60 pointer-events-none' : ''} cursor-pointer`}
                    >
                      <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-sm font-medium hover:bg-rose-100 transition-colors">
                        <ImageIcon className="w-4 h-4" /> Choose photo
                      </span>
                      <input
                        id="verified-photo-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        disabled={!isVerifiedBuyer}
                        onChange={handleUploadPhoto}
                        className="sr-only"
                      />
                      <span className="text-xs text-gray-500">JPG, PNG, WebP or GIF.</span>
                    </label>
                  </div>

                  <form onSubmit={handleSubmitReview}>
                    <p className="text-sm font-medium text-gray-700 mb-2">Write a review</p>
                    <div className="flex gap-1 mb-2" role="group" aria-label="Rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => isVerifiedBuyer && setReviewRating(star)}
                          disabled={!isVerifiedBuyer}
                          className="p-0.5 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Star className={`w-6 h-6 transition-colors ${reviewRating !== null && star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={4}
                      disabled={!isVerifiedBuyer}
                      className="w-full px-3 py-2 rounded-lg border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-y mb-3 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    />
                    <button type="submit" disabled={!isVerifiedBuyer || reviewRating === null || !reviewText.trim()} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <MessageSquare className="w-4 h-4" /> Submit review
                    </button>
                    {submitted && <p className="mt-2 text-sm text-emerald-600">Thanks! Your review has been added.</p>}
                  </form>
                </div>
              </section>

              {/* Visit our social media for more Product Videos */}
              <section className="pt-4 border-t border-rose-100">
                <h2 className="text-lg font-playfair font-semibold text-gray-800 mb-2">Visit our social media for more Product Videos</h2>
                {!isVerifiedBuyer && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                    Only verified buyers can connect social accounts and share posts. Add this product to cart to continue.
                  </p>
                )}

                <div className="space-y-6">
                  <div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => isVerifiedBuyer && setConnectedInstagram((c) => !c)}
                        disabled={!isVerifiedBuyer}
                        title={connectedInstagram ? 'Connected' : 'Connect Instagram'}
                        className={`inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                          connectedInstagram
                            ? 'bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white hover:opacity-95'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <Instagram className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => isVerifiedBuyer && setConnectedYouTube((c) => !c)}
                        disabled={!isVerifiedBuyer}
                        title={connectedYouTube ? 'Connected' : 'Connect YouTube'}
                        className={`inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                          connectedYouTube
                            ? 'bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white hover:opacity-95'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <Youtube className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => isVerifiedBuyer && setConnectedFacebook((c) => !c)}
                        disabled={!isVerifiedBuyer}
                        title={connectedFacebook ? 'Connected' : 'Connect Facebook'}
                        className={`inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                          connectedFacebook
                            ? 'bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white hover:opacity-95'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <Facebook className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => isVerifiedBuyer && setConnectedTwitter((c) => !c)}
                        disabled={!isVerifiedBuyer}
                        title={connectedTwitter ? 'Connected' : 'Connect Twitter'}
                        className={`inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                          connectedTwitter
                            ? 'bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white hover:opacity-95'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <Twitter className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {hasAnySocialConnected && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Share a post or video from your connected account</p>
                      <form onSubmit={handleShareSocialPost} className="flex flex-wrap items-end gap-2">
                        <input
                          type="url"
                          placeholder="Paste Instagram, YouTube, Facebook or Twitter post URL"
                          value={socialPostUrl}
                          onChange={(e) => setSocialPostUrl(e.target.value)}
                          disabled={!canShareSocial}
                          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <button
                          type="submit"
                          disabled={!canShareSocial || !socialPostUrl.trim() || !getSocialPlatform(socialPostUrl)}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white text-sm font-medium hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Share
                        </button>
                      </form>
                      <p className="text-xs text-gray-500 mt-1.5">Paste a link to your Instagram, YouTube, Facebook or Twitter post about this product.</p>
                    </div>
                  )}

                  {sharedSocialPosts.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Shared from your social</p>
                      <ul className="space-y-2">
                        {sharedSocialPosts.map((post) => (
                          <li key={post.id} className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-100 text-xs font-medium">
                              {post.platform === 'instagram' && <Instagram className="w-3.5 h-3.5" />}
                              {post.platform === 'youtube' && <Youtube className="w-3.5 h-3.5" />}
                              {post.platform === 'facebook' && <Facebook className="w-3.5 h-3.5" />}
                              {post.platform === 'twitter' && <Twitter className="w-3.5 h-3.5" />}
                              {post.platform === 'instagram' && 'Instagram'}
                              {post.platform === 'youtube' && 'YouTube'}
                              {post.platform === 'facebook' && 'Facebook'}
                              {post.platform === 'twitter' && 'Twitter'}
                            </span>
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-rose-600 hover:underline truncate max-w-full"
                            >
                              <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                              {post.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
