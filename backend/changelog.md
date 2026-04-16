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

## [16-04-2026 13:10] — Fix backend boot + Swagger spec

**What changed:**
Fixed backend dev server startup by configuring Prisma Client to use the Postgres driver adapter (`pg` + `@prisma/adapter-pg`) and updating TypeScript module settings for Node16 resolution. Fixed Swagger “API testing” UI by removing duplicate top-level `paths`/`components` keys from `src/docs/openapi.yml` (split implemented endpoints/schemas into a separate `openapi.implemented.yml` that swagger-jsdoc merges).

**Files touched:**
- `backend/src/config/database.ts` (updated)
- `backend/tsconfig.json` (updated)
- `backend/src/docs/openapi.yml` (updated)
- `backend/src/docs/openapi.implemented.yml` (new)
- `backend/package-lock.json` (updated)

**API endpoints used:**
- `GET /docs` — Swagger UI
- `GET /docs/json` — OpenAPI JSON spec

**Breaking change:** NO

**Branch:** anees-dev-backend-v3-setup

---

## [16-04-2026 13:55] — Add email verification signup flow

**What changed:**
Updated user signup/login flow to require email verification before login. Registration no longer generates a referral code; instead it creates a one-time email verification token and sends a Gmail SMTP verification email with a verify button. Added `GET /users/verify-email` endpoint to verify and redirect to frontend address page (`APP_URL/address?verified=1`). Added registration email-domain allowlist (gmail/yahoo/outlook-type domains).

**Files touched:**
- `backend/prisma/schema.prisma` (updated — `emailVerifiedAt`, `TokenType.email_verify`, relation fixes)
- `backend/prisma/migrations/20260416140500_add_user_email_verification/migration.sql` (new)
- `backend/src/services/auth.service.ts` (updated)
- `backend/src/controllers/auth.controller.ts` (updated)
- `backend/src/routes/users.routes.ts` (updated)
- `backend/src/utils/mailer.ts` (new)
- `backend/src/docs/openapi.implemented.yml` (updated)
- `backend/package-lock.json` (updated)

**API endpoints used:**
- `POST /users/register` — creates user + sends verification email
- `GET /users/verify-email` — verifies and redirects
- `POST /users/login` — blocked until verified

**Breaking change:** NO

**Branch:** anees-dev-backend-v3-setup

---

## [16-04-2026 14:05] — Add resend verification + password policy

**What changed:**
Added `POST /users/resend-verification` to re-send email verification (max 3 requests per 24 hours, verification link valid 24 hours). Removed `referralCode` from registration API docs/examples. Enforced strong password policy for registration and reset-password (uppercase, lowercase, number, special).

**Files touched:**
- `backend/src/services/auth.service.ts` (updated)
- `backend/src/controllers/auth.controller.ts` (updated)
- `backend/src/routes/users.routes.ts` (updated)
- `backend/src/docs/openapi.implemented.yml` (updated)
- `backend/changelog.md` (updated)

**API endpoints used:**
- `POST /users/register`
- `POST /users/resend-verification`
- `POST /users/forgot-password`
- `POST /users/reset-password`

**Breaking change:** NO

**Branch:** anees-dev-backend-v3-setup

---

## [16-04-2026 13:34] — Fix Swagger Try-It-Out + token expiry bug

**What changed:**
Fixed Swagger “Try it out” so it hits the correct backend base URL and real route prefixes (`/users/*` instead of `/auth/*` and `/user/*`). Also fixed refresh-token expiry calculation that was creating an invalid `Date` and causing `POST /users/register` to fail with 500 when persisting refresh tokens.

**Files touched:**
- `backend/src/index.ts` (updated)
- `backend/src/config/swagger.ts` (updated)
- `backend/src/routes/swagger.routes.ts` (updated)
- `backend/src/docs/openapi.yml` (updated)
- `backend/src/docs/openapi.implemented.yml` (updated)
- `backend/src/services/auth.service.ts` (updated)

**API endpoints used:**
- `GET /docs` — Swagger UI
- `GET /docs/json` — OpenAPI JSON spec
- `POST /users/register` — verified 201 after fix

**Breaking change:** NO

**Branch:** anees-dev-backend-v3-setup

---

## [16-04-2026 14:30] — Secure password reset + protected change password

**What changed:**
Implemented an industry-standard forgot/reset password flow: forgot-password now issues a one-time reset token (stored as SHA-256 hash in `AuthToken` with short expiry) and sends a reset email link; reset-password now validates token (exists, not used, not expired), updates password, and revokes refresh tokens. Added protected `POST /users/change-password` (Bearer token + currentPassword) and upgraded verification + reset email templates to a more professional layout. Updated Prisma schema to reflect `User.phone @unique` and added `TokenType.password_reset`.

**Files touched:**
- `backend/prisma/schema.prisma` (updated)
- `backend/prisma/migrations/20260416143000_add_password_reset_token_type_and_user_phone_unique/migration.sql` (new)
- `backend/src/services/auth.service.ts` (updated)
- `backend/src/controllers/auth.controller.ts` (updated)
- `backend/src/routes/users.routes.ts` (updated)
- `backend/src/utils/mailer.ts` (updated)
- `backend/src/docs/openapi.implemented.yml` (updated)
- `backend/changelog.md` (updated)

**API endpoints used:**
- `POST /users/forgot-password`
- `POST /users/reset-password`
- `POST /users/change-password`

**Breaking change:** NO

**Branch:** anees-dev-backend-v3-setup

---

## [16-04-2026 14:47] — Fix refresh token rotation + docs/errors

**What changed:**
Fixed refresh-token rotation failures caused by duplicate JWTs being generated within the same second (unique constraint on `auth_token.token`). Added `jti` (UUID) claim to access/refresh tokens so each token is always unique. Also fixed global error handler compatibility with Zod v4 (`issues` vs `errors`) and removed duplicate OpenAPI path keys for forgot/reset password in `openapi.implemented.yml` so Swagger spec parsing is stable.

**Files touched:**
- `backend/src/utils/jwt.ts` (updated)
- `backend/src/types/index.ts` (updated)
- `backend/src/middleware/errorHandler.ts` (updated)
- `backend/src/docs/openapi.implemented.yml` (updated)
- `backend/changelog.md` (updated)

**API endpoints used:**
- `POST /users/login`
- `POST /users/refresh-token`
- `POST /users/logout`

**Breaking change:** NO

**Branch:** anees-dev-backend-v3-setup

---

## [16-04-2026 17:12] — Relax addressType and simplify address payload

**What changed:**
Removed the strict enum validation for `addressType` (home/work/other) so the frontend can send any label string. Also removed `country` from address create/update request validation and docs; database default still applies when not provided. Verified user profile get/update works with a fresh access token (token expiry requires re-login after expiry).

**Files touched:**
- `backend/src/controllers/user.controller.ts` (updated)
- `backend/src/services/user.service.ts` (updated)
- `backend/src/docs/openapi.implemented.yml` (updated)
- `backend/changelog.md` (updated)

**API endpoints used:**
- `POST /users/login`
- `GET /users/profile`
- `PUT /users/profile`
- `POST /users/addresses`
- `PUT /users/addresses/{id}`

**Breaking change:** NO

**Branch:** anees-dev-backend-v3-setup