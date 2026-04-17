# Changelog

> Every task must append an entry below using the exact format.
> Do not delete, rearrange, or edit existing entries.

---

## [13-04-2026 12:30] — Initial Prisma schema generation

**What changed:**
Added complete Prisma schema with 30+ models derived from ERD, OpenAPI spec, and frontend TypeScript types. Models include Admin, SuperAdmin, User, UserKyc, Address, AffiliateProfile, AffiliateReferralTracking, AffiliateEarning, WithdrawalRequest, WithdrawalAudit, Product, Inventory, InventoryLog, Coupon, CouponApplicableProduct, CouponApplicableCategory, Order, OrderItem, Payment, CartItem, WishlistItem, ReturnRequest, ReturnTimeline, RefundDetails, RefundAuditLog, ExchangeRequest, ExchangeTimeline, ReviewRating, MyService, ServiceBooking, Notification, UserNotification, SubscriptionPlan, PlanAddon, AdminSubscription, AdminOnboardingProgress, AdminKycDocument, WebTheme, AdminTheme, SocialMediaManage, PlatformPayment — plus 22 enums covering all statuses and types.

**Files touched:**
- `backend/prisma/schema.prisma` (new)

**API endpoints used:**
- None (database schema only)

**Breaking change:** NO

**Branch:** master

---

## [13-04-2026 12:45] — Add AuthToken model for JWT authentication

**What changed:**
Added `TokenType` enum (access, refresh) and `AuthToken` model with fields: id, token, type, userId, adminId, expiresAt, revokedAt, createdAt. Added `AuthToken[]` relation to both `Admin` and `User` models. Added indexes on token, userId, and adminId. Also added isActive and lastLoginAt fields to Admin model.

**Files touched:**
- `backend/prisma/schema.prisma` (updated)

**API endpoints used:**
- None (database schema only)

**Breaking change:** NO

**Branch:** master

---

## [13-04-2026 14:30] — Implement Phase 0 Day 1 API endpoints

**What changed:**
Implemented all 18 Phase 0 Day 1 API endpoints across 5 route groups: Auth (register, login, logout, refresh-token, forgot-password, reset-password), User (get/update profile, CRUD addresses), Store (public products list/get, public services list/get), and Plans (list plans, list plan addons). Full Express backend structure created with config, middleware, services, controllers, routes, and utilities. Added JWT auth with access (15min) and refresh (7day) tokens stored in database with revocation support. Added bcrypt password hashing, Zod validation on all endpoints, standardized ApiResponse wrapper, global error handler, rate limiting, CORS, Helmet security headers, and Morgan logging. Updated tsconfig.json for CommonJS backend output.

**Files touched:**
- `backend/src/index.ts` (new)
- `backend/src/config/database.ts` (new)
- `backend/src/types/index.ts` (new)
- `backend/src/utils/asyncHandler.ts` (new)
- `backend/src/utils/ApiResponse.ts` (new)
- `backend/src/utils/password.ts` (new)
- `backend/src/utils/jwt.ts` (new)
- `backend/src/middleware/errorHandler.ts` (new)
- `backend/src/middleware/auth.ts` (new)
- `backend/src/middleware/validateRequest.ts` (new)
- `backend/src/services/auth.service.ts` (new)
- `backend/src/services/user.service.ts` (new)
- `backend/src/services/store.service.ts` (new)
- `backend/src/services/plans.service.ts` (new)
- `backend/src/controllers/auth.controller.ts` (new)
- `backend/src/controllers/user.controller.ts` (new)
- `backend/src/controllers/store.controller.ts` (new)
- `backend/src/controllers/plans.controller.ts` (new)
- `backend/src/routes/auth.routes.ts` (new)
- `backend/src/routes/user.routes.ts` (new)
- `backend/src/routes/store.routes.ts` (new)
- `backend/src/routes/plans.routes.ts` (new)
- `backend/src/routes/index.ts` (new)
- `backend/tsconfig.json` (updated)
- `backend/package.json` (updated — added bcrypt, jsonwebtoken, @types/bcrypt, @types/jsonwebtoken, scripts)
- `backend/docs/openapi.yml` (updated — appended Phase 0 Day 1 implementation entries with schemas)

**API endpoints used:**
- `POST /auth/register` — op_1_post_impl
- `POST /auth/login` — op_2_post_impl
- `POST /auth/logout` — op_3_post_impl
- `POST /auth/refresh-token` — op_4_post_impl
- `POST /auth/forgot-password` — op_5_post_impl
- `POST /auth/reset-password` — op_6_post_impl
- `GET /user/profile` — op_7_get_impl
- `PUT /user/profile` — op_8_put_impl
- `GET /user/addresses` — op_9_get_impl
- `POST /user/addresses` — op_10_post_impl
- `PUT /user/addresses/{id}` — op_11_put_impl
- `DELETE /user/addresses/{id}` — op_12_delete_impl
- `GET /store/products` — op_48_get_impl
- `GET /store/products/{id}` — op_49_get_impl
- `GET /store/services` — op_61_get_impl
- `GET /store/services/{id}` — op_62_get_impl
- `GET /plans` — op_28_get_impl
- `GET /plans/{id}/addons` — op_29_get_impl

**Breaking change:** NO

**Branch:** master

---

## [13-04-2026 15:00] — Swagger UI setup and route prefix refactor

**What changed:**
Installed swagger-ui-express and swagger-jsdoc packages for API documentation. Created swagger route at `/docs` with Swagger UI and `/docs/json` for raw spec. Updated OpenAPI config to serve from `./src/docs/openapi.yml`. Refactored route structure: merged auth and user routes into single `users.routes.ts`, updated all routes to use `/users` prefix. Updated `.gitignore` with comprehensive entries for build output, logs, OS files, editor dirs, Prisma migrations, TS cache, credentials, and local dev files.

**Files touched:**
- `backend/.gitignore` (updated — comprehensive entries added)
- `backend/package.json` (updated — swagger-ui-express, swagger-jsdoc, @types/swagger-ui-express added)
- `backend/src/config/swagger.ts` (new)
- `backend/src/routes/swagger.routes.ts` (new)
- `backend/src/routes/users.routes.ts` (new — merged auth + user routes)
- `backend/src/routes/auth.routes.ts` (deleted)
- `backend/src/routes/user.routes.ts` (deleted)
- `backend/src/routes/index.ts` (updated — merged imports, /users prefix)
- `backend/src/docs/openapi.yml` (new — copy of docs openapi)

**API endpoints used:**
- `GET /docs` — Swagger UI
- `GET /docs/json` — OpenAPI JSON spec
- All `/users/*` routes (register, login, logout, refresh-token, forgot-password, reset-password, profile, addresses)

**Breaking change:** YES — all auth/user routes changed from `/auth/*` and `/user/*` to `/users/*`

**Branch:** master

---

## [17-04-2026 12:00] — User profile image removal, email verification, httpOnly refresh cookie, frontend auth integration

**What changed:**
Removed `profileImage` from the `User` model; added `emailVerifiedAt` and aligned `TokenType` with DB (`email_verify`, `password_reset`). Registration now creates an email verification token (no JWT until verified); `GET /users/verify-email?token=` verifies the account; login requires a verified email. Login, refresh, and logout set/clear an httpOnly `tb_refresh` cookie; refresh and logout accept the refresh token from the cookie or body; login/refresh responses omit refresh token from JSON (access token only in body). Added `cookie-parser` and `FRONTEND_URL` for verification links (dev console logs link). OpenAPI docs updated for profile fields. New migration drops `profileImage` on `user`, ensures `emailVerifiedAt`, and backfills existing rows so current users remain able to log in. Frontend (`True-Beauty-Web-main`): axios client with `withCredentials`, auth context (session bootstrap via refresh cookie), email/password login and register, verify-email page, profile/addresses wired to `/users/*` APIs; removed phone OTP demo flow.

**Files touched:**
- `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260417120000_user_drop_profile_image_email_verified/migration.sql`
- `backend/src/index.ts`, `backend/src/utils/authCookies.ts`, `backend/src/controllers/auth.controller.ts`, `backend/src/services/auth.service.ts`, `backend/src/routes/users.routes.ts`
- `backend/src/controllers/user.controller.ts`, `backend/src/services/user.service.ts`
- `backend/src/docs/openapi.yml`, `backend/docs/openapi.yml`
- `frontend/True-Beauty-Web-main/package.json`, `lib/api.ts`, `lib/auth-context.tsx`, `app/providers.tsx`, `app/layout.tsx`, `app/login/page.tsx`, `app/auth/register/page.tsx`, `app/auth/verify-email/page.tsx`, `app/profile/page.tsx`, `app/profile/ProfileClient.tsx`, `components/Header.tsx`

**API endpoints used:**
- `GET /users/verify-email`, `POST /users/register`, `POST /users/login`, `POST /users/refresh-token`, `POST /users/logout`, `GET /users/profile`, `PUT /users/profile`, `GET /users/addresses`, `POST /users/addresses`, `PUT /users/addresses/:id`, `DELETE /users/addresses/:id`

**Breaking change:** YES — registration no longer returns access/refresh tokens until email is verified; `User.profileImage` removed; login blocked until `emailVerifiedAt` is set.

**Branch:** anees-dev-frontend-integration-backend

---

## [17-04-2026 14:30] — Local env templates and dev run notes

**What changed:**
Added `backend/.env.example` documenting `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `FRONTEND_URL`, and JWT secrets for local testing. Created local `backend/.env` and `frontend/True-Beauty-Web-main/.env.local` for dev (adjust `DATABASE_URL` to your Postgres user/password). Updated `frontend/True-Beauty-Web-main/.env.example` comments. Set `ignoreDeprecations` in `backend/tsconfig.json` so TypeScript 6 / `ts-node-dev` can compile without the `moduleResolution=node10` hard error.

**Files touched:**
- `backend/.env.example` (new), `backend/.env` (local — gitignored)
- `frontend/True-Beauty-Web-main/.env.example`, `frontend/True-Beauty-Web-main/.env.local` (local — gitignored)
- `backend/tsconfig.json`
- `backend/src/index.ts`, `backend/src/config/database.ts` — load `dotenv` before Prisma; `PrismaClient` uses `@prisma/adapter-pg` + `pg` pool (Prisma 7 driver adapter). Dependencies: `@prisma/adapter-pg`, `pg`, `@types/pg`.

**API endpoints used:**
- None (configuration only)

**Breaking change:** NO

**Branch:** anees-dev-frontend-integration-backend

---

## [17-04-2026 17:03] — SuperAdmin auth + tenant Admin management endpoints

**What changed:**
Added platform-only SuperAdmin authentication (JWT) and implemented tenant Admin management endpoints:
`POST /superadmin/login`, `POST /superadmin/admins`, `GET /superadmin/admins`, `GET /superadmin/admins/:id`, `PUT /superadmin/admins/:id/disable`, `PUT /superadmin/admins/:id/enable`.
Mounted `/superadmin` router and updated OpenAPI specs to include these routes. SuperAdmin endpoints (except login) require Bearer token.

**Files touched:**
- `backend/src/utils/superadminJwt.ts` (new)
- `backend/src/middleware/superadminAuth.ts` (new)
- `backend/src/services/superadmin.service.ts` (new)
- `backend/src/controllers/superadmin.controller.ts` (new)
- `backend/src/routes/superadmin.routes.ts` (new)
- `backend/src/routes/index.ts` (updated)
- `backend/src/docs/openapi.yml` (updated)
- `backend/docs/openapi.yml` (updated)

**API endpoints used:**
- `POST /superadmin/login`
- `POST /superadmin/admins`
- `GET /superadmin/admins`
- `GET /superadmin/admins/:id`
- `PUT /superadmin/admins/:id/disable`
- `PUT /superadmin/admins/:id/enable`

**Breaking change:** NO

**Branch:** anees-dev-frontend-integration-backend

---

## [17-04-2026 16:00] — Register DB errors: phone/email normalization and clearer Prisma messages

**What changed:**
Registration stores email lowercased/trimmed and omits phone when empty (empty string could violate the unique phone index). Login and forgot-password normalize email the same way. Error handler uses Zod `issues`, maps Prisma `P2002`/`P2003`/`P2021`/`P2022` to clearer messages (including migrate hint when schema/columns are missing), and handles `PrismaClientValidationError`.

**Files touched:**
- `backend/src/services/auth.service.ts`
- `backend/src/middleware/errorHandler.ts`

**API endpoints used:**
- `POST /users/register`, `POST /users/login`, `POST /users/forgot-password` (behavior)

**Breaking change:** NO

**Branch:** anees-dev-frontend-integration-backend

---

## [17-04-2026 17:15] — Docker Postgres (P1000), Prisma relations, hydration

**What changed:**
Added repo-root `docker-compose.yml` (Postgres 16 on host port **5433**, credentials `postgres`/`postgres`, database `truebeauty`). Updated `backend/.env` / `.env.example` to `postgresql://postgres:postgres@localhost:5433/...`. Scripts `db:up`, `db:down`, `prisma:deploy`. Prisma 7: datasource `url` only in `prisma.config.ts`; added relation back-references on `AuthToken`, `Address`, `Coupon`, `Product`. `layout.tsx`: `suppressHydrationWarning` on `body`.

**Files touched:**
- `docker-compose.yml`, `backend/.env`, `backend/.env.example`, `backend/package.json`, `backend/prisma/schema.prisma`, `frontend/True-Beauty-Web-main/app/layout.tsx`

**API endpoints used:** None

**Breaking change:** NO

**Branch:** anees-dev-frontend-integration-backend

---

## [17-04-2026 18:05] — Send verification emails via SMTP + resend from frontend

**What changed:**
Added Nodemailer-based SMTP mailer and professional HTML template for email verification. Registration now attempts to send the verification email (falls back to dev console log if SMTP isn’t configured). Added `POST /users/resend-verification` with a limit of 3 sends per user per 24h and revokes previous unused verification tokens. Frontend login now shows a **Resend** option when login is blocked due to unverified email.

**Files touched:**
- `backend/src/utils/mailer.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/routes/users.routes.ts`
- `backend/.env`, `backend/.env.example`
- `frontend/True-Beauty-Web-main/app/login/page.tsx`

**API endpoints used:**
- `POST /users/register`
- `POST /users/resend-verification`

**Breaking change:** NO

**Branch:** anees-dev-frontend-integration-backend

---

## [17-04-2026 19:45] — Forgot/reset password + change password + delete account (backend + profile UI)

**What changed:**
Implemented production-grade forgot/reset password flow: generates one-time random reset token, stores only SHA-256 hash in `auth_token` with `password_reset` type, expires in 1 hour, revokes prior tokens, and sends a reset email. Reset consumes token, updates password, and revokes refresh sessions. Added protected `POST /users/change-password` and `DELETE /users/delete-account` (soft delete via `isActive=false` and `deletedAt`, revoke tokens, clear refresh cookie). Frontend: added “Forgot password” link on login with new pages `/auth/forgot-password` and `/auth/reset-password`; profile Security section now includes Change password (modal) and Delete account (danger zone) wired to backend APIs.

**Files touched:**
- `backend/src/services/auth.service.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/routes/users.routes.ts`
- `backend/src/utils/mailer.ts`
- `frontend/True-Beauty-Web-main/app/login/page.tsx`
- `frontend/True-Beauty-Web-main/app/auth/forgot-password/page.tsx`
- `frontend/True-Beauty-Web-main/app/auth/reset-password/page.tsx`
- `frontend/True-Beauty-Web-main/app/profile/ProfileClient.tsx`

**API endpoints used:**
- `POST /users/forgot-password`, `POST /users/reset-password`
- `POST /users/change-password`, `DELETE /users/delete-account`

**Breaking change:** NO

**Branch:** anees-dev-frontend-integration-backend

---

## [17-04-2026 17:08] — SuperAdmin seed SQL (local dev)

**What changed:**
Added `backend/prisma/sql/seed_superadmin.sql` to upsert a `super_admin` row (bcrypt-hashed password) for local testing of `POST /superadmin/login` and tenant admin routes. Script is idempotent on `email`.

**Files touched:**
- `backend/prisma/sql/seed_superadmin.sql` (new)

**API endpoints used:**
- None (database seed only)

**Breaking change:** NO

**Branch:** anees-dev-frontend-integration-backend

---

## [17-04-2026 17:22] — CORS: allow API origin (Swagger UI)

**What changed:**
Swagger UI runs on the same host/port as the API and sends `Origin: http://localhost:9797`, which was not in `CORS_ORIGIN` (3000 only), causing failures. Added same-origin allowlist from `API_BASE_URL` / `http://localhost:${PORT}`. Replaced `callback(new Error(...))` on CORS deny with `callback(null, false)` so blocked origins do not surface as HTTP 500.

**Files touched:**
- `backend/src/index.ts`
- `backend/.env.example`
- `CHANGELOG.md`

**API endpoints used:** None

**Breaking change:** NO

**Branch:** anees-dev-frontend-integration-backend

---

## [17-04-2026 17:15] — Swagger: load openapi.yml + fix /docs/json

**What changed:**
`swagger-jsdoc` was not merging YAML into `paths`, so Swagger UI showed “No operations defined”. Swagger spec is now built by parsing `src/docs/openapi.yml` with the `yaml` package; server URL is overridden from `API_BASE_URL` or `http://localhost:${PORT}`. Moved `GET /docs/json` before Swagger UI middleware so `/docs/json` returns JSON. Added optional `API_BASE_URL` to `.env.example`.

**Files touched:**
- `backend/src/config/swagger.ts`
- `backend/src/routes/swagger.routes.ts`
- `backend/package.json`, `backend/package-lock.json` (dependency: `yaml`)
- `backend/.env.example`

**API endpoints used:**
- `GET /docs/json` (behavior)

**Breaking change:** NO

**Branch:** anees-dev-frontend-integration-backend

---

## [17-04-2026 18:30] — SuperAdmin: verify onboarding instead of create Admin

**What changed:**
Replaced `POST /superadmin/admins` (direct tenant Admin creation) with `PUT /superadmin/admins/:id/verify`, which updates `AdminOnboardingProgress` (`verificationStatus`, `verificationNote`, `verifiedAt`, `verifiedBySuperAdminId`) and aligns KYC document flags on approve/reject. Added Prisma enum `AdminVerificationStatus` and onboarding columns. List/get responses now include onboarding summary; get-by-id includes subscription and KYC documents for review.

**Files touched:**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260417140000_admin_onboarding_verification/migration.sql`
- `backend/src/services/superadmin.service.ts`
- `backend/src/controllers/superadmin.controller.ts`
- `backend/src/routes/superadmin.routes.ts`
- `backend/src/types/express.d.ts`
- `backend/src/docs/openapi.yml`
- `backend/docs/openapi.yml`
- `CHANGELOG.md`
- `backend/changelog.md`

**API endpoints used:**
- `PUT /superadmin/admins/:id/verify` (new)
- `POST /superadmin/admins` (removed)

**Breaking change:** YES

**Branch:** anees-dev-frontend-integration-backend