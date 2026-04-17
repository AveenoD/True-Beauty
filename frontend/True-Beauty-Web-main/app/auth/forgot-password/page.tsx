"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader } from "lucide-react";
import { AxiosError } from "axios";
import { api } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    try {
      await api.post("/users/forgot-password", { email: email.trim() });
      setMessage("If an account exists, a reset link has been sent.");
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax.response?.data?.message ||
          (err instanceof Error ? err.message : "Request failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-rose-100/80 p-6 md:p-8">
        <h1 className="text-3xl font-playfair font-bold text-gray-800 mb-2">
          Forgot password
        </h1>
        <p className="text-gray-600 mb-6">
          We’ll email you a link to reset your password.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-3 rounded-lg font-medium hover:opacity-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Back to{" "}
          <Link href="/login" className="text-rose-600 font-medium hover:underline">
            login
          </Link>
        </p>
      </div>
    </div>
  );
}

