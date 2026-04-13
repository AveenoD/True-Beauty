export type CouponDiscountType = "percentage" | "fixed";
export type CouponStatus = "active" | "disabled";

export const APPLICABLE_ROLES = ["all", "customers", "affiliate"] as const;
export type ApplicableRole = (typeof APPLICABLE_ROLES)[number];

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountCap: number | null;
  usageLimitTotal: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  applicableRole: ApplicableRole;
  applicableProductIds: string[];
  applicableCategoryIds: string[];
  startDate: string;
  expiryDate: string;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
}

const MOCK_COUPONS: Coupon[] = [
  {
    id: "coupon-1",
    code: "WELCOME20",
    discountType: "percentage",
    discountValue: 20,
    minOrderValue: 999,
    maxDiscountCap: 500,
    usageLimitTotal: 1000,
    usageLimitPerUser: 1,
    usedCount: 234,
    applicableRole: "customers",
    applicableProductIds: [],
    applicableCategoryIds: [],
    startDate: "2024-01-01T00:00:00Z",
    expiryDate: "2025-12-31T23:59:59Z",
    status: "active",
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "coupon-2",
    code: "FLAT100",
    discountType: "fixed",
    discountValue: 100,
    minOrderValue: 499,
    maxDiscountCap: null,
    usageLimitTotal: 500,
    usageLimitPerUser: 2,
    usedCount: 89,
    applicableRole: "all",
    applicableProductIds: ["prod-1", "prod-2"],
    applicableCategoryIds: ["Skincare"],
    startDate: "2024-06-01T00:00:00Z",
    expiryDate: "2024-08-31T23:59:59Z",
    status: "active",
    createdAt: "2024-05-15T10:00:00Z",
    updatedAt: "2024-05-15T10:00:00Z",
  },
  {
    id: "coupon-3",
    code: "AFF15",
    discountType: "percentage",
    discountValue: 15,
    minOrderValue: 0,
    maxDiscountCap: 300,
    usageLimitTotal: null,
    usageLimitPerUser: 5,
    usedCount: 12,
    applicableRole: "affiliate",
    applicableProductIds: [],
    applicableCategoryIds: [],
    startDate: "2024-03-01T00:00:00Z",
    expiryDate: "2024-09-30T23:59:59Z",
    status: "disabled",
    createdAt: "2024-02-20T10:00:00Z",
    updatedAt: "2024-08-01T10:00:00Z",
  },
];

export { MOCK_COUPONS };

export function generateCouponId(): string {
  return "coupon-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

export function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
