# Changelog

> Every task must append an entry below using the exact format.
> Do not delete, rearrange, or edit existing entries.

---

## [14-04-2026 15:30] — V1 Complete: httpOnly Cookies, Token Rotation, Password Strength

**What changed:**
V1 Foundation is now complete with industry-standard security features.

**Security improvements:**
- **httpOnly Cookies**: Auth tokens now stored in httpOnly cookies (not localStorage/headers). Secure, sameSite=strict, prevents XSS attacks.
- **Token Rotation**: Refresh token is rotated on each refresh - old token revoked, new token issued. Prevents replay attacks.
- **Password Strength Validation**: Registration and password reset now require: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.

**Schema changes:**
- Removed `profileImage` from User model (frontend not taking images)
- Removed `profileImage` from Admin model

**Files touched:**
- `backend/prisma/schema.prisma` (updated — removed profileImage fields)
- `backend/src/utils/cookies.ts` (new — httpOnly cookie helpers)
- `backend/src/middleware/auth.ts` (updated — supports both header and cookie auth)
- `backend/src/controllers/auth.controller.ts` (updated — sets/clears cookies)
- `backend/src/services/auth.service.ts` (updated — password strength, token rotation)
- `backend/src/controllers/user.controller.ts` (updated — removed profileImage)
- `backend/src/services/user.service.ts` (updated — removed profileImage)

**Breaking change:** NO — backwards compatible

**Branch:** anees-dev-backend-setup

---

## [14-04-2026 14:50] — Fix affiliate commission: per-product not per-affiliate

**What changed:**
Removed `commissionRate` from AffiliateProfile - commission is NOT global for affiliates. Each Product has its own `commissionRate` set by Admin when adding the product. Admin marks product as `isAffiliateProduct: true` and sets commission rate per product. Order.commissionAmount calculated from Product.commissionRate at time of order.

**Files touched:**
- `backend/prisma/schema.prisma` (updated — removed commissionRate from AffiliateProfile, removed commissionRate from Order)
- `backend/src/services/affiliate.service.ts` (updated — removed commissionRate from apply/profile/stats)
- `backend/src/docs/openapi.yml` (updated — affiliate endpoints added, server URL fixed to 9797)

**API endpoints added:**
- `POST /users/affiliate/apply` — Apply to become affiliate, generates referralCode
- `GET /users/affiliate/profile` — Get own affiliate profile
- `GET /users/affiliate/stats` — Get affiliate statistics (referrals, earnings, orders)
- `GET /users/affiliate/wallet` — Get wallet balance and transaction history
- `POST /users/affiliate/wallet/withdraw` — Request withdrawal (min ₹500)
- `GET /users/affiliate/wallet/withdrawals` — List withdrawal history
- `PUT /users/affiliate/bank-details` — Update bank/UPI details

**API endpoints used:**
- All affiliate endpoints tested

**Breaking change:** YES — AffiliateProfile no longer has commissionRate field

**Branch:** anees-dev-backend-setup

---

## [13-04-2026 15:30] — Add multi-tenant architecture rules and API testing guide

**What changed:**
Created comprehensive multi-tenant security rules document (RULES.md) with 10 mandatory security rules covering: tenant scoping on every query, auth middleware tenant context, entity naming verification, Zod validation, RBAC, rate limiting, token security, audit logging, no raw SQL, and security headers. Created manual API testing guide (TESTING.md) with all 16 endpoint test cases and Postman/Thunder Client examples. Fixed asyncHandler type error (Promise<void> → Promise<unknown>). Removed duplicate auth.routes.ts file. Updated AuthenticatedRequest type with tenantId field. Updated auth middleware to attach tenantId for both authenticateUser and authenticateAdmin.

**Files touched:**
- `backend/RULES.md` (new)
- `backend/TESTING.md` (new)
- `backend/src/utils/asyncHandler.ts` (updated — type fix)
- `backend/src/types/index.ts` (updated — tenantId added)
- `backend/src/middleware/auth.ts` (updated — tenantId, extractToken helper)
- `backend/src/routes/auth.routes.ts` (deleted — duplicate)
- `backend/prisma/schema.prisma` (updated — datasource url removed for Prisma 7)

**API endpoints used:**
- All existing endpoints verified against RULES.md

**Breaking change:** NO

**Branch:** anees-dev-backend-setup

---

## [13-04-2026 16:00] — Schema multi-tenancy fixes and complete system context

**What changed:**
Updated Prisma schema with multi-tenant architecture fixes: Added `adminId` field to Coupon model (each admin has their own coupons) with index. Added `isAffiliate` boolean field to User model. Added `@@index([adminId])` to User model. Added `aadharVerified`, `panVerified`, `verifiedBy` fields to UserKyc model. Added `user` relation to UserKyc model. Added `shippingOrders` and `billingOrders` relations to Address model. Added `orders` relation to Coupon model. Added `cartItems` relation to Product model. Added `user` and `admin` relations to AuthToken model. Updated RULES.md with complete system architecture, User→Admin flow, KYC flow, multi-tenant query patterns, and platform-wide vs tenant-scoped models documentation.

**Files touched:**
- `backend/prisma/schema.prisma` (updated — Coupon adminId, UserKyc verification fields, User isAffiliate, relation fixes)
- `backend/RULES.md` (updated — complete system context added)

**API endpoints used:**
- None (schema and documentation only)

**Breaking change:** NO

**Branch:** anees-dev-backend-setup

---

## [13-04-2026 16:30] — Fix controller auth middleware and add tenant filtering to store endpoints

**What changed:**
Fixed user.controller.ts: Removed duplicate authenticateUser middleware calls inside controllers (was being called twice - once at route level and once in controller). Now uses AuthenticatedRequest type directly. Added X-Tenant-ID header requirement for store endpoints with getTenantId() helper. Updated store.service.ts to filter all queries by adminId (tenant). Added audit log placeholder comments for future implementation. Fixed auth.service.ts: Fixed refresh token expiry calculation bug (multiplication → addition). Removed unused User import.

**Files touched:**
- `backend/src/controllers/user.controller.ts` (updated — removed duplicate auth calls)
- `backend/src/controllers/store.controller.ts` (updated — X-Tenant-ID header requirement)
- `backend/src/services/store.service.ts` (updated — adminId tenant filtering on all queries)
- `backend/src/services/auth.service.ts` (updated — token expiry bug fix)
- `backend/prisma/schema.prisma` (updated — datasource url removed)

**API endpoints used:**
- All store endpoints now require X-Tenant-ID header

**Breaking change:** YES — store endpoints now require X-Tenant-ID header

**Branch:** anees-dev-backend-setup

---

## [14-04-2026 00:45] — Add email preferences, fix reset password

**What changed:**
Added `emailPreferences` boolean field to User model (default: true) for email notification toggle. Updated getProfile and updateProfile to include emailPreferences. Added oldPassword parameter to resetPassword endpoint for security (user must verify current password before setting new one). Removed automatic referralCode generation from registration - user is now a plain customer without affiliate status until they explicitly apply.

**Files touched:**
- `backend/prisma/schema.prisma` (updated — emailPreferences field added)
- `backend/src/services/auth.service.ts` (updated — resetPassword now requires oldPassword)
- `backend/src/services/user.service.ts` (updated — emailPreferences in select/response)
- `backend/src/controllers/auth.controller.ts` (updated — resetPassword schema includes oldPassword)
- `backend/src/controllers/user.controller.ts` (updated — emailPreferences in update schema)

**Database migration:**
- `prisma/migrations/20260414065837_add_email_preferences` (new)

**API endpoints affected:**
- `PUT /users/profile` (now accepts emailPreferences boolean)
- `GET /users/profile` (now returns emailPreferences)
- `POST /users/reset-password` (now requires token, oldPassword, newPassword)

**Breaking change:** YES — reset-password now requires oldPassword in addition to token and newPassword

**Branch:** anees-dev-backend-setup

---

## [14-04-2026 00:15] — Fix referral code generation logic

**What changed:**
Fixed the registration flow: User should NOT get a referralCode when they register. ReferralCode should only be generated when the user explicitly applies to become an affiliate. Removed referralCode and referralBy logic from registerUser() function. User is now a customer by default, not an affiliate. AffiliateProfile and referralCode will be created only when user applies for affiliate program.

**Files touched:**
- `backend/src/services/auth.service.ts` (updated — removed referralCode generation from registration)

**API endpoints used:**
- `POST /users/register` (behavior changed — no referralCode generated)

**Breaking change:** YES — users registering now won't have a referralCode until they apply for affiliate

**Branch:** anees-dev-backend-setup

---

## [13-04-2026 17:00] — Add WalletLedger and affiliate wallet system to schema

**What changed:**
Added complete affiliate wallet system following industry standard double-entry ledger pattern: New `WalletTxType` enum (COMMISSION_CREDIT, WITHDRAWAL_DEBIT, WITHDRAWAL_REVERSED, MANUAL_ADJUSTMENT). New `WalletLedger` model for immutable transaction history - every wallet change creates a ledger entry. Added `minWithdrawalAmount` field (default ₹500) to AffiliateProfile. Added `walletLedger` relation to AffiliateProfile. Added `kycVerified` and `kycCheckedAt` fields to WithdrawalRequest to track KYC status at request time. Added `commissionRate` and `commissionAmount` fields to Order model for tracking affiliate commission. Updated RULES.md with complete affiliate wallet flow documentation including commission credit, withdrawal request, KYC verification, and admin approval flows.

**Files touched:**
- `backend/prisma/schema.prisma` (updated — WalletLedger, WalletTxType, AffiliateProfile minWithdrawalAmount, WithdrawalRequest kycVerified, Order commission fields)
- `backend/RULES.md` (updated — affiliate wallet flow documentation)

**API endpoints used:**
- None (schema and documentation only)

**Breaking change:** NO

**Branch:** anees-dev-backend-setup

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