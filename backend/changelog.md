# Backend changelog

Notable **API and server** changes under `backend/`. The repository root [`CHANGELOG.md`](../CHANGELOG.md) records the **full stack**.

**Entry format:** **`[DD-MM-YYYY HH:mm] — Short title`**, then **`What changed:`** (bullets). Optional **`Files touched:`**. **Newest first** under `## Unreleased`.

---

## Unreleased

### [25-05-2026 15:30] — Phase 2: central tenant resolver

**What changed:**

- New [`src/services/tenantResolver.service.ts`](src/services/tenantResolver.service.ts): Host → `tenant_domain`, dev `localhost` shortcut, `X-Tenant-Slug` fallback.
- [`src/middleware/tenant.ts`](src/middleware/tenant.ts) uses resolver; exposes `req.tenantResolvedVia`.
- [`src/middleware/httpLogger.ts`](src/middleware/httpLogger.ts): tenant resolution fields in request context.
- **`.env.example`:** `DEV_DEFAULT_TENANT_SLUG`, `ALLOW_TENANT_SLUG_HEADER`.
- [`docs/PHASE2.md`](docs/PHASE2.md).

**Files touched:** `src/services/tenantResolver.service.ts`, `src/middleware/tenant.ts`, `src/types/index.ts`, `src/middleware/httpLogger.ts`, `.env.example`, `docs/PHASE2.md`

**Breaking change:** NO

**API endpoints used:** Existing tenant-scoped routes unchanged (resolution only).

---

### [25-05-2026 14:00] — Phase 1: TenantDomain + per-tenant user email

**What changed:**

- **Schema:** `TenantDomain` (`host` → `adminId`, `kind`, `isPrimary`); `User` → `Admin` relation; `@@unique([adminId, email])`; `Admin.slug` NOT NULL + unique.
- **Migration:** `npm run db:tenant-foundation` — creates `tenant_domain`, backfills `user.adminId`, drops global email unique, seeds `localhost` / `127.0.0.1` for default admin.
- **Auth service:** `findUserByTenantEmail()` via `adminId_email` for register, login, resend verification, forgot password ([`src/services/auth.service.ts`](src/services/auth.service.ts), [`src/controllers/auth.controller.ts`](src/controllers/auth.controller.ts)).
- **Seed:** Demo admin tenant domains in [`prisma/seed.ts`](prisma/seed.ts).
- **Docs:** [`docs/PHASE1.md`](docs/PHASE1.md).

**Files touched:** `prisma/schema.prisma`, `scripts/migrate-tenant-foundation.js`, `package.json`, `prisma/seed.ts`, `src/services/auth.service.ts`, `src/controllers/auth.controller.ts`, `docs/PHASE1.md`, `prisma/sql/tenant_foundation.sql`

**Breaking change:** **YES** — run `npm run db:tenant-foundation` before start/deploy.

**API endpoints used:** Existing `/users/*` auth routes (tenant-scoped email resolution only).

---

### [02-05-2026 16:10] — Changelog: dated entry format

**What changed:**

- Backend changelog entries use the same **`[DD-MM-YYYY HH:mm] — title`** + **`What changed:`** pattern as the root log.

**Files touched:** `backend/CHANGELOG.md`

---

### [02-05-2026 11:49] — Store: `isLatestProduct` query on list products

**What changed:**

- **`GET /store/products`** accepts optional **`isLatestProduct=true`**; filters to products flagged latest in DB (tenant-scoped unchanged).

**Files touched:** `backend/src/services/store.service.ts`, `backend/src/controllers/store.controller.ts`

---

### [02-05-2026 11:38] — Rate limiter: exempt health + token refresh

**What changed:**

- Global **`express-rate-limit`** skips **`GET /health`** and **`POST /users/refresh-token`**, **`POST /admins/refresh-token`** so refresh is not throttled like anonymous traffic.
- **`.env.example`**: optional **`RATE_LIMIT_MAX`** / **`RATE_LIMIT_WINDOW`** comments.

**Files touched:** `backend/src/index.ts`, `backend/.env.example`
