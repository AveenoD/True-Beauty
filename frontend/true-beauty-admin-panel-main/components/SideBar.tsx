"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  Scissors,
  ShoppingCart,
  UserCheck,
  Wallet,
  Gift,
  Bell,
  Palette,
  Boxes,
  Share2,
  X,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/lib/sidebar-context";

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Subscription", icon: CreditCard, href: "/subscription" },
  { label: "User Management", icon: Users, href: "/users" },
  { label: "Add Product/Manage", icon: Package, href: "/products" },
  { label: "Add Service", icon: Scissors, href: "/services" },
  { label: "Order Management", icon: ShoppingCart, href: "/orders" },
  { label: "Affiliate Users", icon: UserCheck, href: "/affiliates" },
  { label: "Withdraw Request", icon: Wallet, href: "/withdraw-requests" },
  { label: "Notification", icon: Bell, href: "/notifications" },
  { label: "Add Coupons", icon: Gift, href: "/addCoupons" },
  { label: "Web Theme", icon: Palette, href: "/web-theme" },
  { label: "Inventory Management", icon: Boxes, href: "/inventory" },
  { label: "Social Media Manage", icon: Share2, href: "/social-media-manage" },
];

export default function SideBar() {
  const { isOpen, setOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setOpen]);

  const toggleSidebar = () => setOpen(!isOpen);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-[#fef5f7] border-r border-gray-200 z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button - height matches TopBar */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">True Beauty</h1>
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-lg hover:bg-[#f8c6d0] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Menu items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/users" && pathname.startsWith("/users/")) ||
                (item.href === "/products" && pathname.startsWith("/products")) ||
                (item.href === "/services" && pathname.startsWith("/services")) ||
                (item.href === "/orders" && pathname.startsWith("/orders")) ||
                (item.href === "/affiliates" && pathname.startsWith("/affiliates/")) ||
                (item.href === "/withdraw-requests" && pathname.startsWith("/withdraw-requests")) ||
                (item.href === "/notifications" && pathname.startsWith("/notifications")) ||
                (item.href === "/addCoupons" && pathname.startsWith("/addCoupons")) ||
                (item.href === "/web-theme" && pathname.startsWith("/web-theme")) ||
                (item.href === "/social-media-manage" && pathname.startsWith("/social-media-manage")) ||
                (item.href === "/subscription" && pathname.startsWith("/subscription"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-[#D96A86] text-white font-medium shadow-sm hover:bg-[#C85A76]"
                        : "text-gray-700 hover:bg-[#fef5f7] hover:text-gray-900"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500"}`}
                  />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

    </>
  );
}
