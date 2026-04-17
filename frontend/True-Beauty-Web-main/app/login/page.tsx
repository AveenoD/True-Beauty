"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader, Mail, Lock } from "lucide-react";
import { AxiosError } from "axios";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";

function getRedirectPath(redirect: string | null): string | null {
  if (!redirect || typeof redirect !== "string") return null;
  const path = redirect.startsWith("/") ? redirect : `/${redirect}`;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getRedirectPath(searchParams.get("redirect"));
  const registered = searchParams.get("registered");
  const { login, isLoggedIn, isReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (isReady && isLoggedIn && redirectTo) {
      router.replace(redirectTo);
    }
  }, [isReady, isLoggedIn, redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResendMessage("");
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      router.push(redirectTo || "/profile");
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax.response?.data?.message ||
          (err instanceof Error ? err.message : "Login failed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const canResend =
    !!email.trim() &&
    (error.toLowerCase().includes("verify your email") ||
      error.toLowerCase().includes("verify"));

  const handleResend = async () => {
    setResendMessage("");
    if (!email.trim()) return;
    setResendLoading(true);
    try {
      await api.post("/users/resend-verification", { email: email.trim() });
      setResendMessage("Verification email sent. Please check your inbox/spam.");
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setResendMessage(
        ax.response?.data?.message ||
          (err instanceof Error ? err.message : "Could not resend email")
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-playfair font-bold text-gray-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in with your email and password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-rose-100/80 p-6 md:p-8">
          {registered === "1" && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              Account created. Verify your email, then sign in.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none disabled:bg-gray-50"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none disabled:bg-gray-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-60"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {canResend && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-700">
                    Didn&apos;t receive the verification email?
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-sm font-medium text-rose-600 hover:text-rose-700 disabled:opacity-60"
                  >
                    {resendLoading ? "Sending…" : "Resend"}
                  </button>
                </div>
                {resendMessage && (
                  <p className="mt-2 text-sm text-gray-700">{resendMessage}</p>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-3 rounded-lg font-medium hover:opacity-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Forgot password?
            </Link>
          </div>
          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-rose-600 font-medium hover:text-rose-700"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen gradient-bg flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading…</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
