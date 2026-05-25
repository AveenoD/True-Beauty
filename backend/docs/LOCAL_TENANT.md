# Local multi-tenant testing (Phase 4)

Test two beauty shops on one machine **without buying domains**.

## 1. Database setup

```bash
cd backend
npm run db:tenant-foundation
npm run db:seed-local-tenants
npx prisma generate
```

## 2. Windows hosts file

Edit as Administrator: `C:\Windows\System32\drivers\etc\hosts`

```text
127.0.0.1  parlour-a.local
127.0.0.1  parlour-b.local
127.0.0.1  admin.parlour-a.local
127.0.0.1  admin.parlour-b.local
```

Fix typo if copied: use `127.0.0.1` for all lines.

Flush DNS (optional): `ipconfig /flushdns`

## 3. Environment

**Backend** `backend/.env`:

```env
DEV_DEFAULT_TENANT_SLUG=demo
ALLOW_TENANT_SLUG_HEADER=true
```

**Web** `frontend/True-Beauty-Web-main/.env.local` (optional):

```env
NEXT_PUBLIC_API_URL=http://localhost:9797
# Only if not using hostname-based slug:
# NEXT_PUBLIC_TENANT_SLUG=parlour-a
```

## 4. Run apps

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend/True-Beauty-Web-main && npm run dev
```

## 5. Two-tenant manual test

| Step | Shop A | Shop B |
|------|--------|--------|
| Open | http://parlour-a.local:3002 | http://parlour-b.local:3002 |
| Register | user@test.com | same email OK |
| Login other shop | same password → **must fail** | |
| API header | Auto `X-Tenant-Slug: parlour-a` from hostname | `parlour-b` |

## 6. Postman (Host-based, no slug)

```http
GET http://localhost:9797/store/products
Host: parlour-a.local
```

## 7. Dev tenant credentials

| Tenant | Admin email | Password | Slug |
|--------|-------------|----------|------|
| Parlour A | parlour-a@dev.local | Dev@1234 | parlour-a |
| Parlour B | parlour-b@dev.local | Dev@1234 | parlour-b |

Main admin (`admin@truebeauty.com`) keeps **localhost** / **127.0.0.1** mapping.

## Full regression checklist

See [TENANT_REGRESSION.md](./TENANT_REGRESSION.md).
