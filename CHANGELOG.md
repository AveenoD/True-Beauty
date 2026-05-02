# Changelog

All notable changes to this repository will be documented in this file.

**Entry format (from 02-05-2026):** each update uses a heading **`[DD-MM-YYYY HH:mm] — Short title`**, then **`What changed:`** (bullets). Optional **`Files touched:`** / **`Breaking change:`** when useful. **Newest first** under `## Unreleased`.

---

## Unreleased

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
