'use client';

import { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { Check, TicketPercent, Copy } from 'lucide-react';
import { getLastEarnedRewardCoupon, clearLastEarnedRewardCoupon } from '../../../utils/coupons';

export default function OrderSuccessPage() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [earnedReward, setEarnedReward] = useState<ReturnType<typeof getLastEarnedRewardCoupon>>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const lastId = localStorage.getItem('tb_last_order_id');
    setOrderId(lastId);
    setEarnedReward(getLastEarnedRewardCoupon());
  }, []);

  const handleCopyCode = async () => {
    if (!earnedReward?.code) return;
    try {
      await navigator.clipboard.writeText(earnedReward.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleViewOrders = () => {
    clearLastEarnedRewardCoupon();
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12 px-4 md:px-8">
        <div className="container mx-auto max-w-lg">
          <div className="bg-white rounded-2xl shadow-sm border border-rose-100/80 overflow-hidden">
            <div className="p-8 md:p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800 mb-2">
                Order placed successfully!
              </h1>
              {orderId && (
                <p className="text-gray-600 mb-6">
                  Order <span className="font-semibold text-gray-800">#{orderId.replace('TB-ORD-', '')}</span>
                </p>
              )}

              {earnedReward && (
                <div className="mb-8 p-5 rounded-xl bg-rose-50 border border-rose-100">
                  <div className="flex items-center justify-center gap-2 text-rose-700 font-semibold mb-3">
                    <TicketPercent className="w-5 h-5" />
                    <span>You earned a reward coupon</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {earnedReward.discountPercent}% OFF on your next purchase. Valid for 30 days.
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <code className="px-4 py-2 bg-white border border-rose-200 rounded-lg font-mono font-bold text-gray-800">
                      {earnedReward.code}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:opacity-95 transition-opacity"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">One-time use. Apply at checkout.</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/profile/orders"
                  onClick={handleViewOrders}
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white rounded-lg font-medium hover:opacity-95 transition-opacity"
                >
                  View orders
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Continue shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
