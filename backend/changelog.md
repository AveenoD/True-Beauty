# Changelog

> Every task must append an entry below using the exact format.
> Do not delete, rearrange, or edit existing entries.

---

## [15-04-2026 13:50] — Admin Registration + Onboarding Wizard

**What changed:**
Added `phone` as required field in Admin registration. Created full Admin Onboarding Wizard with 5 steps. Added `BusinessType` and `TeamSize` enums to schema.

**Schema changes:**
- Added `phone` field to Admin model (required)
- Added `BusinessType` enum (ecommerce, retail_store, brand_manufacturer, other)
- Added `TeamSize` enum (one_to_five, six_to_twenty, twentyone_to_hundred, hundred_plus)
- Updated `AdminOnboardingProgress` model — added: companyName, website, businessType, teamSize, preferredStartDate, selectedPlanId, selectedAddonIds, subscriptionActivated
- Updated `AdminSubscription` model — added: selectedAddonIds

**Admin Registration (required fields):**
- POST `/admin/auth/register` — name, email, phone, password, role (optional)

**Admin Auth:**
- POST `/admin/auth/login` — email, password
- POST `/admin/auth/logout` — refreshToken (body)
- POST `/admin/auth/refresh-token` — refreshToken (body)
- Auto-creates AdminOnboardingProgress on registration

**Admin Onboarding Wizard (all require admin auth):**
- GET `/admin/onboarding/progress` — Get current onboarding progress
- PUT `/admin/onboarding/business-details` — companyName, website, businessType, teamSize, preferredStartDate, storeName, storeDescription, businessCategory
- POST `/admin/onboarding/select-plan` — planId, addonIds[]
- POST `/admin/onboarding/kyc-documents` — documents[{type, fileUrl}]
- PUT `/admin/onboarding/bank-details` — bankName, accountNumber, ifscCode, upiId
- POST `/admin/onboarding/complete` — Activates subscription, calculates expiry

**Public Plan Routes:**
- GET `/plans` — List all active subscription plans
- GET `/plans/addons` — List all active plan addons
- GET `/plans/:planId` — Get plan details

**New files:**
- `backend/src/services/onboarding.service.ts`
- `backend/src/controllers/onboarding.controller.ts`
- `backend/src/routes/onboarding.routes.ts`

**Modified files:**
- `backend/prisma/schema.prisma` (phone, enums, onboarding fields)
- `backend/src/services/admin.service.ts` (phone required, auto-create onboarding progress)
- `backend/src/controllers/admin.controller.ts` (phone required field)
- `backend/src/routes/index.ts` (mounted onboarding routes)

**Migration:** `20260415074719_add_admin_onboarding_fields`

**Breaking change:** NO — backwards compatible

**Branch:** anees-dev-backend-v2-setup

---

## [15-04-2026 12:15] — V3 Complete: Catalog & Basic Ecommerce

**What changed:**
V3 features implemented: Admin Auth, Admin Product CRUD, Cart, Wishlist, Orders, Coupons, Payments (DUMMY), Returns, Service Bookings.

**Schema changes:**
- Added `adminId` field to Coupon model for multi-tenancy
- Added `Admin` relation to Coupon model
- Ran migrations: `20260415_init` and `20260415_add_coupon_admin_relation`
- Database now fully migrated and synced

**Admin Auth:**
- POST `/admin/auth/register` — Register admin account
- POST `/admin/auth/login` — Admin login (JWT 15m/refresh 7d)
- POST `/admin/auth/logout` — Revoke tokens
- POST `/admin/auth/refresh-token` — Token rotation

**Admin Product CRUD:**
- GET/POST `/admin/products` — List/create products
- GET/PUT/DELETE `/admin/products/:id` — Get/update/delete
- Auto-creates Inventory record on product creation
- Auto-creates InventoryLog on stock changes
- All filtered by adminId (multi-tenant)

**Admin Inventory:**
- Inventory auto-synced via product create/update
- Stock changes create InventoryLog entries with reason

**Cart (User):**
- GET `/users/cart` — Get cart with subtotal
- POST `/users/cart/items` — Add item (upsert if exists)
- PUT `/users/cart/items/:id` — Update quantity
- DELETE `/users/cart/items/:id` — Remove item
- DELETE `/users/cart` — Clear cart

**Wishlist (User):**
- GET `/users/wishlist` — List wishlist
- POST `/users/wishlist` — Add product
- DELETE `/users/wishlist/:productId` — Remove

**Admin Orders:**
- GET `/admin/orders` — List all orders
- PUT `/admin/orders/:id/status` — Update status (pending→confirmed→preparing→shipped→out_for_delivery→delivered)
- POST `/admin/orders/:id/cancel` — Cancel order

**User Orders:**
- POST `/users/orders` — Place order from cart (validates stock, applies coupon, deducts inventory, clears cart)
- GET `/users/orders` — List orders
- GET `/users/orders/:id` — Order details
- POST `/users/orders/:id/cancel` — Cancel (restores inventory)

**Admin Coupons:**
- GET/POST `/admin/coupons` — List/create coupons
- GET/PUT/DELETE `/admin/coupons/:id` — CRUD
- POST `/admin/coupons/:id/toggle-active` — Toggle active/inactive
- Supports applicable products, categories, min order amount, usage limits

**User Coupon Validation:**
- POST `/users/coupons/validate` — Validate coupon against cart

**Payments (DUMMY — no real money):**
- POST `/payments/initiate` — Create payment (COD auto-confirms, online returns mock URL)
- POST `/payments/verify` — Mock verify (always succeeds)
- GET `/payments/status/:orderId` — Payment status

**Returns:**
- POST `/users/returns` — Create return request (delivered orders only)
- GET `/users/returns` — List returns
- GET `/users/returns/:id` — Return details
- GET `/admin/returns` — Admin list returns
- PUT `/admin/returns/:id/status` — Approve/reject/in_transit/received/refund_completed

**Service Bookings (Admin):**
- GET/POST `/admin/services` — CRUD services
- PUT/DELETE `/admin/services/:id` — Update/delete
- GET `/admin/services/bookings` — List bookings
- PUT `/admin/services/bookings/:id/status` — Update booking status

**Service Bookings (User):**
- POST `/users/service-bookings` — Book service (slot availability check)
- GET `/users/service-bookings` — List bookings
- GET `/users/service-bookings/:id` — Booking details
- POST `/users/service-bookings/:id/cancel` — Cancel booking

**New files:**
- `backend/src/services/admin.service.ts`
- `backend/src/controllers/admin.controller.ts`
- `backend/src/routes/admin.routes.ts`
- `backend/src/services/product.service.ts`
- `backend/src/controllers/product.controller.ts`
- `backend/src/routes/product.routes.ts`
- `backend/src/services/cart.service.ts`
- `backend/src/controllers/cart.controller.ts`
- `backend/src/services/order.service.ts`
- `backend/src/controllers/order.controller.ts`
- `backend/src/routes/order.routes.ts`
- `backend/src/services/coupon.service.ts`
- `backend/src/controllers/coupon.controller.ts`
- `backend/src/routes/coupon.routes.ts`
- `backend/src/services/return.service.ts`
- `backend/src/controllers/return.controller.ts`
- `backend/src/routes/return.routes.ts`
- `backend/src/services/payment.service.ts`
- `backend/src/controllers/payment.controller.ts`
- `backend/src/routes/payment.routes.ts`
- `backend/src/services/booking.service.ts`
- `backend/src/controllers/booking.controller.ts`
- `backend/src/routes/service.routes.ts`

**Modified files:**
- `backend/src/routes/users.routes.ts` (added cart, wishlist, orders, returns, bookings, coupon validation)
- `backend/src/routes/index.ts` (mounted all new route files)
- `backend/src/routes/store.routes.ts` (updated product listing to use DB)
- `backend/prisma/schema.prisma` (added adminId to Coupon, relation fix)
- `backend/src/docs/openapi.yml` (added 30+ new V3 paths and schemas)

**Breaking change:** NO — backwards compatible

**Branch:** anees-dev-backend-v2-setup

---

## [14-04-2026 16:00] — V2 Complete: Email Verification & Notifications

**What changed:**
V2 features implemented: Email verification with disposable email blocking, In-app notifications system.

**Schema changes:**
- Added `isEmailVerified`, `emailVerificationToken`, `emailVerificationExpiry` to User model
- Added `isAffiliate` and `emailPreferences` fields back to User model
- Added `minWithdrawalAmount` back to AffiliateProfile model
- Fixed all Prisma relations (AuthToken, Address, Coupon, Product relations)

**Email verification:**
- Disposable email blocking (20+ domains blocked)
- Only reputable domains allowed (gmail, yahoo, outlook, etc.) OR valid domain structure
- 24-hour verification token expiry
- Resend verification option
- Verification link: GET/POST `/users/verify-email?token=xxx`
- Resend: POST `/users/resend-verification`

**Notification system:**
- Added notification endpoints to user controller/service
- GET `/users/notifications` - List notifications with pagination
- GET `/users/notifications/unread-count` - Get unread count
- PUT `/users/notifications/:id/read` - Mark single as read
- PUT `/users/notifications/read-all` - Mark all as read
- Uses existing UserNotification model (no new table needed)

**Files touched:**
- `backend/prisma/schema.prisma` (updated — email verification fields, relation fixes)
- `backend/src/services/auth.service.ts` (updated — email validation, verify, resend)
- `backend/src/services/email.service.ts` (new — nodemailer email sending with beautiful HTML templates)
- `backend/src/controllers/auth.controller.ts` (updated — verify-email, resend endpoints)
- `backend/src/services/user.service.ts` (updated — notification CRUD functions)
- `backend/src/controllers/user.controller.ts` (updated — notification endpoints)
- `backend/src/routes/users.routes.ts` (updated — new routes)
- `backend/src/docs/openapi.yml` (fixed — merged duplicate paths sections into single valid spec)
- `backend/src/routes/swagger.routes.ts` (fixed — moved /json route before swaggerUi.serve middleware)
- `backend/package.json` (added — @prisma/adapter-pg and pg for Prisma 7 PostgreSQL adapter)

**New endpoints:**
- `GET /users/verify-email` — Verify email with token
- `POST /users/verify-email` — Same (token in body)
- `POST /users/resend-verification` — Resend verification email
- `GET /users/notifications` — List user notifications
- `GET /users/notifications/unread-count` — Unread notification count
- `PUT /users/notifications/:id/read` — Mark as read
- `PUT /users/notifications/read-all` — Mark all as read

**Breaking change:** NO — backwards compatible

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