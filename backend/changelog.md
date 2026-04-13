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