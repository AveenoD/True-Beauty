'use client';

import { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { ArrowLeft, TicketPercent, History, Tag, ExternalLink } from 'lucide-react';
import {
  getStoredCoupons,
  getCouponHistory,
  ensureExpiredCouponsInHistory,
  getUserIdForCouponUsage,
  canUserUseCoupon,
  type CouponHistoryEntry,
  type CouponHistoryStatus,
} from '../../../utils/coupons';

const todayStr = () => new Date().toISOString().slice(0, 10);

function StatusBadge({ status }: { status: CouponHistoryStatus }) {
  const styles: Record<CouponHistoryStatus, string> = {
    used: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    expired: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const labels: Record<CouponHistoryStatus, string> = {
    used: 'Used',
    expired: 'Expired',
    cancelled: 'Cancelled',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function MyCouponsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [coupons, setCoupons] = useState(() => getStoredCoupons());
  const [history, setHistory] = useState<CouponHistoryEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    ensureExpiredCouponsInHistory();
    setCoupons(getStoredCoupons());
    setHistory(getCouponHistory());
    if (typeof window !== 'undefined') {
      const profileData = localStorage.getItem('profile');
      const userData = localStorage.getItem('user');
      const user =
        profileData || userData
          ? {
              ...(userData ? JSON.parse(userData) : {}),
              ...(profileData ? JSON.parse(profileData) : {}),
            }
          : null;
      setUserId(getUserIdForCouponUsage(user));
    }
  }, [activeTab]);

  const activeCoupons = coupons.filter((c) => {
    if (!c.active || todayStr() > c.expiryDate) return false;
    const canUse = canUserUseCoupon(c, userId);
    return canUse.ok;
  });

  const usedEntries = history.filter((h) => h.status === 'used');
  const totalCouponsUsed = usedEntries.length;
  const totalSavings = usedEntries.reduce((sum, h) => sum + h.discountAmount, 0);

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-12 px-4 md:px-8">
        <div className="container mx-auto max-w-4xl">
          {/* Back link */}
          <div className="md:hidden mb-4">
            <Link
              href="/profile"
              className="inline-flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
          </div>
          <div className="hidden lg:block mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Back to profile
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-rose-100/80 p-6 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-rose-100 flex items-center justify-center">
                <TicketPercent className="w-7 h-7 text-rose-500" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-playfair font-bold text-gray-800">
                  My Coupons
                </h1>
                <p className="text-sm text-gray-600">
                  View available coupons and your coupon history.
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Total Coupons Used
                </p>
                <p className="text-2xl font-bold text-gray-800">{totalCouponsUsed}</p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Lifetime Savings
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  ₹{totalSavings.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === 'active'
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Tag className="w-4 h-4" />
                Active Coupons
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === 'history'
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <History className="w-4 h-4" />
                Coupon History
              </button>
            </div>

            {activeTab === 'active' ? (
              <>
                {activeCoupons.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-2">
                      You don&apos;t have any active coupons right now.
                    </p>
                    <p className="text-sm text-gray-500">
                      Coupons you earn or receive will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeCoupons.map((coupon) => (
                      <div
                        key={coupon.code}
                        className="border border-rose-100 rounded-xl p-4 md:p-5 bg-rose-50/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-500 text-white text-xs font-semibold tracking-wide">
                              {coupon.code}
                            </span>
                          </div>
                          {coupon.description && (
                            <p className="text-sm text-gray-800">
                              {coupon.description}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-600">
                            {coupon.discountPercent != null
                              ? `${coupon.discountPercent}% off on your next order`
                              : `Flat ₹${coupon.discountAmount} off on eligible items`}
                            {coupon.minCartTotal > 0 && ` • Min cart ₹${coupon.minCartTotal}`}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Valid from{' '}
                            <span className="font-medium">{coupon.startDate}</span>{' '}
                            to{' '}
                            <span className="font-medium">{coupon.expiryDate}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">No coupon history yet.</p>
                    <p className="text-sm text-gray-500">
                      Used, expired, or cancelled coupons will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="border border-rose-100 rounded-xl p-4 md:p-5 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-3"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-800">
                              {entry.couponCode}
                            </span>
                            <StatusBadge status={entry.status} />
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                            <span className="text-emerald-600 font-medium">
                              ₹{entry.discountAmount.toLocaleString('en-IN')} off
                            </span>
                            <span>Order: {entry.orderId || '–'}</span>
                            <span>
                              {entry.usedAt
                                ? new Date(entry.usedAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '–'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {entry.status === 'used' && entry.orderId ? (
                            <Link
                              href={`/profile/orders?orderId=${encodeURIComponent(entry.orderId)}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              View Order
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
