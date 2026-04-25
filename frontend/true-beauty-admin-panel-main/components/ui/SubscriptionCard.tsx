"use client";

import React from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth-context";

const NEAR_EXPIRY_DAYS = 7;

export function SubscriptionCard() {
  const { subscription } = useAdminAuth();

  const remainingDays = React.useMemo(() => {
    if (!subscription?.expiryDate) return 0;
    const expiry = new Date(subscription.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diff = expiry.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [subscription?.expiryDate]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (!subscription || !subscription.plan) {
    return (
      <Link
        href="/subscription"
        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
      >
        No plan · Buy Plan
      </Link>
    );
  }

  const isExpired = subscription.status === "expired";
  const isNearExpiry = !isExpired && remainingDays <= NEAR_EXPIRY_DAYS;

  const badgeClass = isExpired
    ? "border-rose-200 bg-rose-50 text-rose-800"
    : isNearExpiry
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  const renewHref = `/subscription/checkout?mode=renew&planId=${subscription.plan.id}`;

  return (
    <div className="flex flex-wrap items-center gap-2 min-w-0 justify-end sm:justify-end">
      <span
        className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border px-4 py-2 text-sm font-medium ${badgeClass}`}
      >
        <Calendar className="w-4 h-4 shrink-0" />
        <span className="inline">Your current plan is</span>
        <span className="font-semibold inline">{subscription.plan.name}</span>
        <span className="opacity-90 inline">·</span>
        <span className="inline">
          Expires{" "}
          {subscription.expiryDate ? formatDate(subscription.expiryDate) : "—"}
        </span>
      </span>
      <Link
        href={renewHref}
        className="inline-flex items-center rounded-full bg-[#D96A86] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#C85A76]"
      >
        Renew Plan
      </Link>
    </div>
  );
}
