export type UserStatus = "active" | "blocked";

export type ReturnStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "pickup_scheduled"
  | "pickup_completed"
  | "refund_initiated"
  | "completed";

export type ExchangeStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "pickup"
  | "replacement_shipped"
  | "replacement_delivered";

export interface ReturnTimelineEntry {
  status: ReturnStatus;
  date: string;
  note?: string;
}

export interface ExchangeTimelineEntry {
  status: ExchangeStatus;
  date: string;
  note?: string;
}

export type RefundMethod = "bank_transfer" | "upi" | "original_source";

export interface RefundDetails {
  method: RefundMethod;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}

export interface RefundAuditEntry {
  action: string;
  date: string;
  by: string;
  note?: string;
}

export interface OrderItem {
  orderId: string;
  productImage?: string | null;
  productName: string;
  price: number;
  quantity: number;
  totalAmount: number;
  orderDate: string;
  orderStatus: string;
  /** Optional reason for return (for returned items) */
  returnReason?: string;
  /** Longer customer description for the return */
  returnDescription?: string;
  /** Optional list of uploaded image URLs relevant to the return */
  returnImages?: string[];
  /** When the return was initially requested */
  returnRequestedAt?: string;
  /** Current lifecycle status for returns */
  returnStatus?: ReturnStatus;
  /** Timeline of status changes for this return */
  returnTimeline?: ReturnTimelineEntry[];
  /** Refund destination details, when applicable */
  refundDetails?: RefundDetails;
  /** Audit entries for refund-related actions */
  refundAuditLog?: RefundAuditEntry[];
  /** Reason provided when the order was cancelled */
  cancelReason?: string;
  /** Who cancelled the order */
  cancelledBy?: "user" | "admin";
  /** High-level refund status for cancelled/returned orders */
  refundStatus?: "not_applicable" | "pending" | "processed";
  /** Optional transaction identifier for processed refunds */
  refundTransactionId?: string;
  /** Optional reason for exchange (for exchange requests) */
  exchangeReason?: string;
  /** Longer customer description for the exchange */
  exchangeDescription?: string;
  /** When the exchange was initially requested */
  exchangeRequestedAt?: string;
  /** Current lifecycle status for exchanges */
  exchangeStatus?: ExchangeStatus;
  /** Timeline of status changes for this exchange */
  exchangeTimeline?: ExchangeTimelineEntry[];
  /** Replacement product name, if different from original */
  replacementProductName?: string;
  /** Replacement variant information (shade, size, etc.) */
  replacementVariant?: string;
  /** Replacement quantity, if different from original */
  replacementQuantity?: number;
  /** Tracking identifier for the replacement shipment */
  replacementTrackingId?: string;
}

export type KycStatus = "not_submitted" | "pending" | "verified";

export interface UserKyc {
  status: KycStatus;
  /**
   * Public URL or path for the user's uploaded Aadhar document.
   * In real app this would come from backend / storage service.
   */
  aadharUrl?: string;
  /**
   * Public URL or path for the user's uploaded PAN document.
   */
  panUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  dob: string;
  gender: string;
  city: string;
  state: string;
  pincode: string;
  totalOrders: number;
  totalSpend: number;
  productsPurchased: number;
  returns: number;
  cancelled: number;
  refunds: number;
  status: UserStatus;
  joinedDate: string;
  purchases: OrderItem[];
  returnsOrders: OrderItem[];
  cancelledOrders: OrderItem[];
  refundedOrders: OrderItem[];
  exchangeOrders: OrderItem[];
  wishlist: WishlistItem[];
  /**
   * Optional KYC information uploaded from user side.
   */
  kyc?: UserKyc;
}

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  category: string;
  price: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  productStatus: "active" | "draft" | "inactive";
  likedAt: string;
}

// Mock order items for development
const MOCK_PURCHASES_USER1: OrderItem[] = [
  {
    orderId: "ord-1a",
    productName: "True Beauty Night Cream",
    productImage: "/products/nightCream.png",
    price: 1399,
    quantity: 2,
    totalAmount: 2798,
    orderDate: "2024-06-10",
    orderStatus: "Delivered",
  },
  {
    orderId: "ord-1a",
    productName: "True Beauty Serum",
    productImage: "/products/serum.png",
    price: 899,
    quantity: 1,
    totalAmount: 899,
    orderDate: "2024-06-10",
    orderStatus: "Delivered",
  },
  {
    orderId: "ord-1b",
    productName: "Vitamin C Face Wash",
    productImage: "/products/faceWash.png",
    price: 499,
    quantity: 3,
    totalAmount: 1497,
    orderDate: "2024-05-22",
    orderStatus: "Delivered",
  },
];
const MOCK_EXCHANGES_USER1: OrderItem[] = [
  {
    orderId: "ord-1f",
    productName: "True Beauty Moisturizer",
    productImage: "/products/moisturizer.png",
    price: 649,
    quantity: 1,
    totalAmount: 649,
    orderDate: "2024-04-20",
    orderStatus: "Exchange requested",
    exchangeReason: "Customer requested different variant for skin type.",
    exchangeDescription:
      "Customer realised the ordered moisturizer was for oily skin and requested an exchange to the dry skin variant before opening the product.",
    exchangeRequestedAt: "2024-04-21T10:15:00Z",
    exchangeStatus: "pending_review",
    exchangeTimeline: [
      {
        status: "pending_review",
        date: "2024-04-21T10:15:00Z",
        note: "Exchange request submitted by customer.",
      },
    ],
    replacementProductName: "True Beauty Moisturizer - Dry Skin",
    replacementVariant: "Dry Skin",
    replacementQuantity: 1,
  },
];
const MOCK_RETURNS_USER1: OrderItem[] = [
  {
    orderId: "ord-1c",
    productName: "True Beauty Moisturizer",
    productImage: "/products/moisturizer.png",
    price: 649,
    quantity: 1,
    totalAmount: 649,
    orderDate: "2024-04-15",
    orderStatus: "Returned",
    returnReason: "Skin irritation after first use.",
    returnDescription:
      "Customer experienced mild redness and irritation after applying the moisturizer once and decided to return the product for safety reasons.",
    returnImages: ["/returns/moisturizer-redness.png"],
    returnRequestedAt: "2024-04-16T09:30:00Z",
    returnStatus: "pending_review",
    returnTimeline: [
      {
        status: "pending_review",
        date: "2024-04-16T09:30:00Z",
        note: "Return request submitted by customer.",
      },
    ],
    refundDetails: {
      method: "bank_transfer",
      accountHolderName: "Sarah Johnson",
      bankName: "HDFC Bank",
      accountNumber: "123456789012",
      ifscCode: "HDFC0001234",
    },
    refundAuditLog: [],
  },
];
const MOCK_CANCELLED_USER1: OrderItem[] = [
  {
    orderId: "ord-1d",
    productName: "Hair Oil",
    productImage: "/products/hairOil.png",
    price: 399,
    quantity: 1,
    totalAmount: 399,
    orderDate: "2024-03-01",
    orderStatus: "Cancelled",
    cancelReason: "Customer changed mind before shipment.",
    cancelledBy: "user",
    refundStatus: "pending",
  },
];
const MOCK_REFUNDED_USER1: OrderItem[] = [
  {
    orderId: "ord-1e",
    productName: "Lip Balm Set",
    productImage: "/products/lipBalm.png",
    price: 299,
    quantity: 2,
    totalAmount: 598,
    orderDate: "2024-02-10",
    orderStatus: "Refunded",
  },
];

const MOCK_WISHLIST_USER1: WishlistItem[] = [
  {
    id: "w-1",
    productId: "p1",
    productName: "True Beauty Night Cream",
    productImage: "/products/nightCream.png",
    category: "Skincare",
    price: 1399,
    stockStatus: "in_stock",
    productStatus: "active",
    likedAt: "2024-06-05T10:15:00Z",
  },
  {
    id: "w-2",
    productId: "p2",
    productName: "True Beauty Serum",
    productImage: "/products/serum.png",
    category: "Skincare",
    price: 899,
    stockStatus: "low_stock",
    productStatus: "active",
    likedAt: "2024-06-08T14:45:00Z",
  },
];

const MOCK_PURCHASES_USER2: OrderItem[] = [
  {
    orderId: "ord-2a",
    productName: "Face Mask Pack",
    productImage: "/products/faceMask.png",
    price: 599,
    quantity: 2,
    totalAmount: 1198,
    orderDate: "2024-05-01",
    orderStatus: "Delivered",
  },
  {
    orderId: "ord-2b",
    productName: "Sunscreen SPF 50",
    productImage: "/products/sunscreen.png",
    price: 449,
    quantity: 1,
    totalAmount: 449,
    orderDate: "2024-04-18",
    orderStatus: "Delivered",
  },
];
const MOCK_EXCHANGES_USER2: OrderItem[] = [];
const MOCK_WISHLIST_USER2: WishlistItem[] = [];
const MOCK_PURCHASES_USER4: OrderItem[] = [
  {
    orderId: "ord-4a",
    productName: "Body Lotion",
    productImage: "/products/bodyLotion.png",
    price: 549,
    quantity: 2,
    totalAmount: 1098,
    orderDate: "2024-05-20",
    orderStatus: "Delivered",
  },
  {
    orderId: "ord-4b",
    productName: "Cleansing Balm",
    productImage: "/products/cleansing.png",
    price: 799,
    quantity: 1,
    totalAmount: 799,
    orderDate: "2024-04-10",
    orderStatus: "Delivered",
  },
];
const MOCK_RETURNS_USER4: OrderItem[] = [
  {
    orderId: "ord-4c",
    productName: "Toner",
    productImage: "/products/toner.png",
    price: 349,
    quantity: 1,
    totalAmount: 349,
    orderDate: "2024-03-25",
    orderStatus: "Returned",
    returnReason: "Bottle leaked inside the box.",
    returnDescription:
      "Courier delivered the toner with visible leakage inside the packaging. Customer shared images of the damaged box and half-empty bottle.",
    returnImages: [
      "/returns/toner-box-damaged.png",
      "/returns/toner-bottle-leak.png",
    ],
    returnRequestedAt: "2024-03-26T11:10:00Z",
    returnStatus: "approved",
    returnTimeline: [
      {
        status: "pending_review",
        date: "2024-03-26T11:10:00Z",
        note: "Return request submitted by customer.",
      },
      {
        status: "approved",
        date: "2024-03-26T15:45:00Z",
        note: "Return approved by admin after reviewing images.",
      },
      {
        status: "pickup_scheduled",
        date: "2024-03-27T09:00:00Z",
        note: "Pickup scheduled with courier partner.",
      },
    ],
    refundDetails: {
      method: "upi",
      upiId: "ava.d@upi",
    },
    refundAuditLog: [],
  },
];
const MOCK_EXCHANGES_USER4: OrderItem[] = [
  {
    orderId: "ord-4g",
    productName: "Body Lotion",
    productImage: "/products/bodyLotion.png",
    price: 549,
    quantity: 1,
    totalAmount: 549,
    orderDate: "2024-05-22",
    orderStatus: "Exchange requested",
    exchangeReason: "Customer wants a different fragrance variant.",
    exchangeDescription:
      "Customer prefers the unscented version of the body lotion and requested an exchange before using the product.",
    exchangeRequestedAt: "2024-05-23T09:45:00Z",
    exchangeStatus: "approved",
    exchangeTimeline: [
      {
        status: "pending_review",
        date: "2024-05-23T09:45:00Z",
        note: "Exchange request submitted by customer.",
      },
      {
        status: "approved",
        date: "2024-05-23T12:30:00Z",
        note: "Exchange approved by admin.",
      },
    ],
    replacementProductName: "Body Lotion - Unscented",
    replacementVariant: "Unscented",
    replacementQuantity: 1,
  },
];
const MOCK_CANCELLED_USER4: OrderItem[] = [
  {
    orderId: "ord-4d",
    productName: "Eye Cream",
    productImage: "/products/eyeCream.png",
    price: 699,
    quantity: 1,
    totalAmount: 699,
    orderDate: "2024-03-12",
    orderStatus: "Cancelled",
    cancelReason: "Pricing error in listing.",
    cancelledBy: "admin",
    refundStatus: "processed",
  },
  {
    orderId: "ord-4e",
    productName: "Scrub",
    productImage: "/products/scrub.png",
    price: 399,
    quantity: 1,
    totalAmount: 399,
    orderDate: "2024-03-12",
    orderStatus: "Cancelled",
    cancelReason: "Duplicate order placed by user.",
    cancelledBy: "user",
    refundStatus: "pending",
  },
];
const MOCK_REFUNDED_USER4: OrderItem[] = [
  {
    orderId: "ord-4f",
    productName: "Sample Kit",
    productImage: "/products/sampleKit.png",
    price: 199,
    quantity: 1,
    totalAmount: 199,
    orderDate: "2024-02-28",
    orderStatus: "Refunded",
  },
];
const MOCK_WISHLIST_USER4: WishlistItem[] = [
  {
    id: "w-3",
    productId: "p3",
    productName: "Cleansing Balm",
    productImage: "/products/cleansing.png",
    category: "Cleansers",
    price: 799,
    stockStatus: "in_stock",
    productStatus: "active",
    likedAt: "2024-05-18T09:00:00Z",
  },
];
const MOCK_PURCHASES_USER5: OrderItem[] = [
  {
    orderId: "ord-5a",
    productName: "Hand Cream",
    productImage: "/products/handCream.png",
    price: 299,
    quantity: 2,
    totalAmount: 598,
    orderDate: "2024-05-05",
    orderStatus: "Delivered",
  },
  {
    orderId: "ord-5b",
    productName: "Face Mist",
    productImage: "/products/faceMist.png",
    price: 349,
    quantity: 1,
    totalAmount: 349,
    orderDate: "2024-04-20",
    orderStatus: "Delivered",
  },
];
const MOCK_RETURNS_USER5: OrderItem[] = [
  {
    orderId: "ord-5c",
    productName: "BB Cream",
    productImage: "/products/bbCream.png",
    price: 499,
    quantity: 1,
    totalAmount: 499,
    orderDate: "2024-04-01",
    orderStatus: "Returned",
    returnReason: "BB Cream shade mismatch.",
    returnDescription:
      "Customer ordered the wrong shade and wants to return it unused. Packaging is intact and seal is not broken.",
    returnImages: ["/returns/bbcream-box.png"],
    returnRequestedAt: "2024-04-02T14:20:00Z",
    returnStatus: "refund_initiated",
    returnTimeline: [
      {
        status: "pending_review",
        date: "2024-04-02T14:20:00Z",
      },
      {
        status: "approved",
        date: "2024-04-02T16:00:00Z",
      },
      {
        status: "pickup_completed",
        date: "2024-04-04T10:30:00Z",
      },
      {
        status: "refund_initiated",
        date: "2024-04-05T12:00:00Z",
      },
    ],
    refundDetails: {
      method: "original_source",
    },
    refundAuditLog: [],
  },
];
const MOCK_EXCHANGES_USER5: OrderItem[] = [];
const MOCK_CANCELLED_USER5: OrderItem[] = [
  {
    orderId: "ord-5d",
    productName: "Primer",
    productImage: "/products/primer.png",
    price: 449,
    quantity: 1,
    totalAmount: 449,
    orderDate: "2024-03-15",
    orderStatus: "Cancelled",
  },
];
const MOCK_REFUNDED_USER5: OrderItem[] = [
  {
    orderId: "ord-5e",
    productName: "Trial Set",
    productImage: "/products/trialSet.png",
    price: 199,
    quantity: 1,
    totalAmount: 199,
    orderDate: "2024-03-01",
    orderStatus: "Refunded",
  },
];
const MOCK_WISHLIST_USER5: WishlistItem[] = [];

// Mock data for development
export const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    mobile: "+91 9876543210",
    address: "123 Oak St",
    dob: "1990-05-12",
    gender: "Female",
    city: "New York",
    state: "NY",
    pincode: "10001",
    totalOrders: 24,
    totalSpend: 1240,
    productsPurchased: 32,
    returns: 2,
    cancelled: 1,
    refunds: 1,
    status: "active",
    joinedDate: "2024-01-15",
    purchases: MOCK_PURCHASES_USER1,
    returnsOrders: MOCK_RETURNS_USER1,
    cancelledOrders: MOCK_CANCELLED_USER1,
    refundedOrders: MOCK_REFUNDED_USER1,
    exchangeOrders: MOCK_EXCHANGES_USER1,
    wishlist: MOCK_WISHLIST_USER1,
    kyc: {
      status: "verified",
      aadharUrl:
        "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&w=800",
      panUrl:
        "https://images.pexels.com/photos/3746315/pexels-photo-3746315.jpeg?auto=compress&w=800",
    },
  },
  {
    id: "2",
    name: "Emma Williams",
    email: "emma.w@example.com",
    mobile: "+91 9876543211",
    address: "456 Pine Ave",
    dob: "1988-11-03",
    gender: "Female",
    city: "Los Angeles",
    state: "CA",
    pincode: "90001",
    totalOrders: 8,
    totalSpend: 420,
    productsPurchased: 11,
    returns: 0,
    cancelled: 0,
    refunds: 0,
    status: "active",
    joinedDate: "2024-03-22",
    purchases: MOCK_PURCHASES_USER2,
    returnsOrders: [],
    cancelledOrders: [],
    refundedOrders: [],
    exchangeOrders: MOCK_EXCHANGES_USER2,
    wishlist: MOCK_WISHLIST_USER2,
    kyc: {
      status: "pending",
    },
  },
  {
    id: "3",
    name: "Olivia Brown",
    email: "olivia.b@example.com",
    mobile: "+91 9876543212",
    address: "789 Maple Dr",
    dob: "1995-07-22",
    gender: "Female",
    city: "Chicago",
    state: "IL",
    pincode: "60601",
    totalOrders: 0,
    totalSpend: 0,
    productsPurchased: 0,
    returns: 0,
    cancelled: 0,
    refunds: 0,
    status: "blocked",
    joinedDate: "2024-02-10",
    purchases: [],
    returnsOrders: [],
    cancelledOrders: [],
    refundedOrders: [],
    exchangeOrders: [],
    wishlist: [],
    kyc: {
      status: "not_submitted",
    },
  },
  {
    id: "4",
    name: "Ava Davis",
    email: "ava.d@example.com",
    mobile: "+91 9876543213",
    address: "321 Elm St",
    dob: "1992-01-18",
    gender: "Female",
    city: "Houston",
    state: "TX",
    pincode: "77001",
    totalOrders: 15,
    totalSpend: 890,
    productsPurchased: 19,
    returns: 1,
    cancelled: 2,
    refunds: 1,
    status: "active",
    joinedDate: "2024-04-05",
    purchases: MOCK_PURCHASES_USER4,
    returnsOrders: MOCK_RETURNS_USER4,
    cancelledOrders: MOCK_CANCELLED_USER4,
    refundedOrders: MOCK_REFUNDED_USER4,
    exchangeOrders: MOCK_EXCHANGES_USER4,
    wishlist: MOCK_WISHLIST_USER4,
    kyc: {
      status: "verified",
    },
  },
  {
    id: "5",
    name: "Sophia Martinez",
    email: "sophia.m@example.com",
    mobile: "+91 9876543214",
    address: "654 Cedar Ln",
    dob: "1987-09-30",
    gender: "Female",
    city: "Phoenix",
    state: "AZ",
    pincode: "85001",
    totalOrders: 3,
    totalSpend: 156,
    productsPurchased: 4,
    returns: 1,
    cancelled: 1,
    refunds: 1,
    status: "blocked",
    joinedDate: "2024-05-18",
    purchases: MOCK_PURCHASES_USER5,
    returnsOrders: MOCK_RETURNS_USER5,
    cancelledOrders: MOCK_CANCELLED_USER5,
    refundedOrders: MOCK_REFUNDED_USER5,
    exchangeOrders: MOCK_EXCHANGES_USER5,
    wishlist: MOCK_WISHLIST_USER5,
    kyc: {
      status: "not_submitted",
    },
  },
];

export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
