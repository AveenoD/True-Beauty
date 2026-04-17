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

### Changed

- **Swagger / OpenAPI**: Spec is loaded from `backend/src/docs/openapi.yml` (fixes empty “No operations defined” in Swagger UI). `/docs/json` is registered before Swagger UI so JSON works. Default API server URL uses `PORT` / `API_BASE_URL` (e.g. `http://localhost:9797`).

- **User profile fields**: `dateOfBirth` and `gender` are now stored on the backend `user` table and returned by `/users/profile` (no localStorage).
- **Auth flow**: Email verify page redirects to login (not profile) and login redirects to `/profile?edit=1` for better onboarding.
- **Session stability**: Backend CORS now supports comma-separated `CORS_ORIGIN` allowlist and blocks unexpected origins, fixing “reload → logout” when using non-localhost frontend origins.
- **CORS + Swagger**: Requests from the API’s own origin (e.g. `http://localhost:9797` for Swagger UI) are allowed; CORS deny no longer throws (avoids misleading 500 on blocked origins).

