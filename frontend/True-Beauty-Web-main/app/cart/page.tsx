'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { ShoppingBag, Trash2, Minus, Plus, ArrowLeft, Tag } from 'lucide-react';
import { getProductById } from '../../utils/catalog';
import { validateCoupon, getAvailableCouponsForUser, DEFAULT_COUPON_CODE, type Coupon, type MinimalCartItem } from '../../utils/coupons';

type CartItem = { id: number; name: string; price: number; image: string; quantity: number };

type AppliedCouponState = {
  code: string;
  discount: number;
};

const COUPON_STORAGE_KEY = 'tb_cart_coupon';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponState | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponMessageType, setCouponMessageType] = useState<'error' | 'success' | null>(null);

  useEffect(() => {
    const cart: CartItem[] = JSON.parse(localStorage.getItem('tb_cart') || '[]');
    setCartItems(cart);

    let appliedFromStorage: AppliedCouponState | null = null;
    try {
      const stored = localStorage.getItem(COUPON_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppliedCouponState;
        if (parsed?.code) {
          appliedFromStorage = parsed;
          setAppliedCoupon(parsed);
          setCouponCode(parsed.code);
        }
      }
    } catch {
      // ignore
    }

    if (!appliedFromStorage && cart.length > 0 && typeof window !== 'undefined') {
      const profileData = localStorage.getItem('profile');
      const userData = localStorage.getItem('user');
      const user =
        profileData || userData
          ? {
              ...(userData ? JSON.parse(userData) : {}),
              ...(profileData ? JSON.parse(profileData) : {}),
            }
          : null;
      const available = getAvailableCouponsForUser(user);
      if (available.length > 0) {
        const preferred = available.find((c) => c.code === DEFAULT_COUPON_CODE) || available[0];
        setCouponCode(preferred.code);
        const minimalCart: MinimalCartItem[] = cart.map((item) => ({
          id: item.id,
          price: item.price,
          quantity: item.quantity,
        }));
        const result = validateCoupon(
          preferred.code,
          minimalCart,
          (id) => {
            const p = getProductById(id);
            if (!p) return null as any;
            return { id: p.id, category: p.category, price: p.price, originalPrice: p.originalPrice };
          },
          user
        );
        if (result.ok) {
          setAppliedCoupon({ code: result.coupon.code, discount: result.discount });
          localStorage.setItem(
            COUPON_STORAGE_KEY,
            JSON.stringify({ code: result.coupon.code, discount: result.discount })
          );
        }
      }
    }
  }, []);

  const updateCart = (updated: CartItem[]) => {
    const filtered = updated.filter((i) => i.quantity > 0);
    localStorage.setItem('tb_cart', JSON.stringify(filtered));
    setCartItems(filtered);
  };

  const removeItem = (productId: number) => {
    updateCart(cartItems.filter((i) => i.id !== productId));
  };

  const changeQuantity = (productId: number, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id !== productId) return item;
      const qty = Math.max(0, (item.quantity || 1) + delta);
      return { ...item, quantity: qty };
    });
    updateCart(updated.filter((i) => i.quantity > 0));
  };

  const minimalCart: MinimalCartItem[] = cartItems.map((item) => ({
    id: item.id,
    price: item.price,
    quantity: item.quantity,
  }));

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  const handleApplyCoupon = () => {
    setCouponMessage(null);
    setCouponMessageType(null);

    if (cartItems.length === 0) {
      setCouponMessage('Your cart is empty.');
      setCouponMessageType('error');
      return;
    }

    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;

    const result = validateCoupon(
      couponCode,
      minimalCart,
      (id) => {
        const p = getProductById(id);
        if (!p) return null as any;
        return {
          id: p.id,
          category: p.category,
          price: p.price,
          originalPrice: p.originalPrice,
        };
      },
      user,
    );

    if (!result.ok) {
      setAppliedCoupon(null);
      localStorage.removeItem(COUPON_STORAGE_KEY);

      let message = result.message;
      if (result.errorCode === 'EXPIRED') {
        message = 'This coupon has expired.';
      } else if (result.errorCode === 'USER_LIMIT') {
        message = result.message || 'You have already used this coupon.';
      } else if (result.errorCode === 'NO_ELIGIBLE_ITEMS') {
        message = 'Coupon is only applicable on selected premium categories.';
      }

      setCouponMessage(message);
      setCouponMessageType('error');
      return;
    }

    const discount = result.discount;
    const applied: AppliedCouponState = { code: result.coupon.code, discount };
    setAppliedCoupon(applied);
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(applied));

    setCouponMessage(`Coupon applied! You saved ₹${discount.toFixed(2)}.`);
    setCouponMessageType('success');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
    setCouponMessageType(null);
    localStorage.removeItem(COUPON_STORAGE_KEY);
  };

  const discountAmount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="pt-24 pb-16 px-4 md:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-4">
            <Link href="/" className="inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Back to home</span>
            </Link>
            <Link href="/" className="hidden md:inline-flex lg:hidden items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Back to home</span>
            </Link>
            <Link href="/" className="hidden lg:inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Back to home</span>
            </Link>
          </div>
          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-20 h-20 text-rose-200 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some products to get started.</p>
              <Link href="/" className="inline-block bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-95 transition-colors">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800 mb-8">
                Cart ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
              </h1>

              <div className="space-y-4 mb-8">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-rose-100 p-4 md:p-5 flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover bg-rose-50 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                      <p className="text-lg font-bold text-rose-600 mt-1">₹{item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, -1)}
                            className="p-2 text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-colors rounded-l-lg"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, 1)}
                            className="p-2 text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-colors rounded-r-lg"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-800 flex-shrink-0">
                      ₹{((item.quantity || 1) * item.price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-rose-100 p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-semibold text-gray-800">Apply Coupon</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="whitespace-nowrap px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="whitespace-nowrap px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white text-sm font-medium hover:opacity-95 transition-colors"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  {couponMessage && (
                    <p
                      className={`mt-2 text-xs ${
                        couponMessageType === 'error' ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {couponMessage}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-500">
                    Coupon is valid only on selected premium categories and cannot be combined with other offers. Minimum
                    eligible cart value of ₹1000 is required.
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-base font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-sm text-emerald-600">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                    <span className="text-base font-medium text-gray-800">Total</span>
                    <span className="text-xl font-bold text-gray-900">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  href="/cart/shipping"
                  className="block w-full bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-3 rounded-lg font-medium text-center hover:opacity-95 transition-colors"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/"
                  className="block w-full py-2.5 text-center text-rose-600 font-medium hover:text-rose-700 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

