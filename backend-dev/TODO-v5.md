# TODO v5 — Club, Cleanup & Deploy Prep (Phase 5)

## Backend

- [x] Prisma models: `ClubProfile`, `ClubHistoryItem`
- [x] Migration `005_loyalty` (`20260805050000_005_loyalty`)
  - Note: if migrate history drifts, use `npx prisma db push` then `npx prisma migrate resolve --applied 20260805050000_005_loyalty` (same pattern as phase 4)
- [x] `scripts/seed-phase5.ts` + `npm run db:seed:phase5`
- [x] Club API: `/api/club/profile`, `/api/club/brush`, `/api/club/redeem`
- [x] Admin: `/api/admin/commerce/club`
- [x] Brush rules: +5 pts, max 3/day, 8h cooldown
- [x] Booking → +50 club points + visit; commission → referral +100 once
- [x] `scripts/reset-all.ts` (+ `npm run db:reset-all`) — requires `--confirm`; keeps AdminRole/AdminUser

## Frontend

- [x] `/club` + `/app/club` wired to API (Instagram CTA unchanged)
- [x] Admin club table from API
- [x] MembershipPage modals close on backdrop click
- [x] Admin doctors: inline message instead of `window.alert`

## Docs

- [x] README Runflare deploy section
- [x] TEST-MANUAL phase 5
- [x] This TODO

## Run locally

```powershell
npx prisma generate
npx prisma migrate deploy
# if needed: npx prisma db push; npx prisma migrate resolve --applied 20260805050000_005_loyalty
npm run db:seed
npm run db:seed:phase5
npm run dev
```

## Reset (dev/staging ONLY)

```powershell
npx tsx scripts/reset-all.ts --confirm
# then re-seed
npm run db:seed
npm run db:seed:phase2
npm run db:seed:phase3
npm run db:seed:phase4
npm run db:seed:phase5
```

## Runflare after deploy

```powershell
npx prisma migrate deploy
npm run db:seed:phase5
```

## Done when

- [x] reset-all works (local; requires --confirm)
- [x] TEST-MANUAL includes phase 5
- [ ] Staging deploy on Runflare + migrate + seed
- [ ] git commit
