# TODO v1 — Auth & RBAC (Phase 1)

## Backend

- [x] Prisma schema: User, PatientProfile, AdminRole, AdminUser
- [x] API: OTP send/verify, patient me/profile/logout
- [x] API: admin login/me/logout
- [x] Seed: admin, ops, content, finance + dev patient 09126723365
- [x] AccountPage → API (OTP)
- [x] Admin login + AdminShell → API

## Before first run

```powershell
npm install
npx prisma migrate dev --name 001_auth
npx prisma db seed
npm run dev
```

## Runflare deploy

1. Set env from `.env.production` (include DEV_OTP for build phase)
2. `npx prisma migrate deploy`
3. `npx prisma db seed` (first time only)
4. Redeploy / restart app

## Manual tests

See `TEST-MANUAL.md`

## Done when

- [x] Local tests 1–5 pass
- [x] Live tests 6–7 on pasteur.plus pass
- [ ] git commit
