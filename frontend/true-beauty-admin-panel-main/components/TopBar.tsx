"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, User, ChevronDown, Menu } from "lucide-react";
import { useSidebar } from "@/lib/sidebar-context";
import { clearToken } from "@/lib/auth";
import DeletePopup from "@/components/ui/deletePopup";

interface TopBarProps {
  pageTitle?: string;
}

export default function TopBar({ pageTitle = "Dashboard" }: TopBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { toggle: toggleSidebar } = useSidebar();
  const router = useRouter();

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    setShowProfileMenu(false);
    clearToken();
    router.push("/login");
  };

  const handleNotificationClick = (notificationId: string) => {
    setShowNotifications(false);
    router.push(`/notifications?focusId=${notificationId}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#fef5f7] border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 h-16 px-4 md:px-6">
        {/* Left: Hamburger (mobile) + Title */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="shrink-0 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm hover:bg-[#f8c6d0] transition-colors md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="truncate text-lg font-semibold text-gray-900 md:text-2xl" title={pageTitle}>
            {pageTitle}
          </h1>
        </div>

        {/* Right side: Search, Notifications, Profile */}
        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64 rounded-xl border border-gray-200 bg-[#fef5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent transition-all"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-[#f8c6d0] transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="fixed inset-x-4 top-20 z-50 md:absolute md:inset-x-auto md:right-0 md:top-auto md:mt-2 md:z-20 w-auto md:w-80 max-w-[calc(100vw-2rem)] md:max-w-none">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 py-2">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div
                        className="px-4 py-3 hover:bg-[#fef5f7] cursor-pointer"
                        onClick={() => handleNotificationClick("notif-2")}
                      >
                        <p className="text-sm text-gray-900">New order received</p>
                        <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                      </div>
                      <div
                        className="px-4 py-3 hover:bg-[#fef5f7] cursor-pointer"
                        onClick={() => handleNotificationClick("notif-1")}
                      >
                        <p className="text-sm text-gray-900">Payment processed</p>
                        <p className="text-xs text-gray-500 mt-1">5 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#f8c6d0] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#f8c6d0] flex items-center justify-center">
                <User className="w-4 h-4 text-gray-900" />
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                Admin
              </span>
              <ChevronDown className="hidden md:block w-4 h-4 text-gray-500" />
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                  <Link
                    href="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors"
                  >
                    Settings
                  </Link>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[#fef5f7] transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <DeletePopup
        open={showLogoutConfirm}
        title="Logout"
        description="Are you sure you want to logout? You will need to sign in again to access the admin panel."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
}
