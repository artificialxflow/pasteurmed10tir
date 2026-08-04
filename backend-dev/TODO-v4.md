# TODO v4 — Commerce & Finance (Phase 4)

## Backend

- [x] Prisma models: MembershipPlan, Member, MembershipApplication, Wallet, WalletTransaction, ShopOrder, Visitor, Commission, FacilityRequest, InstallmentPlan
- [x] Migration `004_commerce` (`20260804180000_004_commerce`)
- [x] `scripts/seed-phase4.ts` + `npm run db:seed:phase4`
- [x] Wallet ceilings from SiteSettings: regular 15M / membership VIP 30M / shop VIP 20M (max)
- [x] Patient/public API under `/api/commerce/*` with IDOR on wallet + installments
- [x] Admin API under `/api/admin/commerce/*` with permission gates
- [x] Booking referral → commission on create booking API
- [x] Payment mock: membership + shop-vip via API (`completePaymentAsync`)

## Frontend wired

- [x] MembershipPage — plans, visitor lookup, applications → API
- [x] PaymentFlow — membership / shop-vip / booking DB paths
- [x] WalletPage — `/api/commerce/wallet` (requires patient session)
- [x] InstallmentsPage — `/api/commerce/installments`
- [x] ShopCart submitOrderAsync → orders API; stock decrement
- [x] ShopVip / ShopFacility → shop-vip check + facilities API
- [x] Admin: memberships, wallets, shop orders, visitors, commissions, facilities, installments

## Still mock / later

- Real payment gateway
- Club points on commission referral (still localStorage club)
- Cart remains localStorage (session UX)

## Run locally

```powershell
npx prisma generate
npx prisma migrate deploy
# if history drifts: npx prisma db push then migrate resolve --applied 20260804180000_004_commerce
npm run db:seed
npm run db:seed:phase4
npm run dev
```

## Runflare after deploy

```powershell
npx prisma migrate deploy
npm run db:seed:phase4
```

## Done when

- [ ] Manual tests phase 4 pass (see TEST-MANUAL.md)
- [ ] Live deploy + seed on Runflare
- [ ] git commit
