# Changelog

All notable changes to this repository will be documented in this file.

## Unreleased

### Added

- **Backend structured terminal logger**: Added JSON-based request/response logging middleware with automatic `x-request-id` propagation and consistent structured error logging.
  - **Request logs** include `method`, `path`, `status`, `durationMs`, `ip`, `userAgent`, `contentLength`, and `requestId`.
  - **Body logging** is **dev-only** and **redacted** for sensitive keys (password/token/cookie/etc) and omitted when too large.
  - **Config**: `LOG_LEVEL=debug|info|warn|error` (default `info`).

- **Profile UX improvements**: Added proper confirmation modal for destructive actions (delete address / delete account) and replaced browser alerts with inline errors or modal confirmations.
- **Logout confirmation**: Added confirmation popup for logout actions in the header dropdown and profile page (logout runs only after confirm).
- **SuperAdmin tenant management (backend)**: Added `/superadmin/*` endpoints for SuperAdmin login, tenant Admin listing/detail, onboarding verification (`PUT /superadmin/admins/:id/verify`), and enable/disable. Added JWT-based SuperAdmin authentication middleware. Tenant admins are not created by SuperAdmin; they register, purchase a plan, and submit business/KYC before verification.
- **Local SuperAdmin dev seed**: Added `backend/prisma/sql/seed_superadmin.sql` (upsert by email) so you can run `npx prisma db execute --file prisma/sql/seed_superadmin.sql` after setting the password hash for your environment.
- **Tenant header support (backend)**: Added `X-Tenant-Slug` tenant resolver middleware and enforced tenant context on user-facing routes (`/store/*`, `/users/*`, `/cart/*`, `/wishlist/*`, `/orders/*`, `/coupon/apply`). This is the foundation for tenant-scoped store data (pre-subdomain).

### Changed

- **Store APIs are now tenant-scoped**: Public store endpoints (`/store/products*`, `/store/services*`) now filter results by tenant `adminId` resolved from `X-Tenant-Slug`, so user-side frontend can load the correct Admin’s catalog.
- **TypeScript safety improvements (backend)**:
  - Relaxed `asyncHandler` typings to support controllers returning `ApiResponse.*(...)` helpers without failing the build.
  - Added strict runtime validation for `:id` route params using `zod` across controllers (prevents `undefined` IDs from reaching services and improves API 400 behavior).
- **Wishlist is now tenant-safe + API-backed on web-main**:
  - Backend validates wishlist additions against tenant ownership (`product.adminId === user.adminId`) and filters wishlist reads by tenant.
  - Web-main uses `/store/products` for product grids and `/wishlist` for heart toggles (both send `X-Tenant-Slug`).
- **Tenant bootstrap helpers**:
  - Added `backend/tenant-bootstrap.js` to list admins, auto-assign missing admin slugs, and delete a user by email for re-registration during development.
- **Pricing (subscribe) enforces tenant slug**: Pricing subscribe form now derives and validates a subdomain slug (from Website or Company Name) and stores it as `localStorage.tenantSlug` for tenant-aware API calls.

- **Swagger / OpenAPI**: Spec is loaded from `backend/src/docs/openapi.yml` (fixes empty “No operations defined” in Swagger UI). `/docs/json` is registered before Swagger UI so JSON works. Default API server URL uses `PORT` / `API_BASE_URL` (e.g. `http://localhost:9797`).

- **User profile fields**: `dateOfBirth` and `gender` are now stored on the backend `user` table and returned by `/users/profile` (no localStorage).
- **Auth flow**: Email verify page redirects to login (not profile) and login redirects to `/profile?edit=1` for better onboarding.
- **Session stability**: Backend CORS now supports comma-separated `CORS_ORIGIN` allowlist and blocks unexpected origins, fixing “reload → logout” when using non-localhost frontend origins.
- **Admin auth (admin panel)**: Stabilized hard-refresh behavior by bootstrapping session via `GET /admins/profile` with interceptor-based single-flight refresh, and prevented unauthenticated product requests by fetching `/admin/products` only after `isLoggedIn` is true.
- **CORS + Swagger**: Requests from the API’s own origin (e.g. `http://localhost:9797` for Swagger UI) are allowed; CORS deny no longer throws (avoids misleading 500 on blocked origins).

