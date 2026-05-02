# Backend changelog

Notable **API and server** changes under `backend/`. The repository root [`CHANGELOG.md`](../CHANGELOG.md) records the **full stack**.

**Entry format:** **`[DD-MM-YYYY HH:mm] — Short title`**, then **`What changed:`** (bullets). Optional **`Files touched:`**. **Newest first** under `## Unreleased`.

---

## Unreleased

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
