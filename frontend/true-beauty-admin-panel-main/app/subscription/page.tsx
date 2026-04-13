"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CreditCard, ArrowLeft } from "lucide-react";
import {
  useSubscription,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from "@/lib/subscription-context";

export default function SubscriptionPage() {
  const router = useRouter();
  const { subscription, remainingDays } = useSubscription();
  const [selectedPlanId, setSelectedPlanId] =
    useState<SubscriptionPlanId | null>(null);
  const [purchased, setPurchased] = useState(false);

  const isExpired = subscription?.status === "expired";
  const isNearExpiry = subscription && remainingDays <= 7 && !isExpired;

  const handleSelectPlan = (planId: SubscriptionPlanId) => {
    setSelectedPlanId(planId);
    const isFirstTime = !subscription || subscription.status === "expired";
    const mode = isFirstTime ? "buy" : "renew";
    router.push(`/subscription/checkout?mode=${mode}&planId=${planId}`);
    setPurchased(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Subscription Plans</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Choose a plan to{" "}
          {subscription && !isExpired ? "switch or renew" : "activate for the first time"}
          . Your plan is valid for 30 days.
        </p>
      </div>

      {purchased && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
          <div className="p-2 rounded-full bg-emerald-100">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-emerald-800">Plan activated</p>
            <p className="text-sm text-emerald-700">
              Your subscription has been updated. You can go back to the dashboard
              to see your current plan.
            </p>
          </div>
          <Link
            href="/"
            className="ml-auto shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Go to Dashboard
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent =
            subscription?.planId === plan.id &&
            subscription?.status === "active";
          const isSelected = selectedPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={`
                relative bg-white rounded-2xl p-6 shadow-sm border-2 transition-all
                ${
                  isCurrent
                    ? "border-[#D96A86] bg-[#fef5f7]/50"
                    : isSelected
                      ? "border-[#D96A86]"
                      : "border-gray-100 hover:border-gray-200"
                }
              `}
            >
              {isCurrent && (
                <span className="absolute top-4 right-4 inline-flex items-center rounded-full bg-[#D96A86] px-2.5 py-0.5 text-xs font-medium text-white">
                  Current
                </span>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gray-100 text-gray-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {plan.name}
                  </h2>
                  <p className="text-2xl font-semibold text-gray-900">
                    {plan.priceLabel}
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  30 days validity
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Full admin access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Support included
                </li>
              </ul>
              <button
                type="button"
                onClick={() => handleSelectPlan(plan.id)}
                className="w-full inline-flex items-center justify-center rounded-xl bg-[#D96A86] px-4 py-3 text-sm font-medium text-white hover:bg-[#C85A76] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#D96A86] focus-visible:ring-offset-2"
              >
                {subscription?.status === "expired" || !subscription
                  ? "Buy Plan"
                  : "Renew / Switch"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
