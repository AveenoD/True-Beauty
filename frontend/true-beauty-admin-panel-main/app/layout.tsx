"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SideBar from "@/components/SideBar";
import TopBar from "@/components/TopBar";
import { SidebarProvider } from "@/lib/sidebar-context";
import { UsersProvider } from "@/lib/users-context";
import { ProductsProvider } from "@/lib/products-context";
import { ServicesProvider } from "@/lib/services-context";
import { OrdersProvider } from "@/lib/orders-context";
import { AffiliatesProvider } from "@/lib/affiliates-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { CouponsProvider } from "@/lib/coupons-context";
import { ThemeProvider } from "@/lib/theme-context";
import { StockHistoryProvider } from "@/lib/stock-history-context";
import { SubscriptionProvider } from "@/lib/subscription-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/users": "User Management",
  "/products": "Products",
  "/services": "Services",
  "/orders": "Order Management",
  "/affiliates": "Affiliate Users",
  "/withdraw-requests": "Withdraw Requests",
  "/notifications": "Notifications",
  "/coupons": "Add Coupons",
  "/addCoupons": "Add Coupons",
  "/theme": "Web Theme",
  "/web-theme": "Web Theme",
  "/inventory": "Inventory Management",
  "/social-media-manage": "Social Media Manage",
  "/profile": "Profile",
  "/settings": "Settings",
  "/subscription": "Subscription",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isUserDetail =
    typeof pathname === "string" &&
    pathname.startsWith("/users/") &&
    pathname !== "/users";
  const isProductDetail =
    typeof pathname === "string" &&
    pathname.startsWith("/products/") &&
    pathname !== "/products";
  const isServiceDetail =
    typeof pathname === "string" &&
    pathname.startsWith("/services/") &&
    pathname !== "/services";
  const isAffiliateDetail =
    typeof pathname === "string" &&
    pathname.startsWith("/affiliates/") &&
    pathname !== "/affiliates";
  const isWithdrawRequestDetail =
    typeof pathname === "string" &&
    pathname.startsWith("/withdraw-requests/") &&
    pathname !== "/withdraw-requests";
  const pageTitle = isUserDetail
    ? "User Details"
    : isProductDetail
      ? "Product Details"
      : isServiceDetail
        ? "Service Details"
        : isAffiliateDetail
          ? "Affiliate Details"
          : isWithdrawRequestDetail
            ? "Withdrawal Request Details"
            : (pageTitles[pathname] || "Dashboard");

  if (pathname === "/login") {
    return (
      <html lang="en">
        <head>
          <title>True Beauty Admin Panel - Login</title>
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>True Beauty Admin Panel</title>
        <meta name="description" content="Admin panel for True Beauty management" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UsersProvider>
        <ProductsProvider>
        <StockHistoryProvider>
        <ServicesProvider>
        <OrdersProvider>
        <AffiliatesProvider>
        <NotificationsProvider>
        <CouponsProvider>
        <ThemeProvider>
        <SubscriptionProvider>
        <SidebarProvider>
        <div className="flex h-screen bg-[#fef5f7]">
          <SideBar />
          <div className="flex-1 flex flex-col md:ml-64 overflow-hidden">
            <TopBar pageTitle={pageTitle} />
            <main className="flex-1 overflow-y-auto p-6 bg-[#ffffff]">
              {children}
            </main>
          </div>
        </div>
        </SidebarProvider>
        </SubscriptionProvider>
        </ThemeProvider>
        </CouponsProvider>
        </NotificationsProvider>
        </AffiliatesProvider>
        </OrdersProvider>
        </ServicesProvider>
        </StockHistoryProvider>
        </ProductsProvider>
        </UsersProvider>
      </body>
    </html>
  );
}
