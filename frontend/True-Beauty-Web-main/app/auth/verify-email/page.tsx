"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader } from "lucide-react";
import { AxiosError } from "axios";
import { api } from "../../../lib/api";

function VerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setMessage("Invalid verification link.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await api.get("/users/verify-email", { params: { token } });
        if (!cancelled) {
          setStatus("ok");
          setMessage("Your email is verified. You can sign in.");
          router.replace("/profile");
        }
      } catch (err) {
        const ax = err as AxiosError<{ message?: string }>;
        if (!cancelled) {
          setStatus("err");
          setMessage(
            ax.response?.data?.message ||
              (err instanceof Error ? err.message : "Verification failed")
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center bg-white rounded-2xl shadow-sm border border-rose-100/80 p-8">
        {status === "loading" && (
          <>
            <Loader className="w-10 h-10 animate-spin mx-auto text-rose-500 mb-4" />
            <p className="text-gray-600">Verifying your email…</p>
          </>
        )}
        {status === "ok" && (
          <>
            <p className="text-green-700 font-medium mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to your profile…</p>
          </>
        )}
        {status === "err" && (
          <>
            <p className="text-red-600 mb-4">{message}</p>
            <Link href="/login" className="text-rose-600 font-medium hover:underline">
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen gradient-bg flex items-center justify-center">
          <Loader className="w-10 h-10 animate-spin text-rose-500" />
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
