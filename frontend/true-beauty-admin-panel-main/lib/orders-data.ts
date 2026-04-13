export type OrderStatus =
  | "pending"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentMethod = "upi" | "card" | "netbanking" | "cod";

export type RefundStatus = "none" | "requested" | "approved" | "rejected";

export interface OrderItem {
  id: string;
  productName: string;
  productImage?: string | null;
  price: number;
  quantity: number;
  totalAmount: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerPincode: string;
  items: OrderItem[];
  productsCount: number;
  subTotal: number;
  discount: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  refundStatus: RefundStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-1001",
    customerName: "Sarah Johnson",
    customerEmail: "sarah.j@example.com",
    customerPhone: "+91 98765 01010",
    customerAddress: "123 Oak St",
    customerCity: "New York",
    customerState: "NY",
    customerPincode: "10001",
    items: [
      {
        id: "ord-1001-item-1",
        productName: "True Beauty Night Cream",
        productImage: "/products/nightCream.png",
        price: 1399,
        quantity: 2,
        totalAmount: 2798,
      },
      {
        id: "ord-1001-item-2",
        productName: "Vitamin C Face Wash",
        productImage: "/products/faceWash.png",
        price: 499,
        quantity: 1,
        totalAmount: 499,
      },
    ],
    productsCount: 3,
    subTotal: 3297,
    discount: 200,
    tax: 185,
    shipping: 49,
    totalAmount: 3331,
    paymentMethod: "upi",
    paymentStatus: "paid",
    orderStatus: "delivered",
    refundStatus: "none",
    trackingNumber: "TRK123456789",
    trackingUrl: "https://tracking.example.com/TRK123456789",
    notes: "Leave package at the front desk.",
    createdAt: "2024-06-10T10:15:00Z",
    updatedAt: "2024-06-11T08:00:00Z",
  },
  {
    id: "ORD-1002",
    customerName: "Emma Williams",
    customerEmail: "emma.w@example.com",
    customerPhone: "+91 98765 01020",
    customerAddress: "456 Pine Ave",
    customerCity: "Los Angeles",
    customerState: "CA",
    customerPincode: "90001",
    items: [
      {
        id: "ord-1002-item-1",
        productName: "Sunscreen SPF 50",
        productImage: "/products/sunscreen.png",
        price: 449,
        quantity: 2,
        totalAmount: 898,
      },
    ],
    productsCount: 2,
    subTotal: 898,
    discount: 0,
    tax: 54,
    shipping: 0,
    totalAmount: 952,
    paymentMethod: "card",
    paymentStatus: "paid",
    orderStatus: "shipped",
    refundStatus: "none",
    trackingNumber: "TRK987654321",
    trackingUrl: "https://tracking.example.com/TRK987654321",
    notes: "",
    createdAt: "2024-06-12T14:30:00Z",
    updatedAt: "2024-06-13T09:15:00Z",
  },
  {
    id: "ORD-1003",
    customerName: "Ava Davis",
    customerEmail: "ava.d@example.com",
    customerPhone: "+91 98765 01040",
    customerAddress: "321 Elm St",
    customerCity: "Houston",
    customerState: "TX",
    customerPincode: "77001",
    items: [
      {
        id: "ord-1003-item-1",
        productName: "Lip Balm Set",
        productImage: "/products/lipBalm.png",
        price: 299,
        quantity: 1,
        totalAmount: 299,
      },
      {
        id: "ord-1003-item-2",
        productName: "True Beauty Moisturizer",
        productImage: "/products/moisturizer.png",
        price: 649,
        quantity: 1,
        totalAmount: 649,
      },
    ],
    productsCount: 2,
    subTotal: 948,
    discount: 50,
    tax: 54,
    shipping: 49,
    totalAmount: 1001,
    paymentMethod: "netbanking",
    paymentStatus: "paid",
    orderStatus: "shipped",
    refundStatus: "requested",
    notes: "Requested refund for moisturizer due to allergy.",
    createdAt: "2024-06-14T09:45:00Z",
    updatedAt: "2024-06-14T11:00:00Z",
  },
  {
    id: "ORD-1004",
    customerName: "Sophia Martinez",
    customerEmail: "sophia.m@example.com",
    customerPhone: "+91 98765 01050",
    customerAddress: "654 Cedar Ln",
    customerCity: "Phoenix",
    customerState: "AZ",
    customerPincode: "85001",
    items: [
      {
        id: "ord-1004-item-1",
        productName: "Hand Cream",
        productImage: "/products/handCream.png",
        price: 299,
        quantity: 2,
        totalAmount: 598,
      },
    ],
    productsCount: 2,
    subTotal: 598,
    discount: 0,
    tax: 36,
    shipping: 0,
    totalAmount: 634,
    paymentMethod: "cod",
    paymentStatus: "pending",
    orderStatus: "pending",
    refundStatus: "none",
    createdAt: "2024-06-15T16:20:00Z",
    updatedAt: "2024-06-15T16:20:00Z",
  },
];

export function generateOrderId(): string {
  return (
    "ORD-" +
    Math.floor(1000 + Math.random() * 9000) +
    "-" +
    Date.now().toString(36).toUpperCase()
  );
}

