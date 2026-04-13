'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Clock,
  Truck,
  RefreshCw,
  DollarSign,
  ChevronRight,
  Upload,
  X,
} from 'lucide-react';
import {
  getOrderById,
  addReturnRequest,
  addExchangeRequest,
  RETURN_EXCHANGE_REASONS,
  type StoredOrder,
  type OrderStatus,
} from '../../../../utils/orders';

function getStatusLabel(s: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return map[s] || s;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [exchangeReason, setExchangeReason] = useState('');
  const [exchangeImages, setExchangeImages] = useState<string[]>([]);
  const [submitType, setSubmitType] = useState<'return' | 'exchange' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadOrder = useCallback(() => {
    if (!orderId) return;
    const o = getOrderById(orderId);
    setOrder(o);
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!orderId) router.replace('/profile/orders');
  }, [orderId, router]);

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reasonOption = RETURN_EXCHANGE_REASONS.find((r) => r.code === returnReason);
    if (!reasonOption || !orderId) return;
    addReturnRequest(orderId, reasonOption.code, reasonOption.label, returnImages.length ? returnImages : undefined);
    setSuccessMessage('Return request submitted.');
    setReturnReason('');
    setReturnImages([]);
    setSubmitType(null);
    loadOrder();
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleExchangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reasonOption = RETURN_EXCHANGE_REASONS.find((r) => r.code === exchangeReason);
    if (!reasonOption || !orderId) return;
    addExchangeRequest(orderId, reasonOption.code, reasonOption.label, exchangeImages.length ? exchangeImages : undefined);
    setSuccessMessage('Exchange request submitted.');
    setExchangeReason('');
    setExchangeImages([]);
    setSubmitType(null);
    loadOrder();
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleImageAdd = (type: 'return' | 'exchange', file: File) => {
    const url = URL.createObjectURL(file);
    if (type === 'return') setReturnImages((prev) => [...prev, url]);
    else setExchangeImages((prev) => [...prev, url]);
  };

  const removeImage = (type: 'return' | 'exchange', index: number) => {
    if (type === 'return') setReturnImages((prev) => prev.filter((_, i) => i !== index));
    else setExchangeImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (!order) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-12 px-4 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Order not found.</p>
            <Link href="/profile/orders" className="text-rose-600 font-medium hover:underline">
              Back to orders
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const status = order.status || 'pending';

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12 px-4 md:px-8">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <Link
              href="/profile/orders"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to orders
            </Link>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
              {successMessage}
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800">
              Order #{order.orderId.replace('TB-ORD-', '')}
            </h1>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-800 border border-rose-200">
              {getStatusLabel(status)}
            </span>
          </div>

          <div className="space-y-6">
            {/* Order summary */}
            <section className="bg-white rounded-2xl shadow-sm border border-rose-100/80 overflow-hidden">
              <div className="p-4 md:p-5 border-b border-rose-100/80 bg-rose-50/30">
                <h2 className="text-lg font-semibold text-gray-800">Order summary</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Placed on{' '}
                  {new Date(order.placedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="p-4 md:p-5">
                <ul className="space-y-3">
                  {order.items.map((item) => {
                    const qty = item.quantity || 1;
                    const lineTotal = item.price * qty;
                    return (
                      <li
                        key={`${item.id}-${item.name}`}
                        className="flex gap-3 items-center py-2 border-b border-gray-100 last:border-0"
                      >
                        <Link
                          href={`/product/${item.id}`}
                          className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-rose-50 border border-rose-100"
                        >
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${item.id}`} className="font-medium text-gray-800 hover:text-rose-600">
                            {item.name}
                          </Link>
                          <p className="text-sm text-gray-500">
                            Qty: {qty} × ₹{item.price.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">₹{lineTotal.toLocaleString('en-IN')}</p>
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
              </div>
            </section>

            {/* Payment info */}
            <section className="bg-white rounded-2xl shadow-sm border border-rose-100/80 overflow-hidden">
              <div className="p-4 md:p-5 border-b border-rose-100/80 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-semibold text-gray-800">Payment</h2>
              </div>
              <div className="p-4 md:p-5 text-sm text-gray-600">
                {order.paymentMethod ? (
                  <p>
                    {order.paymentMethod}
                    {order.paymentLast4 ? ` •••• ${order.paymentLast4}` : ''}
                  </p>
                ) : (
                  <p>Online payment • ₹{order.total.toLocaleString('en-IN')} paid</p>
                )}
              </div>
            </section>

            {/* Delivery address */}
            {order.shippingAddress && (
              <section className="bg-white rounded-2xl shadow-sm border border-rose-100/80 overflow-hidden">
                <div className="p-4 md:p-5 border-b border-rose-100/80 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Delivery address</h2>
                </div>
                <div className="p-4 md:p-5 text-sm text-gray-700">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.phone}</p>
                  <p>
                    {order.shippingAddress.addressLine1}
                    {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                  </p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                </div>
              </section>
            )}

            {/* Order timeline */}
            <section className="bg-white rounded-2xl shadow-sm border border-rose-100/80 overflow-hidden">
              <div className="p-4 md:p-5 border-b border-rose-100/80 flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-semibold text-gray-800">Order timeline</h2>
              </div>
              <div className="p-4 md:p-5">
                <ul className="space-y-4">
                  {order.timeline?.map((event, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{event.label}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Track order */}
            {(status === 'shipped' || status === 'delivered') && (
              <section id="track" className="bg-white rounded-2xl shadow-sm border border-rose-100/80 overflow-hidden scroll-mt-24">
                <div className="p-4 md:p-5 border-b border-rose-100/80 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Track order</h2>
                </div>
                <div className="p-4 md:p-5 text-sm text-gray-600">
                  {order.trackingNumber || order.trackingUrl ? (
                    <p>
                      {order.trackingNumber && (
                        <span className="block font-medium text-gray-800 mb-1">Tracking: {order.trackingNumber}</span>
                      )}
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-rose-600 hover:underline"
                        >
                          Track shipment
                        </a>
                      )}
                    </p>
                  ) : (
                    <p>Tracking will be updated once the order is dispatched.</p>
                  )}
                </div>
              </section>
            )}

            {/* Return request */}
            {status === 'delivered' && (
              <section id="return" className="bg-white rounded-2xl shadow-sm border border-rose-100/80 overflow-hidden scroll-mt-24">
                <div className="p-4 md:p-5 border-b border-rose-100/80 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Return product</h2>
                </div>
                <div className="p-4 md:p-5">
                  {(order.returnRequests?.length ?? 0) > 0 && (
                    <div className="mb-4 p-3 bg-rose-50 rounded-lg text-sm text-gray-700">
                      <p className="font-medium">Your return requests</p>
                      {order.returnRequests!.map((r) => (
                        <p key={r.id} className="mt-1 text-gray-600">
                          {r.reason} — {r.status} ({new Date(r.requestedAt).toLocaleDateString()})
                        </p>
                      ))}
                    </div>
                  )}
                  {submitType !== 'return' ? (
                    <button
                      type="button"
                      onClick={() => setSubmitType('return')}
                      className="px-4 py-2 text-sm font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50"
                    >
                      Request return
                    </button>
                  ) : (
                    <form onSubmit={handleReturnSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <select
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          required
                        >
                          <option value="">Select reason</option>
                          {RETURN_EXCHANGE_REASONS.map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Photos (optional)</label>
                        <div className="flex flex-wrap gap-2">
                          {returnImages.map((url, i) => (
                            <div key={i} className="relative">
                              <img src={url} alt="" className="w-16 h-16 object-cover rounded border" />
                              <button
                                type="button"
                                onClick={() => removeImage('return', i)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-rose-400">
                            <Upload className="w-6 h-6 text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleImageAdd('return', f);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setSubmitType(null); setReturnReason(''); setReturnImages([]); }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700"
                        >
                          Submit return request
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </section>
            )}

            {/* Exchange request */}
            {status === 'delivered' && (
              <section id="exchange" className="bg-white rounded-2xl shadow-sm border border-rose-100/80 overflow-hidden scroll-mt-24">
                <div className="p-4 md:p-5 border-b border-rose-100/80 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Exchange product</h2>
                </div>
                <div className="p-4 md:p-5">
                  {(order.exchangeRequests?.length ?? 0) > 0 && (
                    <div className="mb-4 p-3 bg-rose-50 rounded-lg text-sm text-gray-700">
                      <p className="font-medium">Your exchange requests</p>
                      {order.exchangeRequests!.map((r) => (
                        <p key={r.id} className="mt-1 text-gray-600">
                          {r.reason} — {r.status} ({new Date(r.requestedAt).toLocaleDateString()})
                        </p>
                      ))}
                    </div>
                  )}
                  {submitType !== 'exchange' ? (
                    <button
                      type="button"
                      onClick={() => setSubmitType('exchange')}
                      className="px-4 py-2 text-sm font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50"
                    >
                      Request exchange
                    </button>
                  ) : (
                    <form onSubmit={handleExchangeSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <select
                          value={exchangeReason}
                          onChange={(e) => setExchangeReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          required
                        >
                          <option value="">Select reason</option>
                          {RETURN_EXCHANGE_REASONS.map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Photos (optional)</label>
                        <div className="flex flex-wrap gap-2">
                          {exchangeImages.map((url, i) => (
                            <div key={i} className="relative">
                              <img src={url} alt="" className="w-16 h-16 object-cover rounded border" />
                              <button
                                type="button"
                                onClick={() => removeImage('exchange', i)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-rose-400">
                            <Upload className="w-6 h-6 text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleImageAdd('exchange', f);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setSubmitType(null); setExchangeReason(''); setExchangeImages([]); }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700"
                        >
                          Submit exchange request
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </section>
            )}

            {/* Refund status */}
            {(status === 'cancelled' || order.refundStatus) && (
              <section id="refund" className="bg-white rounded-2xl shadow-sm border border-rose-100/80 overflow-hidden scroll-mt-24">
                <div className="p-4 md:p-5 border-b border-rose-100/80 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Refund status</h2>
                </div>
                <div className="p-4 md:p-5 text-sm text-gray-700">
                  {order.refundStatus?.status && order.refundStatus.status !== 'none' ? (
                    <div>
                      <p className="font-medium capitalize">{order.refundStatus.status}</p>
                      {order.refundStatus.amount != null && (
                        <p className="text-gray-600">Amount: ₹{order.refundStatus.amount.toLocaleString('en-IN')}</p>
                      )}
                      {order.refundStatus.processedAt && (
                        <p className="text-gray-500 text-xs mt-1">
                          Processed on {new Date(order.refundStatus.processedAt).toLocaleDateString()}
                        </p>
                      )}
                      {order.refundStatus.note && <p className="mt-1 text-gray-600">{order.refundStatus.note}</p>}
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      {status === 'cancelled'
                        ? 'Refund will be processed as per policy. You can check back here for updates.'
                        : 'No refund requested for this order.'}
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
