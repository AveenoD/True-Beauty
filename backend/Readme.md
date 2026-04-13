# True Beauty SaaS — Multi-Tenant Rules & System Context

> These rules are **non-negotiable**. Every developer must follow them on every commit.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPER ADMIN (Platform Owner)              │
│  - Verifies Admins after plan purchase                        │
│  - Manages platform-wide SubscriptionPlans and PlanAddons     │
│  - Manages platform-wide WebThemes                            │
└─────────────────────────────────────────────────────────────┘
                              │ Verifies Admin
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN (Tenant = Business Owner)            │
│                                                              │
│  ADMIN ka UUID = TENANT ID                                    │
│                                                              │
│  Manages:                                                     │
│  - Products & Inventory                                       │
│  - Services                                                  │
│  - Coupons (with adminId)                                    │
│  - Orders & Returns/Exchanges                                 │
│  - Affiliates (KYC verification, withdrawals)                 │
│  - Notifications                                             │
│  - Social Media Links                                         │
│  - Subscription (purchase/renew)                             │
│  - Web Themes                                                │
│                                                              │
│  Becomes Admin:                                              │
│  1. User purchases plan (Starter/Professional/Enterprise)    │
│  2. Business details + Documents (GST/PAN) uploaded         │
│  3. Super Admin verifies                                     │
│  4. NEW Admin record created (separate from User record)    │
│  5. User → Admin panel access                                │
└─────────────────────────────────────────────────────────────┘
                              │ adminId (tenantId)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         USER (Customer)                      │
│                                                              │
│  Can be:                                                     │
│  - Customer (default)                                        │
│  - Affiliate (via /affiliate/apply)                          │
│  - Both (isAffiliate = true)                                 │
│                                                              │
│  User.adminId → Admin.id (tenant)                           │
│                                                              │
│  Manages own:                                                │
│  - Profile & Addresses                                       │
│  - Cart & Orders                                             │
│  - Wishlist & Reviews                                        │
│  - Service Bookings                                          │
│                                                              │
│  As Affiliate:                                               │
│  - Referral code & links                                     │
│  - Commission tracking                                       │
│  - Withdrawal requests (KYC required for withdrawal)         │
└─────────────────────────────────────────────────────────────┘
```

---

## The 10 Security Rules

### 1. Tenant Scope on Every Query — HIGHEST PRIORITY
Every Prisma query **MUST** filter by `tenantId`. No query should ever return data belonging to another tenant.

```typescript
// ❌ WRONG — no tenant filter (DATA LEAK)
const products = await prisma.product.findMany();

// ✅ CORRECT — tenant-scoped
const products = await prisma.product.findMany({
  where: { adminId: req.tenantId }
});
```

### 2. Auth Middleware Must Attach Tenant Context
Every authenticated request middleware must set `req.tenantId` from the authenticated user.

```typescript
// In authenticateUser middleware:
req.user = user;
req.userId = user.id;
req.tenantId = user.adminId ?? undefined; // Admin = tenant

// In authenticateAdmin middleware:
req.admin = admin;
req.adminId = admin.id;
req.tenantId = admin.id; // Admin IS the tenant
```

### 3. Verify Entity Naming in Every Query
Before writing a Prisma query, **double-check the model name** in `schema.prisma`.

```typescript
// ❌ WRONG — User model has adminId, not tenantId
const users = await prisma.user.findMany({ where: { tenantId } });

// ✅ CORRECT — User.adminId = Admin.id
const users = await prisma.user.findMany({ where: { adminId: req.tenantId } });

// ✅ CORRECT — Product.adminId = Admin.id
const products = await prisma.product.findMany({ where: { adminId: req.tenantId } });

// ✅ CORRECT — Address via User (User has adminId → tenant)
// No extra filter needed because Address → User → adminId
const addresses = await prisma.address.findMany({ where: { userId: req.userId } });
```

### 4. Input Validation with Zod
Every endpoint with a request body must validate with a Zod schema.

```typescript
const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
const data = schema.parse(req.body);
```

### 5. Role-Based Access Control (RBAC)
Define and enforce roles on every protected route.

```typescript
// Check role before allowing action
if (req.user?.role !== "admin") {
  return ApiResponse.forbidden(res, "Admin access required");
}
```

### 6. Rate Limiting
Protect auth and expensive endpoints with per-IP and per-user limits.

```typescript
router.post("/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), controller);
router.post("/register", rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }), controller);
```

### 7. Token Security
- Access tokens: **15 minute expiration**
- Refresh tokens: stored in DB with revocation support
- Implement **refresh token rotation** (invalidate old refresh token on use)

### 8. Audit Logging
Log all write operations with: `userId`, `tenantId`, `action`, `resource`, `resourceId`, `timestamp`.

```typescript
await prisma.auditLog.create({
  data: {
    userId: req.userId,
    tenantId: req.tenantId,
    action: "DELETE",
    resource: "ADDRESS",
    resourceId: addressId,
  }
});
```

### 9. No Raw SQL — Use Prisma Only
Query the database only through Prisma. No raw SQL to avoid injection.

### 10. Security Headers on Every Response
Use Helmet.js and restrict CORS origins.

```typescript
import helmet from "helmet";
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
```

---

## Multi-Tenant Query Patterns

### User → Tenant Flow (Indirect via User)

```
User.adminId = Admin.id (tenantId)
```

These models are tenant-scoped through User relationship — filter by `userId`:

```typescript
// Address: User → adminId (tenant)
// Filter by userId, NOT adminId directly
const addresses = await prisma.address.findMany({
  where: { userId: req.userId }
});

// Order: User → adminId (tenant)
// Filter by userId
const orders = await prisma.order.findMany({
  where: { userId: req.userId }
});

// CartItem: User → adminId (tenant)
// Filter by userId
const cartItems = await prisma.cartItem.findMany({
  where: { userId: req.userId }
});

// WishlistItem: User → adminId (tenant)
const wishlist = await prisma.wishlistItem.findMany({
  where: { userId: req.userId }
});

// ReviewRating: User → adminId (tenant)
const reviews = await prisma.reviewRating.findMany({
  where: { userId: req.userId }
});

// ServiceBooking: User → adminId (tenant)
const bookings = await prisma.serviceBooking.findMany({
  where: { userId: req.userId }
});

// ReturnRequest: User → adminId (tenant)
const returns = await prisma.returnRequest.findMany({
  where: { userId: req.userId }
});

// ExchangeRequest: User → adminId (tenant)
const exchanges = await prisma.exchangeRequest.findMany({
  where: { userId: req.userId }
});
```

### Direct Tenant Models (Filter by adminId)

```typescript
// Product: adminId = Admin.id (tenant)
const products = await prisma.product.findMany({
  where: { adminId: req.tenantId }
});

// MyService: adminId = Admin.id (tenant)
const services = await prisma.myService.findMany({
  where: { adminId: req.tenantId }
});

// Coupon: adminId = Admin.id (tenant)
const coupons = await prisma.coupon.findMany({
  where: { adminId: req.tenantId }
});

// Notification: adminId = Admin.id (tenant)
const notifications = await prisma.notification.findMany({
  where: { adminId: req.tenantId }
});

// SocialMediaManage: adminId = Admin.id (tenant)
const socialLinks = await prisma.socialMediaManage.findMany({
  where: { adminId: req.tenantId }
});

// Inventory: Product → adminId (tenant)
// First filter products by adminId, then get inventory
const products = await prisma.product.findMany({
  where: { adminId: req.tenantId },
  include: { inventory: true }
});
```

### Platform-Wide Models (NO tenant filter)

```typescript
// SubscriptionPlan: Platform-wide — no adminId
const plans = await prisma.subscriptionPlan.findMany({
  where: { isActive: true }
});

// PlanAddon: Platform-wide — no adminId
const addons = await prisma.planAddon.findMany({
  where: { isActive: true }
});

// WebTheme: Platform-wide — no adminId
const themes = await prisma.webTheme.findMany();
```

---

## User → Admin Flow (Industry Standard)

```
User registers (Customer)
  └── User record created (role: "customer", isAffiliate: false)

User applies for Affiliate
  └── User.isAffiliate = true
  └── User.referralCode = generated
  └── AffiliateProfile created

User purchases Plan → Becomes Admin
  1. Business details + Documents uploaded
  2. Super Admin verifies
  3. NEW Admin record created (separate table)
  4. Admin.subscription → activated
  5. User → Admin panel login (separate credentials)
  6. User.adminId → Admin.id (links user to their tenant)
```

---

## KYC Flow (Industry Standard)

```
Affiliate requests Withdrawal
  └── Admin sees pending KYC verification
  └── Admin verifies Affiliate's KYC documents
  └── (Only document URLs stored, NO Aadhar/PAN numbers)
  └── If KYC approved → Withdrawal approved
  └── If KYC rejected → Withdrawal rejected
```

**RULE: Never store Aadhar numbers or PAN numbers. Only store document URLs.**

---

## Complete Endpoint List

### Public Endpoints (No Auth Required)
| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/api/users/register` | Phone + OTP verification |
| POST | `/api/users/login` | Returns access + refresh tokens |
| POST | `/api/users/refresh-token` | Rotate refresh token |
| POST | `/api/users/forgot-password` | Send reset email |
| POST | `/api/users/reset-password` | Reset with token |
| GET | `/api/store/products` | Tenant-scoped (by domain/header) |
| GET | `/api/store/products/:id` | Tenant-scoped |
| GET | `/api/store/services` | Tenant-scoped |
| GET | `/api/store/services/:id` | Tenant-scoped |
| GET | `/api/plans` | Platform-wide |
| GET | `/api/plans/:id/addons` | Platform-wide |

### Protected Endpoints (Auth Required — User)
| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/api/users/logout` | Revoke tokens |
| GET | `/api/users/profile` | Own profile |
| PUT | `/api/users/profile` | Own profile |
| GET | `/api/users/addresses` | Own addresses |
| POST | `/api/users/addresses` | Own address |
| PUT | `/api/users/addresses/:id` | Own address |
| DELETE | `/api/users/addresses/:id` | Own address |

### Protected Endpoints (Auth Required — Admin)
| Method | Endpoint | Notes |
|--------|----------|-------|
| * | `/api/admin/*` | Admin-only routes |

---

## Verification Checklist

Before submitting any PR, verify:

- [ ] Every Prisma query has correct tenant filter (`adminId` or `userId` where applicable)
- [ ] `req.tenantId` is set in auth middleware for all authenticated routes
- [ ] Entity names match `schema.prisma` exactly
- [ ] Zod validation on all POST/PUT/PATCH requests
- [ ] Auth endpoints have rate limiting middleware
- [ ] Role checks on protected routes
- [ ] Audit logs for create/update/delete operations
- [ ] No raw SQL queries
- [ ] Security headers configured (Helmet, CORS)
- [ ] KYC never stores Aadhar/PAN numbers — only document URLs
- [ ] Coupon queries filter by `adminId` (tenant)
- [ ] Platform-wide models (SubscriptionPlan, PlanAddon) have no tenant filter
