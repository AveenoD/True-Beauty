export type AffiliateStatus = "active" | "blocked";

export type CommissionLogType = "order_commission" | "manual_adjustment" | "withdrawal";

export interface CommissionLog {
  id: string;
  date: string;
  type: CommissionLogType;
  description: string;
  amount: number;
  orderId?: string;
}

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

export interface WithdrawalAuditEvent {
  date: string;
  action: "approved" | "rejected" | "marked_paid";
  notes?: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  requestedAt: string;
  processedAt?: string;
  paidAt?: string;
  status: WithdrawalStatus;
  notes?: string;
  auditEvents?: WithdrawalAuditEvent[];
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
}

export interface ReferredUser {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
}

export interface ReferredOrder {
  id: string;
  productName: string;
  productImage: string;
  category: string;
  quantity: number;
  orderedAt: string;
  amount: number;
}

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  totalReferrals: number;
  totalOrders: number;
  totalCommission: number;
  walletBalance: number;
  commissionRate: number;
  status: AffiliateStatus;
  joinedAt: string;
  lastActiveAt?: string;
  commissionLogs: CommissionLog[];
  withdrawals: Withdrawal[];
  /** Optional list of users who registered via this affiliate. */
  referredUsers?: ReferredUser[];
  /** Optional list of orders placed via this affiliate's referral links. */
  referredOrders?: ReferredOrder[];
}

export const MOCK_AFFILIATES: Affiliate[] = [
  {
    id: "aff-1001",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "+91 98765 01010",
    referralCode: "SARAH10",
    totalReferrals: 42,
    totalOrders: 31,
    totalCommission: 18450,
    walletBalance: 7250,
    commissionRate: 10,
    status: "active",
    joinedAt: "2024-01-10T09:15:00Z",
    lastActiveAt: "2024-06-16T11:30:00Z",
    commissionLogs: [
      {
        id: "log-1",
        date: "2024-06-15T10:30:00Z",
        type: "order_commission",
        description: "Commission from order ORD-1001",
        amount: 450,
        orderId: "ORD-1001",
      },
      {
        id: "log-2",
        date: "2024-06-14T15:20:00Z",
        type: "order_commission",
        description: "Commission from order ORD-1003",
        amount: 320,
        orderId: "ORD-1003",
      },
      {
        id: "log-3",
        date: "2024-06-10T09:00:00Z",
        type: "manual_adjustment",
        description: "Manual bonus added by admin",
        amount: 1000,
      },
    ],
    withdrawals: [
      {
        id: "wd-1",
        amount: 5000,
        method: "UPI - sarah@upi",
        requestedAt: "2024-06-01T08:00:00Z",
        processedAt: "2024-06-02T10:00:00Z",
        status: "approved",
        notes: "Monthly payout",
        upiId: "sarah@upi",
      },
      {
        id: "wd-2",
        amount: 3000,
        method: "Bank Transfer - HDFC ****1234",
        requestedAt: "2024-06-12T14:30:00Z",
        status: "pending",
        bankName: "HDFC Bank",
        accountNumber: "123456789012",
        ifsc: "HDFC0001234",
      },
    ],
    referredUsers: Array.from({ length: 42 }, (_, index) => ({
      id: `sarah-ref-${index + 1}`,
      name: `Sarah Referral ${index + 1}`,
      email: `sarah.ref${index + 1}@example.com`,
      registeredAt: new Date(
        Date.UTC(2024, 0, 10 + Math.min(index, 25))
      ).toISOString(),
    })),
    referredOrders: Array.from({ length: 31 }, (_, index) => {
      const productIndex = (index % 6) + 1;
      const category =
        productIndex <= 2
          ? "Skin Care"
          : productIndex <= 4
          ? "Hair Care"
          : "Makeup";
      const quantity = (index % 3) + 1;
      const unitPrice = 499 + (index % 5) * 150;
      return {
        id: `sarah-ord-${index + 1}`,
        productName: `Beauty Product ${productIndex.toString().padStart(2, "0")}`,
        productImage: `https://picsum.photos/seed/sarah-prod-${productIndex}/80/80`,
        category,
        quantity,
        orderedAt: new Date(
          Date.UTC(2024, 0, 12 + Math.min(index, 28))
        ).toISOString(),
        amount: unitPrice * quantity,
      };
    }),
  },
  {
    id: "aff-1002",
    name: "Emma Williams",
    email: "emma.w@example.com",
    phone: "+91 98765 01020",
    referralCode: "EMMA15",
    totalReferrals: 18,
    totalOrders: 12,
    totalCommission: 8450,
    walletBalance: 2450,
    commissionRate: 12,
    status: "active",
    joinedAt: "2024-02-18T12:00:00Z",
    lastActiveAt: "2024-06-14T17:10:00Z",
    commissionLogs: [
      {
        id: "log-4",
        date: "2024-06-13T16:45:00Z",
        type: "order_commission",
        description: "Commission from order ORD-1002",
        amount: 260,
        orderId: "ORD-1002",
      },
      {
        id: "log-5",
        date: "2024-05-30T11:20:00Z",
        type: "manual_adjustment",
        description: "Correction for previous payout",
        amount: -150,
      },
    ],
    withdrawals: [
      {
        id: "wd-3",
        amount: 4000,
        method: "UPI - emma@upi",
        requestedAt: "2024-05-25T09:15:00Z",
        processedAt: "2024-05-26T11:45:00Z",
        status: "approved",
        upiId: "emma@upi",
      },
      {
        id: "wd-4",
        amount: 1500,
        method: "Bank Transfer - SBI ****9876",
        requestedAt: "2024-06-10T13:00:00Z",
        processedAt: "2024-06-11T10:30:00Z",
        status: "rejected",
        notes: "Invalid bank details",
        bankName: "State Bank of India",
        accountNumber: "987654321000",
        ifsc: "SBIN0009876",
      },
    ],
    referredUsers: Array.from({ length: 18 }, (_, index) => ({
      id: `emma-ref-${index + 1}`,
      name: `Emma Referral ${index + 1}`,
      email: `emma.ref${index + 1}@example.com`,
      registeredAt: new Date(
        Date.UTC(2024, 1, 18 + Math.min(index, 20))
      ).toISOString(),
    })),
    referredOrders: Array.from({ length: 12 }, (_, index) => {
      const productIndex = (index % 4) + 1;
      const category = "Skin Care";
      const quantity = (index % 2) + 1;
      const unitPrice = 799 + (index % 3) * 200;
      return {
        id: `emma-ord-${index + 1}`,
        productName: `Skin Care Combo ${productIndex.toString().padStart(2, "0")}`,
        productImage: `https://picsum.photos/seed/emma-prod-${productIndex}/80/80`,
        category,
        quantity,
        orderedAt: new Date(
          Date.UTC(2024, 1, 20 + Math.min(index, 15))
        ).toISOString(),
        amount: unitPrice * quantity,
      };
    }),
  },
  {
    id: "aff-1003",
    name: "Olivia Brown",
    email: "olivia.b@example.com",
    phone: "+91 98765 01030",
    referralCode: "OLIVIA5",
    totalReferrals: 5,
    totalOrders: 3,
    totalCommission: 1650,
    walletBalance: 1650,
    commissionRate: 8,
    status: "blocked",
    joinedAt: "2024-03-05T10:30:00Z",
    lastActiveAt: "2024-04-20T16:00:00Z",
    commissionLogs: [
      {
        id: "log-6",
        date: "2024-04-18T11:00:00Z",
        type: "order_commission",
        description: "Commission from order ORD-1004",
        amount: 300,
        orderId: "ORD-1004",
      },
    ],
    withdrawals: [],
    referredUsers: Array.from({ length: 5 }, (_, index) => ({
      id: `olivia-ref-${index + 1}`,
      name: `Olivia Referral ${index + 1}`,
      email: `olivia.ref${index + 1}@example.com`,
      registeredAt: new Date(
        Date.UTC(2024, 2, 5 + Math.min(index, 10))
      ).toISOString(),
    })),
    referredOrders: Array.from({ length: 3 }, (_, index) => {
      const productIndex = index + 1;
      const category = "Hair Care";
      const quantity = 1 + index;
      const unitPrice = 649 + index * 100;
      return {
        id: `olivia-ord-${index + 1}`,
        productName: `Hair Care Kit ${productIndex}`,
        productImage: `https://picsum.photos/seed/olivia-prod-${productIndex}/80/80`,
        category,
        quantity,
        orderedAt: new Date(
          Date.UTC(2024, 2, 10 + Math.min(index, 5))
        ).toISOString(),
        amount: unitPrice * quantity,
      };
    }),
  },
];

export function generateAffiliateId(): string {
  return (
    "aff-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

