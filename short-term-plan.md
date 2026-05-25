# Multi-Tenant SaaS: Phase-by-Phase Plan

## Goal (this rollout)

- **User ↔ Admin:** Every customer row has a required `adminId`; same email allowed on different tenants via `@@unique([adminId, email])`.
- **Admin ↔ Domain:** `TenantDomain` table maps hostname → `adminId` (production-ready); local dev uses seeded `localhost` / `*.local` rows + existing `X-Tenant-Slug` fallback.
- **No regression:** Existing flows (`backend/src/services/auth.service.ts`, `backend/src/middleware/tenant.ts`, store/cart/orders) keep working; admin JWT routes unchanged.
- **Future endpoints:** Standard middleware stack so new routes do not need rework.

---

## Phase 1 — Database foundation (domain-ready, no runtime change yet)

- Add `TenantDomain` model + enum
- `User.adminId` required + FK + `@@unique([adminId, email])`
- Backfill + seed `localhost` / `127.0.0.1`
- **No backend route changes**

## Phase 2 — Central tenant resolver (done)

- `tenantResolver.service.ts` + refactor `requireTenant`
- Env: `DEV_DEFAULT_TENANT_SLUG=demo`
- See `backend/docs/PHASE2.md`

## Phase 3 — User ↔ Admin auth hardening

- Per-tenant email in `auth.service.ts`
- `assertTenantUser` on cart, wishlist, orders, payments, returns, etc.

## Phase 4 — Local multi-tenant UX

- `*.local` seeds, docs, two-tenant test guide

## Phase 5 — Admin ↔ domain + SuperAdmin domain CRUD

- Domain rows when purchased; tenant-aware email URLs

## Phase 6 — Conventions for new endpoints

```ts
router.use(requireTenant);
router.use(authenticateUser);
router.use(assertTenantUser);
```

---

## Execution order

```text
Phase 1 (DB only) → verify data
Phase 2 (resolver) → verify Postman host + slug
Phase 3 (auth + guards) → regression
Phase 4 (local hosts)
Phase 5 (domains / SuperAdmin)
Phase 6 (ongoing)
```

Each phase = separate commit/PR.
