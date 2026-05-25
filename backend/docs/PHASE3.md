# Phase 3 — User ↔ tenant auth hardening

## What it does

1. **`assertTenantUser`** — After login, every protected request checks `req.user.adminId === req.tenantAdminId`. Mismatch → **403** `Access denied for this store`.

2. **`authenticateTenantUser`** — `[authenticateUser, assertTenantUser]` used on protected routers.

3. **Routes updated**
   - `/users/*` protected block
   - `/cart`, `/wishlist`, `/orders`
   - `/payments`, `/returns` (also gained `requireTenant`)
   - `/store/products/:id/can-review` and `reviews`
   - `/coupon/apply` — uses `req.tenantAdminId` (not client `adminId` in body)

4. **Cart** — `addToCart` / `update` / `remove` only touch products for the current tenant.

5. **Refresh token** — `/users/refresh-token` rejects refresh if user's `adminId` does not match resolved tenant.

## Middleware order (new endpoints)

```ts
router.use(requireTenant);
router.use(authenticateTenantUser); // or ...authenticateTenantUser per route
```

Public auth (register/login) stays: `requireTenant` only.
