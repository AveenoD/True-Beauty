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

### Changed

- **User profile fields**: `dateOfBirth` and `gender` are now stored on the backend `user` table and returned by `/users/profile` (no localStorage).
- **Auth flow**: Email verify page redirects to login (not profile) and login redirects to `/profile?edit=1` for better onboarding.
- **Session stability**: Backend CORS now supports comma-separated `CORS_ORIGIN` allowlist and blocks unexpected origins, fixing “reload → logout” when using non-localhost frontend origins.

