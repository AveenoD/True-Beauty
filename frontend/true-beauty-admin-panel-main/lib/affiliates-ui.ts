import type { AffiliateStatus, WithdrawalStatus } from "./affiliates-data";

export const AFFILIATE_STATUS_LABELS: Record<AffiliateStatus, string> = {
  active: "Active",
  blocked: "Blocked",
};

export const AFFILIATE_STATUS_CLASSES: Record<AffiliateStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  blocked: "bg-red-50 text-red-700",
};

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
};

export const WITHDRAWAL_STATUS_CLASSES: Record<WithdrawalStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  paid: "bg-blue-50 text-blue-700",
};

