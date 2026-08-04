# TEST-MANUAL — Phase 1 Auth

## Local (`npm run dev`)

| # | Path | Steps | Expected |
|---|------|-------|----------|
| 1 | `/account` | موبایل 09126723365 → دریافت کد → کد 00000 + نام → ورود | پنل کاربری |
| 2 | `/admin/login` | admin / pasteur1403 | داشبورد `/admin` |
| 3 | `/admin/login` | ops / ops1403 | رزروها ✅ — `/admin/access` ❌ |
| 4 | `/admin/bookings` | بدون login | redirect به login |
| 5 | `/account` | refresh بعد login | هنوز logged in |

## Live (Runflare — after deploy)

| # | URL | Steps | Expected |
|---|-----|-------|----------|
| 6 | `https://pasteur.plus/account` | همان فاز 1 | ورود OK |
| 7 | `https://pasteur.plus/admin/login` | admin / pasteur1403 | داشبورد |

## Env required on server

```
DEV_OTP_PHONE=09126723365
DEV_OTP_CODE=00000
DATABASE_URL=...internal...
SESSION_SECRET=...
```

## Admin sample accounts

| User | Password | Role |
|------|----------|------|
| admin | pasteur1403 | superadmin |
| ops | ops1403 | ops |
| content | content1403 | content |
| finance | finance1403 | finance |
