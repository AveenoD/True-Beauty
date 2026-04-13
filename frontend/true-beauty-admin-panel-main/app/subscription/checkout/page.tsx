"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileText,
  ShieldCheck,
  ShoppingBasket,
  CreditCard,
  Check,
  Upload,
} from "lucide-react";
import {
  useSubscription,
  SUBSCRIPTION_ADDONS,
  type SubscriptionAddon,
  type SubscriptionPlanId,
} from "@/lib/subscription-context";

type StepId = "business" | "addons" | "documents" | "payment";

const ALL_STEPS: { id: StepId; label: string }[] = [
  { id: "business", label: "Subscription details" },
  { id: "addons", label: "Add-ons" },
  { id: "documents", label: "Documents" },
  { id: "payment", label: "Payment" },
];

export default function SubscriptionCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkout, initCheckout, saveBusinessDetails, setAddons, upsertDocument, purchasePlan, renewPlan, getPlanById } =
    useSubscription();

  const planIdFromQuery = searchParams.get("planId") as SubscriptionPlanId | null;
  const modeFromQuery = (searchParams.get("mode") as "buy" | "renew" | null) ?? null;

  useEffect(() => {
    if (!checkout && planIdFromQuery && modeFromQuery) {
      initCheckout(modeFromQuery, planIdFromQuery);
    }
  }, [checkout, planIdFromQuery, modeFromQuery, initCheckout]);

  const effectiveCheckout = checkout ?? null;

  const [activeStep, setActiveStep] = useState<StepId>("business");
  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const plan = effectiveCheckout?.planId
    ? getPlanById(effectiveCheckout.planId) ?? null
    : null;

  const steps = useMemo(() => ALL_STEPS, []);

  const [businessForm, setBusinessForm] = useState(() => ({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
    gstNumber: "",
  }));

  useEffect(() => {
    const details = effectiveCheckout?.businessDetails;
    if (!details) return;

    setBusinessForm((prev) => {
      if (
        prev.businessName === details.businessName &&
        prev.ownerName === details.ownerName &&
        prev.email === details.email &&
        prev.phone === details.phone &&
        prev.addressLine1 === details.addressLine1 &&
        prev.city === details.city &&
        prev.state === details.state &&
        prev.pincode === details.pincode &&
        prev.gstNumber === (details.gstNumber ?? "")
      ) {
        return prev;
      }

      return {
        businessName: details.businessName,
        ownerName: details.ownerName,
        email: details.email,
        phone: details.phone,
        addressLine1: details.addressLine1,
        city: details.city,
        state: details.state,
        pincode: details.pincode,
        gstNumber: details.gstNumber ?? "",
      };
    });
  }, [effectiveCheckout?.businessDetails]);

  const [selectedAddons, setSelectedAddonsState] = useState<
    SubscriptionAddon["id"][]
  >(() => effectiveCheckout?.addons ?? []);

  const existingDocuments = effectiveCheckout?.documents ?? [];

  const handleBusinessNext = () => {
    saveBusinessDetails({
      ...businessForm,
      gstNumber: businessForm.gstNumber || undefined,
    });
    setActiveStep("addons");
  };

  const handleToggleAddon = (id: SubscriptionAddon["id"]) => {
    setSelectedAddonsState((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      setAddons(next);
      return next;
    });
  };

  const handleUploadDocument = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "gst" | "pan" | "other",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    upsertDocument({
      type,
      fileName: file.name,
      verified: true,
    });
  };

  const goToPayment = () => {
    setActiveStep("payment");
  };

  const handlePayNow = async () => {
    if (!effectiveCheckout || !effectiveCheckout.planId) return;
    setIsPaying(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (effectiveCheckout.mode === "renew") {
        renewPlan(effectiveCheckout.planId);
      } else {
        purchasePlan(effectiveCheckout.planId);
      }
      setPaid(true);
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } finally {
      setIsPaying(false);
    }
  };

  if (!effectiveCheckout || !plan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href="/subscription"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to plans
          </Link>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Plan selection not found. Please choose a subscription plan again.
        </div>
      </div>
    );
  }

  const baseAmount = plan.price;
  const addonsTotal = selectedAddons.reduce((sum, addonId) => {
    const addon = SUBSCRIPTION_ADDONS.find((a) => a.id === addonId);
    return sum + (addon?.price ?? 0);
  }, 0);
  const grandTotal = baseAmount + addonsTotal;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/subscription"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to subscription</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <div className="flex-1 text-center sm:text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            {effectiveCheckout.mode === "renew"
              ? "Renew subscription"
              : "Buy subscription"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Complete these quick steps to{" "}
            {effectiveCheckout.mode === "renew" ? "renew" : "activate"} your plan.
          </p>
        </div>
        <div className="shrink-0">
          <div className="inline-flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-left">
            <div className="mr-3 rounded-xl bg-gray-100 p-2 text-gray-600">
              <ShoppingBasket className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Selected plan</p>
              <p className="text-sm font-semibold text-gray-900">
                {plan.name} · ₹{baseAmount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3 space-y-4">
          <ol className="flex flex-wrap gap-2 rounded-2xl bg-gray-50 p-3 text-xs sm:text-sm">
            {steps.map((step, index) => {
              const isActive = activeStep === step.id;
              const stepIndex = steps.findIndex((s) => s.id === activeStep);
              const isCompleted = index < stepIndex;
              return (
                <li key={step.id} className="flex-1 min-w-[120px]">
                  <button
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : isCompleted
                          ? "text-gray-800 hover:bg-white/60"
                          : "text-gray-500 hover:bg-white/40"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : isActive
                            ? "bg-[#D96A86] text-white"
                            : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                    </span>
                    <span>{step.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {activeStep === "business" && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  Subscribe to {plan.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Complete your subscription details.{" "}
                  {effectiveCheckout.mode === "renew" && effectiveCheckout.businessDetails
                    ? "We’ve loaded your saved details. You can still edit them."
                    : "These details help us personalise your admin experience."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Full Name<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={businessForm.ownerName}
                    onChange={(e) =>
                      setBusinessForm((prev) => ({
                        ...prev,
                        ownerName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Email Address<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={businessForm.email}
                    onChange={(e) =>
                      setBusinessForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Phone Number<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={businessForm.phone}
                    onChange={(e) =>
                      setBusinessForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Company Name<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your company name"
                    value={businessForm.businessName}
                    onChange={(e) =>
                      setBusinessForm((prev) => ({
                        ...prev,
                        businessName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Website (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://yourwebsite.com"
                    value={businessForm.addressLine1}
                    onChange={(e) =>
                      setBusinessForm((prev) => ({
                        ...prev,
                        addressLine1: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Business Type
                  </label>
                  <input
                    type="text"
                    placeholder="Select business type"
                    value={businessForm.city}
                    onChange={(e) =>
                      setBusinessForm((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Team Size
                  </label>
                  <input
                    type="text"
                    placeholder="Select team size"
                    value={businessForm.state}
                    onChange={(e) =>
                      setBusinessForm((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Preferred Start Date
                  </label>
                  <input
                    type="date"
                    placeholder="dd-mm-yyyy"
                    value={businessForm.pincode}
                    onChange={(e) =>
                      setBusinessForm((prev) => ({
                        ...prev,
                        pincode: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleBusinessNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D96A86] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#C85A76]"
                >
                  Continue to Add-ons
                </button>
              </div>
            </section>
          )}

          {activeStep === "addons" && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-xl bg-[#fef5f7] p-2 text-[#D96A86]">
                  <ShoppingBasket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Add-ons</h2>
                  <p className="text-xs text-gray-500">
                    Enhance your plan with optional features. You can change these
                    anytime on renewal.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUBSCRIPTION_ADDONS.map((addon) => {
                  const selected = selectedAddons.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => handleToggleAddon(addon.id)}
                      className={`text-left rounded-2xl border p-4 text-sm transition-all ${
                        selected
                          ? "border-[#D96A86] bg-[#fef5f7]"
                          : "border-gray-100 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="font-semibold text-gray-900">{addon.name}</p>
                        {selected && (
                          <span className="inline-flex items-center rounded-full bg-[#D96A86] px-2 py-0.5 text-[11px] font-medium text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{addon.description}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{addon.price.toLocaleString("en-IN")}/month
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep("business")}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep("documents")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D96A86] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#C85A76]"
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {activeStep === "documents" && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-xl bg-[#fef5f7] p-2 text-[#D96A86]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Business documents
                  </h2>
                  <p className="text-xs text-gray-500">
                    Upload GST / PAN or other documents. For renewals, your
                    previously verified documents are already attached.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {["gst", "pan", "other"].map((type) => {
                  const doc = existingDocuments.find((d) => d.type === type);
                  const label =
                    type === "gst"
                      ? "GST certificate"
                      : type === "pan"
                        ? "PAN card"
                        : "Other document";
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="rounded-lg bg-white p-2 text-gray-500">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {label}
                          </p>
                          {doc ? (
                            <p className="text-xs text-emerald-700 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              {doc.fileName} · Verified
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">
                              Upload a clear, readable copy.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <label className="inline-flex cursor-pointer items-center rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm hover:bg-gray-100">
                          <span>{doc ? "Replace" : "Upload"}</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) =>
                              handleUploadDocument(
                                e,
                                type as "gst" | "pan" | "other",
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep("addons")}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goToPayment}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D96A86] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#C85A76]"
                >
                  Continue to payment
                </button>
              </div>
            </section>
          )}

          {activeStep === "payment" && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-xl bg-[#fef5f7] p-2 text-[#D96A86]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Payment</h2>
                  <p className="text-xs text-gray-500">
                    Review your plan and confirm payment. For now, this is a test
                    payment and no real charge is made.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Plan summary
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {plan.name} · ₹{baseAmount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-500">30 days validity</p>
                  {selectedAddons.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 mt-2 space-y-1">
                      <p className="text-xs font-semibold text-gray-700">
                        Add-ons ({selectedAddons.length})
                      </p>
                      {selectedAddons.map((id) => {
                        const addon = SUBSCRIPTION_ADDONS.find((a) => a.id === id);
                        if (!addon) return null;
                        return (
                          <p
                            key={addon.id}
                            className="flex items-center justify-between text-xs text-gray-700"
                          >
                            <span>{addon.name}</span>
                            <span>
                              ₹{addon.price.toLocaleString("en-IN")}/month
                            </span>
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Billing details
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {businessForm.businessName || "Business name"}
                  </p>
                  <p className="text-xs text-gray-600">
                    {businessForm.ownerName || "Owner name"}
                  </p>
                  <p className="text-xs text-gray-600">
                    {businessForm.addressLine1 || "Address line"}
                  </p>
                  <p className="text-xs text-gray-600">
                    {[businessForm.city, businessForm.state, businessForm.pincode]
                      .filter(Boolean)
                      .join(", ") || "City, State, Pincode"}
                  </p>
                  <p className="text-xs text-gray-600">
                    {businessForm.email || "email@example.com"} ·{" "}
                    {businessForm.phone || "Phone number"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      100% secure test payment for development
                    </p>
                    <p>
                      In production, integrate your preferred payment gateway
                      (Razorpay, Stripe, etc.) here.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep("documents")}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Back
                </button>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Payable today</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePayNow}
                    disabled={isPaying || paid}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#D96A86] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#C85A76] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <CreditCard className="w-4 h-4" />
                    {paid ? "Payment successful" : isPaying ? "Processing..." : "Pay now"}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="lg:w-1/3 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#fef5f7] p-2 text-[#D96A86]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {effectiveCheckout.mode === "renew"
                    ? "Renewal summary"
                    : "New subscription summary"}
                </p>
                <p className="text-xs text-gray-500">
                  Review your selection before payment.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Base plan</span>
                <span className="font-medium text-gray-900">
                  ₹{baseAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Add-ons{" "}
                  {selectedAddons.length > 0 && `(${selectedAddons.length})`}
                </span>
                <span className="font-medium text-gray-900">
                  ₹{addonsTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2 mt-1">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Total payable
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {effectiveCheckout.mode === "renew" && effectiveCheckout.businessDetails && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Smart renewal
                </p>
                <p className="text-xs text-gray-600">
                  We’ve pre-filled your saved business details and documents so you
                  can renew in just a few clicks.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
