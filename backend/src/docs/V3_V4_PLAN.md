# True Beauty — V3 & V4 Implementation Plan

## Context

User wants to build V3 (Catalog & Basic Ecommerce) and V4 (Affiliate System) in phases. Current status: Phase 0 V1+V2 complete (auth, email verify, notifications). Frontend is static/mock. No admin panel exists. No database migrations run yet.

**User clarified:**
- V3: Products, Cart, Wishlist, Orders, Coupons, Payments (DUMMY), Basic Returns, Admin Product CRUD
- V4: Affiliate System using EXISTING tables (no new tables)
- Payment integration is LATER — V3 uses dummy payment stub
- Email resend limit: 3 per day (needs implementation)
- 24-hour email verification expiry: industry standard, keep it
- Before V4 coding: user wants table-by-table explanation of existing affiliate tables

---

## PHASE 1: V3 — Catalog & Basic Ecommerce

### Step 1.1 — Database Migrations (prisma migrate dev)
**File:** `backend/prisma/schema.prisma` already complete but NOT migrated.

Run `npx prisma migrate dev --name init` to create migration and apply to local DB.

### Step 1.2 — Admin Auth (Backend Only)
Before admin can CRUD products, admin needs auth.

**New files:**
- `backend/src/services/admin.service.ts`
- `backend/src/controllers/admin.controller.ts`
- `backend/src/routes/admin.routes.ts`

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/admin/auth/register` | Super admin creates admin account |
| POST | `/admin/auth/login` | Admin login → JWT tokens |
| POST | `/admin/auth/logout` | Revoke tokens |
| POST | `/admin/auth/refresh-token` | Token rotation |

**Implementation:** Same pattern as user auth but for Admin model. Store tokens in AuthToken table with adminId.

### Step 1.3 — Admin Onboarding Wizard (Backend + API)
**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/admin/onboarding/progress` | Get onboarding step (1-6) |
| PUT | `/admin/onboarding/business-details` | Store name, description, category, contact |
| PUT | `/admin/onboarding/payment-info` | Bank details for payouts |
| POST | `/admin/onboarding/documents` | Upload KYC (Aadhar/PAN file URL) |
| PUT | `/admin/onboarding/addons` | Select subscription addons |
| POST | `/admin/onboarding/complete` | Mark onboarding done, subscribe to plan |

**Implementation:** Updates AdminOnboardingProgress model. KYC documents stored as URLs (file upload handled separately).

### Step 1.4 — Admin Product CRUD
**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/admin/products` | List own products (paginated, filterable) |
| GET | `/admin/products/:id` | Get single product |
| POST | `/admin/products` | Create product (with inventory) |
| PUT | `/admin/products/:id` | Update product |
| DELETE | `/admin/products/:id` | Soft delete product (set deletedAt) |

**Multi-tenancy:** Every query MUST filter by `adminId` from auth token.

**Inventory auto-creation:** On product create, also create Inventory record with initial quantity.

**New service file:** `backend/src/services/product.service.ts`

### Step 1.5 — Admin Inventory Management
**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/admin/inventory` | List inventory (stock across products) |
| GET | `/admin/inventory/:id` | Get inventory details |
| PUT | `/admin/inventory/:id` | Update stock quantity (with InventoryLog entry) |

**InventoryLog:** Every stock change creates a log entry (increase/decrease, reason, reference).

### Step 1.6 — Public Product Listing (Update Existing)
**Update existing:** `GET /store/products` and `GET /store/products/:id`

Make dynamic — read from Product table instead of hardcoded catalog.

Add filters: `category`, `minPrice`, `maxPrice`, `search`, `sort`, `order`.

Add pagination.

### Step 1.7 — Product Categories
**Schema:** Add `ProductCategory` model to Prisma (name, slug, description, image, isActive).

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/store/categories` | Public list of categories |
| GET | `/admin/categories` | Admin list |
| POST | `/admin/categories` | Create category |
| PUT | `/admin/categories/:id` | Update category |
| DELETE | `/admin/categories/:id` | Delete category |

### Step 1.8 — Cart Management
**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/users/cart` | Get user's cart with product details |
| POST | `/users/cart/items` | Add item (productId, quantity) |
| PUT | `/users/cart/items/:id` | Update quantity |
| DELETE | `/users/cart/items/:id` | Remove item |
| DELETE | `/users/cart` | Clear cart |

**Implementation:** Use existing CartItem model. Cart is per-user. Auto-calculates subtotal.

**New service file:** `backend/src/services/cart.service.ts`

### Step 1.9 — Wishlist
**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/users/wishlist` | List wishlist items |
| POST | `/users/wishlist` | Add product to wishlist |
| DELETE | `/users/wishlist/:productId` | Remove from wishlist |

**Implementation:** Use existing WishlistItem model.

### Step 1.10 — Admin Coupon Management
**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/admin/coupons` | List coupons (own) |
| POST | `/admin/coupons` | Create coupon |
| GET | `/admin/coupons/:id` | Get coupon details |
| PUT | `/admin/coupons/:id` | Update coupon |
| DELETE | `/admin/coupons/:id` | Soft delete |
| POST | `/admin/coupons/:id/toggle-active` | Activate/deactivate |

**New service file:** `backend/src/services/coupon.service.ts`

### Step 1.11 — User Coupon Validation & Application
**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/users/coupons/validate` | Validate coupon code against cart |
| POST | `/users/orders/apply-coupon` | Apply validated coupon to order |

**Validation logic:** Check coupon exists, isActive, not expired, usage limits, minimum order amount, applicable role (all/customers/affiliate), applicable products/categories.

### Step 1.12 — Order Management
**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/users/orders` | Place order from cart (creates Order + OrderItems, clears cart) |
| GET | `/users/orders` | List user orders (paginated) |
| GET | `/users/orders/:id` | Order details with items |
| POST | `/users/orders/:id/cancel` | Cancel order (if status = pending/confirmed) |
| GET | `/admin/orders` | Admin list all orders |
| GET | `/admin/orders/:id` | Admin get order details |
| PUT | `/admin/orders/:id/status` | Update order status (pending→confirmed→preparing→shipped→out_for_delivery→delivered) |
| POST | `/admin/orders/:id/cancel` | Admin cancel order |

**On place order:**
1. Validate cart not empty
2. Check product stock
3. Apply coupon if any
4. Calculate subtotal, discount, tax, shipping, total
5. Create Order record
6. Create OrderItem records
7. Deduct inventory (update Inventory.availableQty, create InventoryLog)
8. Clear user's cart
9. If affiliate referred — create PendingCommission record (V4 feature stub)

**New service file:** `backend/src/services/order.service.ts`

### Step 1.13 — Payment Integration (DUMMY)
**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/payments/initiate` | Create payment order (returns mock payment URL) |
| POST | `/payments/verify` | Verify payment (mock success) |
| GET | `/users/orders/:id/payment` | Get payment status |

**DUMMY implementation:** Initiate returns a mock transaction ID. Verify marks payment as "paid" regardless of input. Razorpay/Stripe integration to be added later.

**NOTE:** No money changes hands in V3. Just the flow is built.

### Step 1.14 — Basic Returns
**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/users/returns` | Create return request |
| GET | `/users/returns` | List own return requests |
| GET | `/users/returns/:id` | Return request details |

**Admin side (basic):**
| Method | Path | Description |
|---|---|---|
| GET | `/admin/returns` | List all returns |
| PUT | `/admin/returns/:id/status` | Approve/reject return |

**Flow:** User creates return → admin approves → refund initiated (V3 is basic, full refund flow in V4).

**New service file:** `backend/src/services/return.service.ts`

### Step 1.15 — Service Bookings (Admin + User)
**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/admin/services` | Admin CRUD services |
| POST | `/admin/services` | Create service |
| PUT | `/admin/services/:id` | Update service |
| DELETE | `/admin/services/:id` | Soft delete |

| Method | Path | Description |
|---|---|---|
| GET | `/store/services` | List public services |
| GET | `/store/services/:id` | Service details |
| POST | `/users/service-bookings` | Book a service |
| GET | `/users/service-bookings` | List bookings |
| GET | `/users/service-bookings/:id` | Booking details |

**Admin:**
| Method | Path | Description |
|---|---|---|
| GET | `/admin/service-bookings` | List all bookings |
| PUT | `/admin/service-bookings/:id/status` | Update booking status |

---

## PHASE 2: V4 — Affiliate System

### Existing Affiliate Tables (User's Clarification)
User confirms: existing tables are sufficient, NO new tables needed.

**Existing tables and their purpose:**

| Table | Purpose |
|---|---|
| `AffiliateProfile` | Stores affiliate's commissionRate, walletBalance, totalEarnings, totalWithdrawals, bank details (upiId, bankName, accountNumber, ifscCode). One per user. Created when user applies. |
| `AffiliateReferralTracking` | Records each referral — who referred whom, via which link, when they converted (signed up), which order they placed. Tracks referral source (whatsapp/facebook/instagram/etc). |
| `AffiliateEarning` | Individual earning records — created when a referred user places an order. Contains amount, type (order_commission or manual_adjustment), orderId, description. Immutable log. |

### What V4 Needs (using existing tables)

**User Affiliate Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/users/affiliate/apply` | Apply as affiliate (creates AffiliateProfile, returns referralCode) |
| GET | `/users/affiliate/profile` | Get own affiliate profile + stats |
| PUT | `/users/affiliate/bank-details` | Update UPI/bank details for withdrawal |
| GET | `/users/affiliate/referrals` | List referral history with conversion status |
| GET | `/users/affiliate/earnings` | List earnings (paginated) |
| POST | `/users/affiliate/withdraw` | Request withdrawal (creates WithdrawalRequest) |
| GET | `/users/affiliate/withdrawals` | List own withdrawal requests |
| GET | `/users/affiliate/wallet` | Current wallet balance + recent ledger |

**Admin Affiliate Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/admin/affiliate/affiliates` | List all affiliates |
| GET | `/admin/affiliate/affiliates/:id` | Affiliate details + stats |
| GET | `/admin/affiliate/withdrawals` | List withdrawal requests |
| PUT | `/admin/affiliate/withdrawals/:id/status` | Approve/reject/pay withdrawal |
| PUT | `/admin/affiliate/affiliates/:id/commission` | Set/update commission rate |

### KYC for Affiliates
| Method | Path | Description |
|---|---|---|
| POST | `/users/kyc` | Upload KYC documents (Aadhar/PAN) |
| GET | `/users/kyc` | Get KYC status |
| GET | `/admin/kyc` | Admin list KYC pending |
| PUT | `/admin/kyc/:id/verify` | Admin verify KYC |

### Affiliate Logic Details

**Commission calculation:**
- On order completion (after return window of 7 days), calculate commission
- Per product: `product.price * product.commissionRate / 100`
- Sum all products' commissions → `AffiliateEarning` record created
- Add to `AffiliateProfile.walletBalance`
- If affiliate referred the order user → create `AffiliateReferralTracking` entry

**PendingCommission (using existing structure):**
- When order is placed, DON'T immediately credit commission
- Commission is "pending" — shown in affiliate dashboard
- After 7-day return window → convert to confirmed earning
- If return requested → commission is cancelled/reversed

**Wallet double-entry:**
- `AffiliateEarning` is the immutable log (already exists)
- `walletBalance` on `AffiliateProfile` is the current balance (cached, not source of truth)
- Source of truth = SUM of AffiliateEarning.amount minus SUM of WithdrawalRequest.amount

**Withdrawal flow:**
1. User requests withdrawal (must have walletBalance >= minWithdrawalAmount, KYC verified)
2. `WithdrawalRequest` created (status: pending)
3. Admin approves → status: approved → payment initiated → status: paid
4. Or admin rejects → status: rejected
5. On paid: deduct from walletBalance, add WithdrawalAudit entry

---

## FIXES NEEDED DURING V3

### Email Resend Limit (3 per day)
**Current:** No limit on email verification resend.
**Fix:** Add `emailVerificationAttempts` field to User model.

**Implementation:**
- Add `emailVerificationAttempts` (Int, default 0) to User
- Add `lastEmailVerificationSentAt` (DateTime) to User
- On resend: check if attempts >= 3 in last 24 hours → reject with "Daily limit reached"
- On successful verification: reset attempts to 0
- If attempts < 3: increment count, update timestamp, send email

**Schema change:**
```prisma
// Add to User model:
emailVerificationAttempts      Int          @default(0)
lastEmailVerificationSentAt   DateTime?
```

### 24-Hour Verification Expiry
Industry standard. Keep it. Most platforms use 24h (Google, GitHub, etc). Some use 48h. 24h is appropriate for True Beauty.

---

## Files to Create/Modify

### New Files (V3)
- `backend/src/services/admin.service.ts`
- `backend/src/services/onboarding.service.ts`
- `backend/src/services/product.service.ts`
- `backend/src/services/category.service.ts`
- `backend/src/services/inventory.service.ts`
- `backend/src/services/coupon.service.ts`
- `backend/src/services/order.service.ts`
- `backend/src/services/payment.service.ts`
- `backend/src/services/return.service.ts`
- `backend/src/services/booking.service.ts`
- `backend/src/controllers/admin.controller.ts`
- `backend/src/controllers/onboarding.controller.ts`
- `backend/src/controllers/product.controller.ts`
- `backend/src/controllers/category.controller.ts`
- `backend/src/controllers/inventory.controller.ts`
- `backend/src/controllers/coupon.controller.ts`
- `backend/src/controllers/order.controller.ts`
- `backend/src/controllers/payment.controller.ts`
- `backend/src/controllers/return.controller.ts`
- `backend/src/controllers/booking.controller.ts`
- `backend/src/routes/admin.routes.ts`
- `backend/src/routes/onboarding.routes.ts`
- `backend/src/routes/product.routes.ts`
- `backend/src/routes/category.routes.ts`
- `backend/src/routes/inventory.routes.ts`
- `backend/src/routes/coupon.routes.ts`
- `backend/src/routes/order.routes.ts`
- `backend/src/routes/payment.routes.ts`
- `backend/src/routes/return.routes.ts`
- `backend/src/routes/booking.routes.ts`

### Schema Changes (V3)
- Add to User: `emailVerificationAttempts`, `lastEmailVerificationSentAt`
- Add `ProductCategory` model
- Add `WithdrawalAudit` relation fix (already exists in schema)
- Add indexes on frequently queried fields

### V4 New/Updated Files
- `backend/src/services/affiliate.service.ts` (update existing)
- `backend/src/controllers/affiliate.controller.ts` (new)
- `backend/src/routes/affiliate.routes.ts` (new)
- `backend/src/services/withdrawal.service.ts` (new)
- `backend/src/services/kyc.service.ts` (new)
- `backend/src/routes/kyc.routes.ts` (new)

---

## Verification Plan

**Backend (V3):**
1. Run `npx prisma migrate dev --name init` — verify DB schema created
2. Test each endpoint via Swagger `/docs`
3. Admin can: register → login → create product → view inventory → create coupon
4. User can: login → add to cart → apply coupon → place order → request return
5. Admin can: view order → update status → approve return
6. Payment initiate → verify → order marked paid

**Frontend (V3):**
1. Connect login/register to backend (replace localStorage mock)
2. Product listing page → call `/store/products`
3. Cart page → call `/users/cart` endpoints
4. Checkout → call `/users/orders`
5. Admin panel → product CRUD, order management

**V4 (Affiliate):**
1. User applies for affiliate → AffiliateProfile created
2. Refer another user via link with `?ref=CODE`
3. Place order → AffiliateReferralTracking created
4. After 7 days → AffiliateEarning created, walletBalance updated
5. Request withdrawal → WithdrawalRequest created
6. Admin approves → walletBalance deducted

---

## Order of Implementation

1. **Database migration** (prerequisite for everything)
2. **Email resend limit fix** (quick fix, applies to existing code)
3. **Admin auth** (enables all admin features)
4. **Admin onboarding** (so new admins can set up store)
5. **Admin product CRUD + inventory** (core catalog)
6. **Public products** (make dynamic from DB)
7. **Cart + wishlist** (user features)
8. **Admin coupon management**
9. **User coupon validation + order placement**
10. **Payment (dummy)**
11. **Basic returns**
12. **V4: Affiliate system**
