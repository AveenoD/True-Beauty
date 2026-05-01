"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Loader2 } from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth-context";

const NEAR_EXPIRY_DAYS = 7;

export function SubscriptionCard() {
  const { subscription, isReady, isLoggedIn } = useAdminAuth();

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

  const expiredByDate =
    !!subscription?.expiryDate && new Date(subscription.expiryDate) <= new Date();

  if (!isReady) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
        Loading plan…
      </span>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

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

  const isExpired =
    subscription.status === "expired" || subscription.status === "cancelled" || expiredByDate;
  const isNearExpiry = !isExpired && remainingDays <= NEAR_EXPIRY_DAYS;

  const badgeClass = isExpired
    ? "border-rose-200 bg-rose-50 text-rose-800"
    : isNearExpiry
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  const renewHref = `/subscription/checkout?mode=renew&planId=${subscription.plan.id}`;
  const maxLabel =
    subscription.plan.maxProducts == null
      ? "Unlimited products"
      : `Up to ${subscription.plan.maxProducts} products`;

  return (
    <div className="flex flex-wrap items-center min-w-0 justify-end sm:justify-end">
      <div
        className={`inline-flex min-w-0 items-center rounded-full border text-sm font-medium ${badgeClass}`}
      >
        <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2">
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="inline">{isExpired ? "Plan" : "Active"}:</span>
          <span className="font-semibold inline">{subscription.plan.name}</span>
          <span className="opacity-90 hidden sm:inline">·</span>
          <span className="hidden sm:inline text-xs font-normal opacity-90">{maxLabel}</span>
          {subscription.startDate ? (
            <>
              <span className="opacity-90 inline">·</span>
              <span className="inline text-xs font-normal">
                Since {formatDate(subscription.startDate)}
              </span>
            </>
          ) : null}
          <span className="opacity-90 inline">·</span>
          <span className="inline">
            {isExpired ? "Ended" : "Renews / ends"}{" "}
            {subscription.expiryDate ? formatDate(subscription.expiryDate) : "—"}
          </span>
        </span>

        {!isExpired ? (
          <Link
            href={renewHref}
            className="mx-2 inline-flex items-center whitespace-nowrap rounded-full bg-emerald-700/10 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-700/15 transition-colors"
          >
            Change / renew
          </Link>
        ) : (
          <Link
            href="/subscription"
            className="mx-2 inline-flex items-center whitespace-nowrap rounded-full bg-[#D96A86] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#C85A76] transition-colors"
          >
            Buy plan
          </Link>
        )}
      </div>
    </div>
  );
}
