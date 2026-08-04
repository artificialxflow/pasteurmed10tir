# TODO v2 — Content & Catalog (Phase 2)

## Backend

- [x] Prisma models: Service, Laser, Nursing, Physician, Gallery, Product, Insurance, ConsultationType, SiteSettings, SpecialtyTariff, MediaAsset
- [x] Migration `002_content`
- [x] `scripts/seed-phase2.ts` from `lib/data.ts` + local `/uploads/` images
- [x] Public API: `/api/content/*`
- [x] Admin API: `/api/admin/content/*`
- [x] Image upload API: `POST /api/admin/upload` → `/uploads/` (Runflare disk)
- [x] Admin ImageUploadField on gallery, services, shop, nursing
- [x] Auto service href from title (`inferServiceHref`)

## Frontend wired

- [x] `/` services from API
- [x] `/laser`, `/nursing`, `/gallery`, `/shop/catalog`, `/medical/doctors`
- [x] `/account` insurance lists from API
- [x] Admin: services, laser, nursing, gallery, shop products, doctors (physicians), consultation-prices, insurances (lists), bookings fee, wallets settings

## Still mock (later phases)

- Bookings list, shop orders, insurance inquiries, admin patients, dental dentists CRUD

## Run locally

```powershell
npx prisma generate
npx prisma migrate dev --name 002_content
npm run db:seed:phase2
npm run dev
```

## Runflare after deploy

```powershell
npx prisma migrate deploy
npm run db:seed:phase2
```

**Persistent disk:** mount at `/app/public/uploads` (app: pasteur). After deploy run `npm run db:seed:phase2` — copies bundled images from `scripts/seed-assets/uploads/` (no internet needed).

## Done when

- [x] `npm run build` OK
- [ ] Manual tests phase 2 pass (see TEST-MANUAL.md)
- [ ] Live test on pasteur.plus (disk + upload)
- [ ] git commit
