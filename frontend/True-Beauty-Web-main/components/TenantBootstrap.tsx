"use client";

import { useEffect } from "react";

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

function slugify(input: string) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

/** parlour-a.local → parlour-a; admin.parlour-a.local → parlour-a */
function deriveSlugFromHostname(hostname: string): string | null {
  const host = hostname.trim().toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;

  if (host.endsWith(".local")) {
    const base = host.slice(0, -".local".length);
    const slugSource = base.startsWith("admin.") ? base.slice("admin.".length) : base;
    const slug = slugify(slugSource);
    if (slug && SLUG_REGEX.test(slug)) return slug;
    return null;
  }

  const parts = host.split(".");
  if (parts.length >= 3 && parts[0] && parts[0] !== "www") {
    const sub = slugify(parts[0]);
    if (sub && SLUG_REGEX.test(sub)) return sub;
  }

  return null;
}

function deriveTenantSlug(params: URLSearchParams): string | null {
  const fromQuery =
    params.get("tenant") || params.get("t") || params.get("store");
  const slug = slugify(fromQuery || "");
  if (slug && SLUG_REGEX.test(slug)) return slug;

  if (typeof window !== "undefined") {
    return deriveSlugFromHostname(window.location.hostname);
  }

  return null;
}

export default function TenantBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search || "");
    const derived = deriveTenantSlug(params);

    const fromEnv = process.env.NEXT_PUBLIC_TENANT_SLUG?.trim() || "";
    const envSlug = slugify(fromEnv);

    const existing = localStorage.getItem("tenantSlug")?.trim() || "";

    const nextSlug =
      derived ||
      (envSlug && SLUG_REGEX.test(envSlug) ? envSlug : null) ||
      (!existing && window.location.hostname === "localhost" ? "demo" : null);

    if (nextSlug && nextSlug !== existing) {
      localStorage.setItem("tenantSlug", nextSlug);
    }

    if (derived && process.env.NODE_ENV === "development") {
      console.info("[tenant] slug for API header:", nextSlug ?? derived);
    }
  }, []);

  return null;
}
