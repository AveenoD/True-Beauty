import { Request } from "express";
import prisma from "../config/database";

export type TenantResolvedVia = "host" | "slug" | "dev";

export type ResolvedTenant = {
  tenantAdminId: string;
  tenantSlug: string;
  resolvedVia: TenantResolvedVia;
};

const TENANT_HEADER = "x-tenant-slug";
const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

const DEV_LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function allowTenantSlugHeader(): boolean {
  const raw = process.env.ALLOW_TENANT_SLUG_HEADER;
  if (raw === undefined || raw === "") return true;
  return raw.toLowerCase() !== "false" && raw !== "0";
}

/** Strip port, lowercase, optional www. prefix removal for storefront hosts. */
export function normalizeHostname(raw: string | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;

  let host = raw.trim().toLowerCase();
  if (!host) return null;

  // IPv6 with port [::1]:3000
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    if (end !== -1) {
      host = host.slice(1, end);
    }
  } else if (host.includes(":")) {
    host = host.split(":")[0] ?? host;
  }

  if (host.startsWith("www.")) {
    host = host.slice(4);
  }

  return host || null;
}

function getRequestHost(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-host"];
  const raw =
    (typeof forwarded === "string" ? forwarded.split(",")[0] : Array.isArray(forwarded) ? forwarded[0] : undefined) ??
    req.headers.host;

  return normalizeHostname(typeof raw === "string" ? raw : undefined);
}

function getTenantSlugFromHeader(req: Request): string | null {
  if (!allowTenantSlugHeader()) return null;

  const raw =
    (req.headers[TENANT_HEADER] as string | undefined) ??
    (req.headers[TENANT_HEADER.toLowerCase()] as string | undefined);

  const slug = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase();
  if (!slug || !SLUG_REGEX.test(slug)) return null;
  return slug;
}

async function resolveByHost(host: string): Promise<ResolvedTenant | null> {
  const domain = await prisma.tenantDomain.findUnique({
    where: { host },
    select: {
      admin: {
        select: { id: true, slug: true, isActive: true },
      },
    },
  });

  const admin = domain?.admin;
  if (!admin?.id || !admin.isActive || !admin.slug) return null;

  return {
    tenantAdminId: admin.id,
    tenantSlug: admin.slug,
    resolvedVia: "host",
  };
}

async function resolveBySlug(slug: string): Promise<ResolvedTenant | null> {
  const admin = await prisma.admin.findFirst({
    where: { slug, isActive: true },
    select: { id: true, slug: true },
  });

  if (!admin?.id || !admin.slug) return null;

  return {
    tenantAdminId: admin.id,
    tenantSlug: admin.slug,
    resolvedVia: "slug",
  };
}

async function resolveDevLoopback(): Promise<ResolvedTenant | null> {
  if (isProduction()) return null;

  const slug = (process.env.DEV_DEFAULT_TENANT_SLUG || "demo").trim().toLowerCase();
  if (!slug || !SLUG_REGEX.test(slug)) return null;

  const resolved = await resolveBySlug(slug);
  if (!resolved) return null;

  return { ...resolved, resolvedVia: "dev" };
}

export class TenantResolutionError extends Error {
  constructor(
    message: string,
    readonly code: "missing" | "invalid_slug" | "not_found"
  ) {
    super(message);
    this.name = "TenantResolutionError";
  }
}

/**
 * Resolve tenant (Admin) for storefront/user APIs.
 * Priority: Host → tenant_domain, then dev loopback shortcut, then X-Tenant-Slug.
 */
export async function resolveTenantFromRequest(req: Request): Promise<ResolvedTenant> {
  const host = getRequestHost(req);

  if (host) {
    const byHost = await resolveByHost(host);
    if (byHost) return byHost;

    if (!isProduction() && DEV_LOOPBACK_HOSTS.has(host)) {
      const byDev = await resolveDevLoopback();
      if (byDev) return byDev;
    }
  }

  const slug = getTenantSlugFromHeader(req);
  if (slug) {
    const bySlug = await resolveBySlug(slug);
    if (bySlug) return bySlug;
    throw new TenantResolutionError("Tenant not found", "not_found");
  }

  if (!host && !allowTenantSlugHeader()) {
    throw new TenantResolutionError("Tenant host header is required", "missing");
  }

  const slugHeader = req.headers[TENANT_HEADER] ?? req.headers[TENANT_HEADER.toLowerCase()];
  const rawSlug = (Array.isArray(slugHeader) ? slugHeader[0] : slugHeader)?.trim().toLowerCase();
  if (rawSlug && !SLUG_REGEX.test(rawSlug)) {
    throw new TenantResolutionError("Invalid X-Tenant-Slug", "invalid_slug");
  }

  throw new TenantResolutionError(
    host
      ? "Tenant not found for this host"
      : "X-Tenant-Slug header is required",
    host ? "not_found" : "missing"
  );
}
