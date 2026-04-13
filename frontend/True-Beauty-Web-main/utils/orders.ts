/**
 * Shared order types and helpers for order management (My Orders, Order Details, returns, refunds).
 */

export const ORDERS_STORAGE_KEY = 'tb_orders';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export type OrderTimelineEvent = {
  at: string; // ISO date
  status: OrderStatus;
  label: string;
  note?: string;
};

export type ShippingAddress = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
};

export type ReturnOrExchangeRequest = {
  id: string;
  type: 'return' | 'exchange';
  requestedAt: string;
  reason: string;
  reasonCode: string;
  imageUrls?: string[]; // base64 or blob URLs for demo
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  note?: string;
};

export type RefundStatus = {
  status: 'none' | 'pending' | 'processed' | 'credited';
  requestedAt?: string;
  processedAt?: string;
  amount?: number;
  note?: string;
};

export type StoredOrder = {
  orderId: string;
  placedAt: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
  paymentLast4?: string;
  shippingAddress?: ShippingAddress;
  timeline: OrderTimelineEvent[];
  trackingNumber?: string;
  trackingUrl?: string;
  returnRequests?: ReturnOrExchangeRequest[];
  exchangeRequests?: ReturnOrExchangeRequest[];
  refundStatus?: RefundStatus;
};

const DEFAULT_TIMELINE = (placedAt: string): OrderTimelineEvent[] => [
  { at: placedAt, status: 'pending', label: 'Order placed' },
];

export function getStoredOrders(): StoredOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    return list.map(normalizeOrder);
  } catch {
    return [];
  }
}

function normalizeOrder(o: Partial<StoredOrder> & { orderId: string }): StoredOrder {
  const status = (o.status || 'pending') as OrderStatus;
  const placedAt = o.placedAt || new Date().toISOString();
  const timeline = Array.isArray(o.timeline) && o.timeline.length > 0
    ? o.timeline
    : DEFAULT_TIMELINE(placedAt);
  return {
    orderId: o.orderId,
    placedAt,
    items: Array.isArray(o.items) ? o.items : [],
    subtotal: typeof o.subtotal === 'number' ? o.subtotal : 0,
    discount: typeof o.discount === 'number' ? o.discount : 0,
    total: typeof o.total === 'number' ? o.total : 0,
    status,
    paymentMethod: o.paymentMethod,
    paymentLast4: o.paymentLast4,
    shippingAddress: o.shippingAddress,
    timeline,
    trackingNumber: o.trackingNumber,
    trackingUrl: o.trackingUrl,
    returnRequests: o.returnRequests || [],
    exchangeRequests: o.exchangeRequests || [],
    refundStatus: o.refundStatus,
  };
}

export function getOrderById(orderId: string): StoredOrder | null {
  const orders = getStoredOrders();
  return orders.find((o) => o.orderId === orderId) || null;
}

export function updateOrder(orderId: string, updates: Partial<StoredOrder>): void {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.orderId === orderId);
  if (idx === -1) return;
  const current = orders[idx];
  const updated = normalizeOrder({ ...current, ...updates });
  orders[idx] = updated;
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export function cancelOrder(orderId: string): void {
  const order = getOrderById(orderId);
  if (!order || (order.status !== 'pending' && order.status !== 'processing')) return;
  const timeline = [
    ...order.timeline,
    { at: new Date().toISOString(), status: 'cancelled' as OrderStatus, label: 'Order cancelled' },
  ];
  updateOrder(orderId, { status: 'cancelled', timeline });
}

export function addReturnRequest(
  orderId: string,
  reasonCode: string,
  reason: string,
  imageUrls?: string[]
): void {
  const order = getOrderById(orderId);
  if (!order) return;
  const req: ReturnOrExchangeRequest = {
    id: `ret-${Date.now()}`,
    type: 'return',
    requestedAt: new Date().toISOString(),
    reason,
    reasonCode,
    imageUrls,
    status: 'pending',
  };
  const returnRequests = [...(order.returnRequests || []), req];
  updateOrder(orderId, { returnRequests });
}

export function addExchangeRequest(
  orderId: string,
  reasonCode: string,
  reason: string,
  imageUrls?: string[]
): void {
  const order = getOrderById(orderId);
  if (!order) return;
  const req: ReturnOrExchangeRequest = {
    id: `ex-${Date.now()}`,
    type: 'exchange',
    requestedAt: new Date().toISOString(),
    reason,
    reasonCode,
    imageUrls,
    status: 'pending',
  };
  const exchangeRequests = [...(order.exchangeRequests || []), req];
  updateOrder(orderId, { exchangeRequests });
}

export function setRefundStatus(
  orderId: string,
  status: RefundStatus['status'],
  amount?: number,
  note?: string
): void {
  const order = getOrderById(orderId);
  if (!order) return;
  const refundStatus: RefundStatus = {
    ...order.refundStatus,
    status,
    amount: amount ?? order.refundStatus?.amount ?? order.total,
    note,
    requestedAt: order.refundStatus?.requestedAt || new Date().toISOString(),
    processedAt: status === 'credited' || status === 'processed' ? new Date().toISOString() : undefined,
  };
  updateOrder(orderId, { refundStatus });
}

export const RETURN_EXCHANGE_REASONS: { code: string; label: string }[] = [
  { code: 'defective', label: 'Product defective or damaged' },
  { code: 'wrong_item', label: 'Wrong item received' },
  { code: 'not_as_described', label: 'Not as described' },
  { code: 'changed_mind', label: 'Changed my mind' },
  { code: 'expired', label: 'Product expired or near expiry' },
  { code: 'other', label: 'Other reason' },
];
