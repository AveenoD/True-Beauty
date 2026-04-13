import type { Withdrawal } from "./affiliates-data";

export function maskBankOrUpi(method: string): string {
  if (!method || typeof method !== "string") return "—";
  const trimmed = method.trim();
  if (trimmed.includes("UPI")) {
    const afterDash = trimmed.split(" - ")[1] ?? trimmed;
    if (afterDash.includes("@")) {
      const [local, domain] = afterDash.split("@");
      const maskedLocal = local.length <= 2 ? "***" : local.slice(0, 2) + "****";
      return `UPI ${maskedLocal}@${domain}`;
    }
    return "UPI ****" + (afterDash.slice(-4) || "");
  }
  if (trimmed.includes("Bank") || trimmed.includes("****")) {
    const match = trimmed.match(/\*{4}\d{4}/);
    return match ? `Bank ****${match[0].slice(-4)}` : "Bank ****";
  }
  return "****" + trimmed.slice(-4);
}

export interface WithdrawRequestRow {
  requestId: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  availableWallet: number;
  bankUpiMasked: string;
  requestDate: string;
  status: Withdrawal["status"];
  withdrawal: Withdrawal;
}

export function flattenWithdrawals(
  affiliates: { id: string; name: string; walletBalance: number; withdrawals: Withdrawal[] }[]
): WithdrawRequestRow[] {
  const rows: WithdrawRequestRow[] = [];
  for (const aff of affiliates) {
    for (const w of aff.withdrawals) {
      rows.push({
        requestId: w.id,
        affiliateId: aff.id,
        affiliateName: aff.name,
        amount: w.amount,
        availableWallet: aff.walletBalance,
        bankUpiMasked: maskBankOrUpi(w.method),
        requestDate: w.requestedAt,
        status: w.status,
        withdrawal: w,
      });
    }
  }
  return rows.sort(
    (a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
  );
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
