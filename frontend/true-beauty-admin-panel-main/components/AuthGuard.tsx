"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isReady, isLoggedIn } = useAdminAuth();
  const router = useRouter();
  const isRedirecting = useRef(false);

  useEffect(() => {
    if (!isReady || isRedirecting.current) return;
    if (!isLoggedIn && !isRedirecting.current) {
      isRedirecting.current = true;
      router.replace("/login");
    }
  }, [isReady, isLoggedIn, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fef5f7]">
        <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
