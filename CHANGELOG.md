# Changelog

All notable changes to this repository will be documented in this file.

**Entry format (from 02-05-2026):** each update uses a heading **`[DD-MM-YYYY HH:mm] — Short title`**, then **`What changed:`** (bullets). Optional **`Files touched:`** / **`Breaking change:`** when useful. **Newest first** under `## Unreleased`.

---

## Unreleased

### [25-05-2026 16:45] — Multi-tenant Phase 3: tenant user guards + cart/coupon hardening

**What changed:**

- **`assertTenantUser`** middleware: logged-in `user.adminId` must match `req.tenantAdminId` (403 otherwise).
- **`authenticateTenantUser`** stack applied on protected **`/users`**, **`/cart`**, **`/wishlist`**, **`/orders`**, **`/payments`**, **`/returns`**, and authenticated **`/store`** review routes.
- **`/payments`** and **`/returns`** now require **`requireTenant`** (were missing before).
- **`POST /coupon/apply`**: uses server **`tenantAdminId`** instead of trusting client **`adminId`** in body.
- **Cart service**: add/update/remove scoped to products belonging to the current tenant.
- **Refresh token**: fails when tenant header/host does not match the user's store.
- **Docs:** [`backend/docs/PHASE3.md`](backend/docs/PHASE3.md).

**Files touched:** `backend/src/middleware/assertTenantUser.ts`, `backend/src/middleware/userTenantAuth.ts`, `backend/src/routes/users.routes.ts`, `cart.routes.ts`, `wishlist.routes.ts`, `order.routes.ts`, `payment.routes.ts`, `return.routes.ts`, `store.routes.ts`, `coupon.apply.routes.ts`, `backend/src/services/cart.service.ts`, `backend/src/controllers/cart.controller.ts`, `backend/src/services/auth.service.ts`, `backend/src/controllers/auth.controller.ts`, `backend/docs/PHASE3.md`

**Breaking change:** **YES (behavior)** — `/payments` and `/returns` now require `X-Tenant-Slug` or resolvable `Host`; cross-tenant API calls with a valid JWT return **403**.

**API endpoints used:** Existing routes only (stricter tenant enforcement).

---

### [25-05-2026 15:30] — Multi-tenant Phase 2: central tenant resolver (Host → domain → slug)

**What changed:**

- **`resolveTenantFromRequest()`** ([`backend/src/services/tenantResolver.service.ts`](backend/src/services/tenantResolver.service.ts)): resolves tenant in order **Host / `tenant_domain`** → **dev loopback** (`localhost` → `DEV_DEFAULT_TENANT_SLUG`) → **`X-Tenant-Slug`** fallback.
- **`requireTenant`** middleware refactored to use the resolver; sets `req.tenantResolvedVia` (`host` | `slug` | `dev`) for logging.
- **`.env.example`:** `DEV_DEFAULT_TENANT_SLUG`, `ALLOW_TENANT_SLUG_HEADER`.
- **HTTP logger:** logs `host`, `tenantSlug`, `tenantResolvedVia` when present.
- **Docs:** [`backend/docs/PHASE2.md`](backend/docs/PHASE2.md).

**Files touched:** `backend/src/services/tenantResolver.service.ts`, `backend/src/middleware/tenant.ts`, `backend/src/types/index.ts`, `backend/src/middleware/httpLogger.ts`, `backend/.env.example`, `backend/docs/PHASE2.md`

**Breaking change:** NO — existing clients using `X-Tenant-Slug` behave as before; Host-based resolution is additive.

**API endpoints used:** No new routes; all routes already behind `requireTenant` (e.g. `/users/*`, `/store/*`, `/cart`, `/wishlist`, `/orders`, `/coupon/apply`).

---

### [25-05-2026 14:00] — Multi-tenant Phase 1: DB foundation + per-tenant user email

**What changed:**

- **Planning:** Added root [`short-term-plan.md`](short-term-plan.md) (phase-by-phase SaaS tenant/domain rollout).
- **Database (Prisma):** New `TenantDomain` model and `TenantDomainKind` enum (`storefront`, `admin_panel`); `User.adminId` required with FK to `Admin`; email uniqueness is now **`@@unique([adminId, email])`** (same email allowed on different tenants); `Admin.slug` required and globally unique.
- **Migration:** Idempotent script **`npm run db:tenant-foundation`** ([`backend/scripts/migrate-tenant-foundation.js`](backend/scripts/migrate-tenant-foundation.js)) backfills orphan `adminId`, admin slugs, composite email index, and seeds local hosts `localhost` / `127.0.0.1` on the default demo admin.
- **Auth (compile/runtime alignment):** User register, login, resend verification, and forgot-password resolve users by **tenant + email** (`adminId_email`), not global email alone — matches new DB constraints.
- **Seed:** [`backend/prisma/seed.ts`](backend/prisma/seed.ts) upserts `tenant_domain` rows for demo admin when present.
- **Docs:** [`backend/docs/PHASE1.md`](backend/docs/PHASE1.md) — how to run migration locally.

**Files touched:** `short-term-plan.md`, `backend/prisma/schema.prisma`, `backend/scripts/migrate-tenant-foundation.js`, `backend/package.json`, `backend/prisma/seed.ts`, `backend/src/services/auth.service.ts`, `backend/src/controllers/auth.controller.ts`, `backend/docs/PHASE1.md`, `backend/prisma/sql/tenant_foundation.sql`

**Breaking change:** **YES** — run `cd backend && npm run db:tenant-foundation && npx prisma generate` on each environment before deploying; existing DBs with global `user.email` unique need the migration script.

**API endpoints used:** No new routes; behavior change on existing `/users/register`, `/users/login`, `/users/resend-verification`, `/users/forgot-password` (tenant-scoped email lookup).

---

### [02-05-2026 16:10] — Changelog: dated entry format

**What changed:**

- Root and backend changelogs now document unreleased work in **`[DD-MM-YYYY HH:mm] — title`** blocks with **`What changed:`** for consistency with the project task log.

**Files touched:** `CHANGELOG.md`, `backend/CHANGELOG.md`

---

### [02-05-2026 16:04] — Changelog: root + backend files

**What changed:**

- Added **`backend/CHANGELOG.md`** for backend-only notes; root changelog carries full-stack updates.
- Removed duplicate **`### Changed`** heading in root changelog.

**Files touched:** `CHANGELOG.md`, `backend/CHANGELOG.md`

---

### [02-05-2026 12:07] — Admin panel: Active plan from backend

**What changed:**

- Subscription plans page shows **Active** badge and highlight using **`GET /admins/profile`** subscription (DB), not local-only context; refreshes profile on page load.

**Files touched:** `frontend/true-beauty-admin-panel-main/app/subscription/page.tsx`

---

### [02-05-2026 11:49] — Web-main: Latest products carousel + store filter

**What changed:**

- **`GET /store/products?isLatestProduct=true&limit=9`** for homepage “Discover the Glow” carousel (autoplay Swiper, product video/image, CTA to `/product/[id]`).

**Files touched:** `backend/src/services/store.service.ts`, `backend/src/controllers/store.controller.ts`, `frontend/True-Beauty-Web-main/app/page.tsx`

---

### [02-05-2026 11:38] — Backend: rate limit vs refresh / logout

**What changed:**

- Global rate limiter skips **`GET /health`** and **`POST`** token refresh on **`/users/refresh-token`** and **`/admins/refresh-token`**; **`.env.example`** notes `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW`.

**Files touched:** `backend/src/index.ts`, `backend/.env.example`

---

### [02-05-2026 11:33] — Web-main: cart remove modal copy

**What changed:**

- Remove-item confirmation description shortened to one sentence.

**Files touched:** `frontend/True-Beauty-Web-main/app/cart/page.tsx`

---

### [02-05-2026 11:31] — Web-main: cart remove confirmation modal

**What changed:**

- Cart line delete opens confirmation modal before calling **`removeItem`**.

**Files touched:** `frontend/True-Beauty-Web-main/app/cart/page.tsx`

---

### [02-05-2026 11:28] — Web-main: wishlist count in header

**What changed:**

- **`WishlistProvider`** + profile/mobile wishlist count; refreshes on toggle and menu open.

**Files touched:** `frontend/True-Beauty-Web-main/lib/wishlist-context.tsx`, `frontend/True-Beauty-Web-main/app/providers.tsx`, `frontend/True-Beauty-Web-main/components/Header.tsx`, `frontend/True-Beauty-Web-main/components/ui/Card.tsx`, `frontend/True-Beauty-Web-main/app/profile/wishlist/page.tsx`

---

### [02-05-2026 11:24] — Web-main: cart badge when empty

**What changed:**

- Header cart count badge hidden when count is **0**; mobile cart label omits count when zero.

**Files touched:** `frontend/True-Beauty-Web-main/components/Header.tsx`

---

### Undated — prior Unreleased backlog

**What changed:** (recorded before dated format; original timestamps unknown.)

- **Backend structured terminal logger**: JSON request/response logging, `x-request-id`, redacted dev body logging, `LOG_LEVEL`.
- **Profile UX**: Confirmation modals for delete address / delete account; fewer raw `alert` flows.
- **Logout confirmation** in web-main header and profile.
- **SuperAdmin tenant management (backend)**: `/superadmin/*`, JWT middleware, tenant verify/disable flows.
- **Local SuperAdmin dev seed**: `backend/prisma/sql/seed_superadmin.sql`.
- **Tenant header (backend)**: `X-Tenant-Slug` on `/store/*`, `/users/*`, `/cart/*`, `/wishlist/*`, `/orders/*`, `/coupon/apply`.
- **Store APIs tenant-scoped**; **asyncHandler** / **zod** `:id` validation; **wishlist** tenant ownership; **tenant-bootstrap.js**; **pricing subscribe** tenant slug; **Swagger** from `openapi.yml`; **user** `dateOfBirth` / `gender`; **auth** redirect tweaks; **CORS** comma origins + Swagger same-origin; **admin panel** session bootstrap and `/admin/products` after login.
