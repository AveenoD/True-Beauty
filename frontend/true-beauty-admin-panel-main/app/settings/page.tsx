"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Store,
  CreditCard,
  ShoppingCart,
  Bell,
  Shield,
  Save,
  ArrowLeft,
} from "lucide-react";

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-600" />
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors ${
          checked ? "bg-[#D96A86] border-[#D96A86]" : "bg-gray-200 border-gray-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
          style={{ marginTop: 2 }}
        />
      </button>
    </div>
  );
}

function FieldRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3 first:pt-0 border-b border-gray-100 last:border-0">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const [storeName, setStoreName] = useState("True Beauty");
  const [storeTagline, setStoreTagline] = useState("Premium beauty products & services");
  const [supportEmail, setSupportEmail] = useState("support@truebeauty.com");
  const [supportPhone, setSupportPhone] = useState("+91 98765 43210");

  const [codEnabled, setCodEnabled] = useState(true);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);
  const [paymentGateway, setPaymentGateway] = useState("Razorpay");

  const [autoConfirmOrders, setAutoConfirmOrders] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [orderValidityDays, setOrderValidityDays] = useState("7");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState("30");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to dashboard</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <div className="flex-1 text-center sm:text-center">
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage store, payment, orders, notifications and security
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex w-full justify-center sm:w-auto items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D96A86] text-white font-medium hover:bg-[#C85A76] transition-colors"
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved" : "Save changes"}
        </button>
      </div>

      <SettingsSection icon={Store} title="Store Settings">
        <div className="space-y-1">
          <FieldRow label="Store name" description="Display name of your store">
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
            />
          </FieldRow>
          <FieldRow label="Tagline">
            <input
              type="text"
              value={storeTagline}
              onChange={(e) => setStoreTagline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
            />
          </FieldRow>
          <FieldRow label="Support email">
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
            />
          </FieldRow>
          <FieldRow label="Support phone">
            <input
              type="tel"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
            />
          </FieldRow>
        </div>
      </SettingsSection>

      <SettingsSection icon={CreditCard} title="Payment Settings">
        <div className="space-y-1">
          <ToggleRow
            label="Cash on delivery (COD)"
            description="Accept COD for orders"
            checked={codEnabled}
            onToggle={() => setCodEnabled((v) => !v)}
          />
          <ToggleRow
            label="Online payment"
            description="Accept card, UPI, wallet"
            checked={onlinePaymentEnabled}
            onToggle={() => setOnlinePaymentEnabled((v) => !v)}
          />
          <FieldRow label="Payment gateway" description="Primary gateway name">
            <input
              type="text"
              value={paymentGateway}
              onChange={(e) => setPaymentGateway(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
            />
          </FieldRow>
        </div>
      </SettingsSection>

      <SettingsSection icon={ShoppingCart} title="Order Settings">
        <div className="space-y-1">
          <ToggleRow
            label="Auto-confirm orders"
            description="New orders are confirmed automatically"
            checked={autoConfirmOrders}
            onToggle={() => setAutoConfirmOrders((v) => !v)}
          />
          <FieldRow label="Low stock threshold" description="Alert when stock falls below">
            <input
              type="number"
              min="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
            />
          </FieldRow>
          <FieldRow label="Order validity (days)" description="Default validity for orders">
            <input
              type="number"
              min="1"
              value={orderValidityDays}
              onChange={(e) => setOrderValidityDays(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
            />
          </FieldRow>
        </div>
      </SettingsSection>

      <SettingsSection icon={Bell} title="Notification Settings">
        <div className="space-y-1">
          <ToggleRow
            label="Email notifications"
            description="Receive admin notifications by email"
            checked={emailNotifications}
            onToggle={() => setEmailNotifications((v) => !v)}
          />
          <ToggleRow
            label="Order alerts"
            description="Notify on new or updated orders"
            checked={orderAlerts}
            onToggle={() => setOrderAlerts((v) => !v)}
          />
          <ToggleRow
            label="Marketing emails"
            description="Product updates and promotions"
            checked={marketingEmails}
            onToggle={() => setMarketingEmails((v) => !v)}
          />
        </div>
      </SettingsSection>

      <SettingsSection icon={Shield} title="Security Settings">
        <div className="space-y-1">
          <ToggleRow
            label="Two-factor authentication"
            description="Require 2FA for admin login"
            checked={twoFactorEnabled}
            onToggle={() => setTwoFactorEnabled((v) => !v)}
          />
          <FieldRow
            label="Session timeout (minutes)"
            description="Auto logout after inactivity"
          >
            <input
              type="number"
              min="5"
              value={sessionTimeoutMinutes}
              onChange={(e) => setSessionTimeoutMinutes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
            />
          </FieldRow>
        </div>
      </SettingsSection>
    </div>
  );
}
