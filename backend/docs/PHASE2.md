# Phase 2 — Central tenant resolver

## What it does

Every storefront/user route using `requireTenant` now resolves the tenant through **`resolveTenantFromRequest()`** ([`src/services/tenantResolver.service.ts`](../src/services/tenantResolver.service.ts)):

1. **`Host` / `X-Forwarded-Host`** → `tenant_domain.host` → `adminId`
2. **Development only:** `localhost` / `127.0.0.1` → admin with `DEV_DEFAULT_TENANT_SLUG` (default `demo`)
3. **Fallback:** `X-Tenant-Slug` → `admin.slug` (same as before Phase 2)

`req.tenantAdminId`, `req.tenantSlug`, and `req.tenantResolvedVia` (`host` | `slug` | `dev`) are set on the request.

## Environment

```env
DEV_DEFAULT_TENANT_SLUG=demo
ALLOW_TENANT_SLUG_HEADER=true
```

Set `ALLOW_TENANT_SLUG_HEADER=false` in production if you rely only on custom domains (optional).

## Local testing

| Scenario | How |
|----------|-----|
| Same as before | `X-Tenant-Slug: demo` or `NEXT_PUBLIC_TENANT_SLUG=demo` |
| Host only | Postman/curl: `Host: localhost` (needs `tenant_domain` row from Phase 1 migration) |
| Fake domain | Add `parlour-a.local` to `tenant_domain` + Windows hosts file |

## Prerequisites

Phase 1 migration: `npm run db:tenant-foundation`
