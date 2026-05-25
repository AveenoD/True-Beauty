# Tenant regression checklist (Phases 1–4)

Run after `db:tenant-foundation` and `db:seed-local-tenants`. Replace `SLUG` with your admin slug (e.g. `parlour-a`, `true-beauty-admin`).

## Setup

- [ ] Backend `npm run dev` on port 9797
- [ ] Frontend on 3002 (or your port)
- [ ] `hosts` file entries for `*.local` (if testing Host resolution)

## Phase 1 — DB

- [ ] `node list-users-tenants.js` — no `adminId=(null)`
- [ ] Same email can exist on two tenants (register on A and B)

## Phase 2 — Tenant resolve

- [ ] `POST /users/login` + `X-Tenant-Slug: SLUG` — success
- [ ] `GET /store/products` + `Host: parlour-a.local` — products for A only
- [ ] Wrong slug / unknown host — 404 tenant not found
- [ ] `localhost` without slug (dev) — works if `tenant_domain` + `DEV_DEFAULT_TENANT_SLUG` set

## Phase 3 — User ↔ tenant

- [ ] User A token + `X-Tenant-Slug: parlour-b` on `GET /cart` — **403**
- [ ] Login A credentials on B tenant — **invalid credentials**
- [ ] `POST /users/refresh-token` with wrong tenant — fails
- [ ] `POST /coupon/apply` — no client `adminId`; uses tenant from header/host
- [ ] `/payments` or `/returns` without tenant header — **400** tenant missing

## Phase 4 — Two local shops

- [ ] http://parlour-a.local:3002 — header/storage `parlour-a`
- [ ] http://parlour-b.local:3002 — header/storage `parlour-b`
- [ ] Register same email on both — both succeed
- [ ] Carts/orders isolated per shop

## Admin (unchanged)

- [ ] Admin panel login `admin@truebeauty.com` — products CRUD still works
- [ ] Admin JWT routes do not need `X-Tenant-Slug`

## Notes

Failures → note endpoint, headers, response body. Fix in code or env, re-run affected rows only.
