export type NotificationCategory =
  | "system"
  | "customers"
  | "affiliate_users"
  | "new_products"
  | "new_services"
  | "new_orders"
  | "withdraw_request";

export type TargetRole =
  | "all"
  | "customers"
  | "affiliate_users";

/** Type-specific payload for drawer details */
export interface NotificationPayload {
  /** Withdraw: affiliate name, amount, wallet balance, masked bank/upi, request id */
  withdraw?: {
    affiliateName: string;
    requestedAmount: number;
    walletBalance: number;
    bankUpiMasked: string;
    /** Full bank/UPI when revealed (optional, for mask/reveal) */
    fullBankDetails?: string;
    withdrawalId?: string;
    affiliateId?: string;
  };
  /** Order: order id, customer name, amount, payment method, user (customer) id for detail page */
  order?: {
    orderId: string;
    customerName: string;
    amount: number;
    paymentMethod: string;
    userId?: string;
  };
  /** Return: order id, product name, return reason, status, user id for detail page */
  return?: {
    orderId: string;
    productName: string;
    returnReason: string;
    returnStatus: string;
    userId?: string;
  };
}

export interface Notification {
  id: string;
  icon: NotificationCategory;
  title: string;
  description: string;
  relatedUser: string;
  timestamp: string;
  read: boolean;
  category: NotificationCategory;
  redirectLink?: string;
   /** Optional image name or URL associated with the notification */
   imageName?: string;
  targetRole?: TargetRole;
  /** Optional location targeting information for admin‑sent notifications */
  locationState?: string;
  locationCity?: string;
  locationPincode?: string;
  /** True when created by admin via "Create Notification" */
  sentByAdmin?: boolean;
  /** Type-specific details for drawer (withdraw / order / return) */
  payload?: NotificationPayload;
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    icon: "withdraw_request",
    title: "New withdrawal request",
    description: "Sarah Johnson requested a withdrawal of ₹3,000.",
    relatedUser: "Sarah Johnson",
    // Fixed timestamps to avoid SSR/CSR hydration mismatches
    timestamp: "2026-03-03T08:00:00.000Z",
    read: false,
    category: "withdraw_request",
    redirectLink: "/withdraw-requests",
    payload: {
      withdraw: {
        affiliateName: "Sarah Johnson",
        requestedAmount: 3000,
        walletBalance: 7250,
        bankUpiMasked: "Bank ****1234",
        fullBankDetails: "Bank Transfer - HDFC ****1234",
        withdrawalId: "wd-2",
        affiliateId: "aff-1001",
      },
    },
  },
  {
    id: "notif-2",
    icon: "new_orders",
    title: "Order placed",
    description: "Order #ORD-1042 has been placed by a customer.",
    relatedUser: "Riya Sharma",
    timestamp: "2026-03-02T15:00:00.000Z",
    read: false,
    category: "new_orders",
    redirectLink: "/orders",
    payload: {
      order: {
        orderId: "ORD-1042",
        customerName: "Riya Sharma",
        amount: 2499,
        paymentMethod: "UPI",
        userId: "user-1",
      },
    },
  },
  {
    id: "notif-3",
    icon: "system",
    title: "Return requested",
    description: "Return request for order #ORD-1038 has been submitted.",
    relatedUser: "Priya Mehta",
    timestamp: "2026-03-01T10:00:00.000Z",
    read: true,
    category: "system",
    redirectLink: "/users/user-2",
    payload: {
      return: {
        orderId: "ORD-1038",
        productName: "Beauty Serum 50ml",
        returnReason: "Product damaged on arrival",
        returnStatus: "Pending",
        userId: "user-2",
      },
    },
  },
  {
    id: "notif-4",
    icon: "system",
    title: "System maintenance",
    description: "Scheduled maintenance will occur tonight between 2–4 AM IST.",
    relatedUser: "System",
    timestamp: "2026-02-28T18:00:00.000Z",
    read: true,
    category: "system",
  },
  {
    id: "notif-5",
    icon: "withdraw_request",
    title: "Withdrawal approved",
    description: "Withdrawal wd-1 for Emma Williams has been processed.",
    relatedUser: "Emma Williams",
    timestamp: "2026-02-27T09:30:00.000Z",
    read: true,
    category: "withdraw_request",
    redirectLink: "/withdraw-requests",
    payload: {
      withdraw: {
        affiliateName: "Emma Williams",
        requestedAmount: 4000,
        walletBalance: 2450,
        bankUpiMasked: "UPI ****@upi",
        withdrawalId: "wd-3",
      },
    },
  },
];

export function generateNotificationId(): string {
  return (
    "notif-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}
