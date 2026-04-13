'use client';

import { useState, useEffect, useRef } from 'react';
import { Heart, ShoppingBag, Star, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { products as catalogProducts } from '../../../utils/catalog';
import type { Product } from '../../../utils/catalog';

export default function WishlistPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    const profileData = localStorage.getItem('profile');
    setIsLoggedIn(!!authToken);
    if (authToken && userData) {
      const parsedUser = JSON.parse(userData);
      const parsedProfile = profileData ? JSON.parse(profileData) : null;
      setUser({ ...parsedUser, ...parsedProfile });
      setIsAffiliate(!!localStorage.getItem('isAffiliate') || !!parsedProfile?.isAffiliate);
    }
  }, []);

  useEffect(() => {
    const cartCount = getCartCount();
    setCartCount(cartCount);
    
    const wishlistData = getWishlist();
    setWishlist(wishlistData);
  }, []);

  const getCartCount = () => {
    if (typeof window === 'undefined') return 0;
    try {
      const cart = JSON.parse(localStorage.getItem('tb_cart') || '[]');
      return cart.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0);
    } catch { return 0; }
  };

  const getWishlist = (): Product[] => {
    if (typeof window === 'undefined') return [];
    try {
      const ids = JSON.parse(localStorage.getItem('tb_wishlist') || '[]') as number[];
      return ids
        .map((id) => catalogProducts.find((p) => p.id === id))
        .filter((p): p is Product => p != null);
    } catch { return []; }
  };

  const removeFromWishlist = (productId: number) => {
    if (typeof window === 'undefined') return;
    try {
      const ids = (JSON.parse(localStorage.getItem('tb_wishlist') || '[]') as number[]).filter(
        (id) => id !== productId
      );
      localStorage.setItem('tb_wishlist', JSON.stringify(ids));
      setWishlist(
        ids
          .map((id) => catalogProducts.find((p) => p.id === id))
          .filter((p): p is Product => p != null)
      );
    } catch { }
  };

  const isProductInCart = (productId: number) => {
    if (!isClient) return false;
    try {
      const cart = JSON.parse(localStorage.getItem('tb_cart') || '[]');
      return cart.some((item: { id: number }) => item.id === productId);
    } catch {
      return false;
    }
  };

  const addToCart = (product: Product) => {
    if (typeof window === 'undefined') return;
    try {
      const cart: { id: number; name: string; price: number; image: string; quantity: number }[] =
        JSON.parse(localStorage.getItem('tb_cart') || '[]');
      const existing = cart.find((item) => item.id === product.id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        });
      }
      localStorage.setItem('tb_cart', JSON.stringify(cart));
      setCartCount(getCartCount());
    } catch { }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/30 via-white to-purple-50/30">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="md:hidden mb-4">
            <Link href="/" className="inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Back to home</span>
            </Link>
          </div>
          <div className="hidden md:block lg:hidden mb-4">
            <Link href="/" className="inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Back to home</span>
            </Link>
          </div>
          <div className="hidden lg:block mb-4">
            <Link href="/" className="inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Back to home</span>
            </Link>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800">My Wishlist</h1>
            <p className="text-gray-600 mt-1">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>

          {wishlist.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-rose-100 rounded-full flex items-center justify-center">
                <Heart className="w-12 h-12 text-rose-400" />
              </div>
              <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Start adding products you love to your wishlist</p>
              <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white px-6 py-3 rounded-lg font-medium hover:opacity-95 transition-colors">
                <ShoppingBag className="w-5 h-5" />
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {wishlist.map((product) => {
                const discountPercent = Math.round((1 - product.price / product.originalPrice) * 100);
                return (
                  <article key={product.id} className="product-card group bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden border border-rose-100/80 flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:shadow-rose-100/40 hover:border-rose-200/80">
                    <div className="relative h-40 sm:h-44 shrink-0 overflow-hidden bg-rose-50/60">
                      <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out" />
                      {discountPercent > 0 && (
                        <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {discountPercent}% OFF
                        </span>
                      )}
                      <button 
                        onClick={() => removeFromWishlist(product.id)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors duration-300 shadow-sm"
                        aria-label="Remove from wishlist"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-col flex-1 p-3.5 md:p-4 min-h-0">
                      <h3 className="font-playfair font-semibold text-gray-800 text-base leading-tight line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-rose-600 text-xs font-medium mt-0.5 line-clamp-1">{product.highlight}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-3 h-3 ${star <= Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-500">{product.rating}</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-lg font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-gray-400 line-through font-medium">
                            ₹{product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex gap-1.5">
                        {isProductInCart(product.id) ? (
                          <Link 
                            href="/cart" 
                            className="flex-1 bg-rose-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-rose-700 transition-colors duration-300 flex items-center justify-center gap-1.5"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />Go to Cart
                          </Link>
                        ) : (
                          <button 
                            onClick={() => addToCart(product)}
                            className="flex-1 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-2 px-3 rounded-lg text-xs font-medium hover:opacity-95 transition-colors duration-300 flex items-center justify-center gap-1.5"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function User({ className }: { className?: string }) { 
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>; 
}
