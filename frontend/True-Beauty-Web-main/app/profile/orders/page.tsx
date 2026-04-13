'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { Package, ArrowLeft, Truck, RefreshCw, XCircle, DollarSign, ExternalLink } from 'lucide-react';
import {
  getStoredOrders,
  cancelOrder as cancelOrderInStorage,
  type StoredOrder,
  type OrderStatus,
} from '../../../utils/orders';

function getStatusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'delivered':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const refreshOrders = useCallback(() => {
    setOrders(getStoredOrders());
  }, []);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const handleCancelClick = (orderId: string) => {
    setConfirmCancelId(orderId);
  };

  const handleCancelConfirm = () => {
    if (!confirmCancelId) return;
    setCancellingId(confirmCancelId);
    cancelOrderInStorage(confirmCancelId);
    setConfirmCancelId(null);
    refreshOrders();
    setCancellingId(null);
  };

  const handleCancelDismiss = () => {
    setConfirmCancelId(null);
  };

  const canCancel = (order: StoredOrder) =>
    order.status === 'pending' || order.status === 'processing';

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12 px-4 md:px-8">
        <div className="container mx-auto max-w-4xl">
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
              href="/profile"
              className="inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Back to profile</span>
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800 mb-6">
            Your Orders
          </h1>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-rose-100/80 p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-rose-500" />
              </div>
              <p className="text-gray-600 mb-6">
                No orders yet. Start shopping to see your orders here!
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white rounded-lg font-medium hover:opacity-95 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const status = order.status || 'pending';
                return (
                  <div
                    key={order.orderId}
                    className="bg-white rounded-2xl shadow-sm border border-rose-100/80 overflow-hidden"
                  >
                    <div className="p-4 md:p-5 border-b border-rose-100/80 flex flex-wrap items-center justify-between gap-2 bg-rose-50/30">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">
                          Order #{order.orderId.replace('TB-ORD-', '')}
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(status)}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-rose-600">
                          ₹{order.total.toLocaleString('en-IN')}
                        </p>
                        <Link
                          href={`/profile/orders/${encodeURIComponent(order.orderId)}`}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          View details
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                    <div className="p-4 md:p-5">
                      <p className="text-xs text-gray-500 mb-3">
                        Placed on{' '}
                        {new Date(order.placedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <ul className="space-y-3">
                        {order.items.map((item) => {
                          const qty = item.quantity || 1;
                          const lineTotal = item.price * qty;
                          return (
                            <li
                              key={`${order.orderId}-${item.id}-${item.name}`}
                              className="flex gap-3 md:gap-4 items-center py-2 border-b border-gray-100 last:border-0"
                            >
                              <Link
                                href={`/product/${item.id}`}
                                className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-rose-50 border border-rose-100"
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </Link>
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/product/${item.id}`}
                                  className="font-medium text-gray-800 hover:text-rose-600 line-clamp-2"
                                >
                                  {item.name}
                                </Link>
                                <p className="text-sm text-gray-500 mt-0.5">
                                  Qty: {qty} × ₹{item.price.toLocaleString('en-IN')}
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-gray-800 flex-shrink-0">
                                ₹{lineTotal.toLocaleString('en-IN')}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Coupon discount</span>
                            <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-gray-800 pt-2">
                          <span>Total</span>
                          <span>₹{order.total.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Action buttons by status */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                        {canCancel(order) && (
                          <button
                            type="button"
                            onClick={() => handleCancelClick(order.orderId)}
                            disabled={cancellingId === order.orderId}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel Order
                          </button>
                        )}
                        {status === 'shipped' && (
                          <Link
                            href={`/profile/orders/${encodeURIComponent(order.orderId)}#track`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <Truck className="w-4 h-4" />
                            Track Order
                          </Link>
                        )}
                        {(status === 'delivered') && (
                          <>
                            <Link
                              href={`/profile/orders/${encodeURIComponent(order.orderId)}#return`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Return Product
                            </Link>
                            <Link
                              href={`/profile/orders/${encodeURIComponent(order.orderId)}#exchange`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Exchange Product
                            </Link>
                          </>
                        )}
                        {status === 'cancelled' && (
                          <Link
                            href={`/profile/orders/${encodeURIComponent(order.orderId)}#refund`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <DollarSign className="w-4 h-4" />
                            Refund Status
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Cancel confirmation modal */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Cancel order?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel this order? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelDismiss}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
