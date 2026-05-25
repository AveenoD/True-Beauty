# Phase 4 — Local multi-tenant UX

## Delivered

- **`npm run db:seed-local-tenants`** — dev admins `parlour-a` / `parlour-b` + `*.local` `tenant_domain` rows
- **`LOCAL_TENANT.md`** — hosts file, URLs, env
- **`TENANT_REGRESSION.md`** — manual QA checklist for Phases 1–4
- **Frontend `TenantBootstrap`** — derives slug from `parlour-a.local` and `admin.parlour-a.local`

## Not included

- Automated Jest/supertest suite (manual checklist only)
- Production DNS or SuperAdmin domain UI (Phase 5)
