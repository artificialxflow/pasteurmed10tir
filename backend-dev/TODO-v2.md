# TODO v2 — Content & Catalog (Phase 2)

## Backend

- [x] Prisma models: Service, Laser, Nursing, Physician, Gallery, Product, Insurance, ConsultationType, SiteSettings, SpecialtyTariff, MediaAsset
- [x] Migration `002_content`
- [x] `scripts/seed-phase2.ts` from `lib/data.ts` + local `/uploads/` images
- [x] Public API: `/api/content/*`
- [x] Admin API: `/api/admin/content/*`

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

## Done when

- [ ] Manual tests phase 2 pass (see TEST-MANUAL.md)
- [ ] `npm run build` OK
- [ ] Live test on pasteur.plus
- [ ] git commit
