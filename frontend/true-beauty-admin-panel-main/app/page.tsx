"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAffiliates } from "@/lib/affiliates-context";
import { KpiCard } from "@/components/ui/kpiCard";
import { SalesAnalyticsChart } from "@/components/charts/SalesAnalyticsChart";
import { GeographyChart } from "@/components/charts/GeographyChart";
import { SubscriptionCard } from "@/components/ui/SubscriptionCard";

const RANGE_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
] as const;

type RangeId = (typeof RANGE_OPTIONS)[number]["id"];

export default function Home() {
  const [activeRange, setActiveRange] = useState<RangeId>("today");
  const { affiliates } = useAffiliates();

  const totalWithdrawalAmount = useMemo(() => {
    return affiliates.reduce((sum, aff) => {
      const affSum = aff.withdrawals.reduce((s, w) => s + w.amount, 0);
      return sum + affSum;
    }, 0);
  }, [affiliates]);

  const stats = [
    {
      title: "Total Users",
      value: "12,543",
      change: "+12.5%",
      icon: "users" as const,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Orders",
      value: "3,421",
      change: "+8.2%",
      icon: "shopping-cart" as const,
      iconClassName: "bg-green-50 text-green-600",
    },
    {
      title: "Revenue",
      value: new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(45231),
      change: "+15.3%",
      icon: "indian-rupee" as const,
      iconClassName: "bg-purple-50 text-purple-600",
    },
   
    {
      title: "Total Affiliate Users",
      value: "1,245",
      change: "+6.1% vs last month",
      icon: "user-check" as const,
      iconClassName: "bg-sky-50 text-sky-600",
    },
    {
      title: "Total Withdrawal Requests",
      value: "22",
      change: "Pending + processed today",
      icon: "wallet" as const,
      iconClassName: "bg-rose-50 text-rose-600",
    },
    {
      title: "All Affiliate Withdrawal Amount",
      value: new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(totalWithdrawalAmount),
      change: "All affiliates",
      icon: "wallet" as const,
      iconClassName: "bg-orange-50 text-orange-600",
    },
  ];

  const salesData: Record<
    RangeId,
    { label: string; value: number; productName?: string }[]
  > = {
    today: [
      {
        label: "9 AM",
        value: 4200,
        productName: "Ultimate Glow Skincare Kit",
      },
      {
        label: "12 PM",
        value: 6800,
        productName: "Daily Sunscreen SPF 50",
      },
      {
        label: "3 PM",
        value: 5400,
        productName: "Hair Repair Oil",
      },
      {
        label: "6 PM",
        value: 9100,
        productName: "Vitamin C Serum 30ml",
      },
      {
        label: "9 PM",
        value: 7300,
        productName: "Hydrating Face Mist",
      },
    ],
    week: [
      {
        label: "Mon",
        value: 24500,
        productName: "Ultimate Glow Skincare Kit",
      },
      {
        label: "Tue",
        value: 27800,
        productName: "Daily Sunscreen SPF 50",
      },
      {
        label: "Wed",
        value: 31200,
        productName: "Hair Repair Oil",
      },
      {
        label: "Thu",
        value: 29800,
        productName: "Under Eye Cream",
      },
      {
        label: "Fri",
        value: 35600,
        productName: "Matte Lipstick - Rose",
      },
      {
        label: "Sat",
        value: 38200,
        productName: "Ultimate Glow Skincare Kit",
      },
      {
        label: "Sun",
        value: 27100,
        productName: "Daily Sunscreen SPF 50",
      },
    ],
    month: [
      {
        label: "Week 1",
        value: 81200,
        productName: "Ultimate Glow Skincare Kit",
      },
      {
        label: "Week 2",
        value: 95600,
        productName: "Daily Sunscreen SPF 50",
      },
      {
        label: "Week 3",
        value: 102300,
        productName: "Hair Repair Oil",
      },
      {
        label: "Week 4",
        value: 89400,
        productName: "Vitamin C Serum 30ml",
      },
    ],
  };

  const orderStatus = [
    { label: "Pending", count: 32, chipClassName: "bg-amber-50 text-amber-700", barClassName: "bg-amber-400" },
    { label: "Shipped", count: 58, chipClassName: "bg-blue-50 text-blue-700", barClassName: "bg-blue-500" },
    { label: "Delivered", count: 184, chipClassName: "bg-emerald-50 text-emerald-700", barClassName: "bg-emerald-500" },
    { label: "Refunds", count: 6, chipClassName: "bg-rose-50 text-rose-700", barClassName: "bg-rose-400" },
  ];

  const lowStockProducts = [
    { name: "Vitamin C Serum 30ml", stock: 4, threshold: 10 },
    { name: "Hydrating Face Mist", stock: 7, threshold: 15 },
    { name: "Matte Lipstick - Rose", stock: 3, threshold: 12 },
    { name: "Under Eye Cream", stock: 5, threshold: 10 },
  ];

  const topProducts = [
    { name: "Ultimate Glow Skincare Kit", orders: 342, revenue: "₹2,34,560" },
    { name: "Daily Sunscreen SPF 50", orders: 289, revenue: "₹1,72,430" },
    { name: "Hair Repair Oil", orders: 214, revenue: "₹1,05,120" },
  ];

  const topAffiliates = [
    { name: "GlowWithZoya", orders: 128, revenue: "₹84,320" },
    { name: "BeautyByAnanya", orders: 96, revenue: "₹63,450" },
    { name: "SkincareWithRahul", orders: 74, revenue: "₹51,980" },
  ];

  const activeSalesData = salesData[activeRange];

  const maxSalesValue = useMemo(
    () => Math.max(...activeSalesData.map((point) => point.value)),
    [activeSalesData],
  );

  const activeRangeLabel =
    RANGE_OPTIONS.find((range) => range.id === activeRange)?.label ?? "";

  const totalOrderStatusCount = orderStatus.reduce(
    (total, status) => total + status.count,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Dashboard header + subscription badge (right aligned) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
        <h1 className="text-xl font-semibold text-gray-900 shrink-0">Dashboard</h1>
        <div className="w-full sm:w-auto min-w-0 flex justify-end sm:justify-end">
          <SubscriptionCard />
        </div>
      </div>

      {/* KPI Cards — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
        {stats.map((stat, index) => (
          <KpiCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconClassName={stat.iconClassName}
            helperText={stat.change}
            className="min-w-[260px] md:min-w-0 shrink-0 md:shrink"
          />
        ))}
      </div>

      {/* Order Status — full width below KPIs */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Order Status
          </h2>
          <p className="text-sm text-gray-500">
            {totalOrderStatusCount.toLocaleString("en-IN")} total orders
          </p>
        </div>

        <div className="mt-4 space-y-4">
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden flex">
            {orderStatus.map((status) => (
              <div
                key={status.label}
                className={status.barClassName}
                style={{
                  width: `${
                    (status.count / totalOrderStatusCount) * 100
                  }%`,
                }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {orderStatus.map((status) => (
              <div key={status.label} className="space-y-1">
                <p className="text-xs text-gray-500">{status.label}</p>
                <div className="flex items-center gap-2 md:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {status.count.toLocaleString("en-IN")}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium md:mt-1 ${status.chipClassName}`}
                  >
                    {Math.round(
                      (status.count / totalOrderStatusCount) * 100,
                    )}
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics & order overview */}
        <div className="space-y-6 lg:col-span-2">
          {/* Sales Analytics */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Sales Analytics
                </h2>
                <p className="text-sm text-gray-500">
                  Performance overview for {activeRangeLabel.toLowerCase()}
                </p>
              </div>
              <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs sm:text-sm self-start sm:self-auto">
                {RANGE_OPTIONS.map((range) => {
                  const isActive = activeRange === range.id;
                  return (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => setActiveRange(range.id)}
                      className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                        isActive
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 space-y-6">
              <div className="flex flex-wrap items-baseline gap-4">
                <p className="text-2xl font-semibold text-gray-900">
                  ₹
                  {activeSalesData
                    .reduce((total, item) => total + item.value, 0)
                    .toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-gray-500">
                  Total sales ({activeRangeLabel.toLowerCase()})
                </p>
              </div>

              <SalesAnalyticsChart
                data={activeSalesData}
                xAxisLabel=""
                yAxisLabel=""
                currency="INR"
              />

              <div className="mt-2 border-t border-gray-100 pt-3">
                <div className="flex flex-col gap-2">
                  {activeSalesData.slice(0, 5).map((point, index) => (
                    <div
                      key={point.label}
                      className="flex items-center justify-between text-xs text-gray-600"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 w-5 text-gray-500 font-medium">
                          {index + 1}.
                        </span>
                        <p className="truncate font-medium text-gray-800">
                          {point.productName ?? "Product"}
                        </p>
                      </div>
                      <p className="ml-3 shrink-0 font-semibold text-gray-900">
                        ₹{point.value.toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sales by Geography */}
          <GeographyChart />
        </div>

        {/* Inventory, products, affiliates, quick actions & activity */}
        <div className="space-y-6">
          {/* Low stock alerts */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Low Stock Alerts
              </h2>
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                {lowStockProducts.length} items
              </span>
            </div>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between gap-3 rounded-xl bg-amber-50/60 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.stock} in stock • Min {product.threshold}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    Restock
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top selling products */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Top Selling Products
            </h2>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.orders.toLocaleString("en-IN")} orders
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {product.revenue}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top affiliates */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Top Affiliates
            </h2>
            <div className="space-y-3">
              {topAffiliates.map((affiliate) => (
                <div
                  key={affiliate.name}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {affiliate.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {affiliate.orders.toLocaleString("en-IN")} orders
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {affiliate.revenue}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Create new items and engage customers faster
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              <Link
                href="/products"
                className="inline-flex h-20 flex-col items-start justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Catalog
                </span>
                <span>Add Product</span>
              </Link>
              <Link
                href="/services"
                className="inline-flex h-20 flex-col items-start justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Services
                </span>
                <span>Add Service</span>
              </Link>
              <Link
                href="/addCoupons"
                className="inline-flex h-20 flex-col items-start justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Marketing
                </span>
                <span>Create Coupon</span>
              </Link>
              <Link
                href="/notifications"
                className="inline-flex h-20 flex-col items-start justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Engagement
                </span>
                <span>Send Notification</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
