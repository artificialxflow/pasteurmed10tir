# TEST-MANUAL — Phase 1 Auth

## Local (`npm run dev`)

| # | Path | Steps | Expected | ✓ |
|---|------|-------|----------|---|
| 1 | `/account` | موبایل 09126723365 → دریافت کد → کد 00000 + نام → ورود | پنل کاربری | [x] |
| 2 | `/admin/login` | admin / pasteur1403 | داشبورد `/admin` | [x] |
| 3 | `/admin/login` | ops / ops1403 | رزروها ✅ — `/admin/access` ❌ | [x] |
| 4 | `/admin/bookings` | بدون login | redirect به login | [x] |
| 5 | `/account` | refresh بعد login | هنوز logged in | [x] |

## Live (Runflare — after deploy)

| # | URL | Steps | Expected | ✓ |
|---|-----|-------|----------|---|
| 6 | `https://pasteur.plus/account` | همان فاز 1 | ورود OK | [x] |
| 7 | `https://pasteur.plus/admin/login` | admin / pasteur1403 | داشبورد | [x] |

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

---

## Phase 2 — Content & catalog

| UI | Path | Admin | Expected |
|----|------|-------|----------|
| Home | `/` | `/admin/services` edit title → save | Change visible on `/` |
| Laser | `/laser` | `/admin/laser-services` add item | New item on site |
| Gallery | `/gallery` | `/admin/gallery` | Upload or `/uploads/` paths load |
| Nursing | `/nursing` | `/admin/nursing-services` | Price on item select |
| Shop | `/shop/catalog` | `/admin/shop` add product + image upload | Product visible |
| Services | `/` | `/admin/services` add «لیزر» | href auto `/laser`, image upload works |
| Medical | `/medical/doctors?specialty=internal` | `/admin/doctors` | Physicians from DB |
| Account | `/account` | `/admin/insurances` add company | Dropdown updated |

### Image upload test

1. Login admin → `/admin/gallery`
2. Click **انتخاب فایل** on before/after → pick jpg
3. Expected: path like `/uploads/1730-abc.jpg`, preview shows, save → `/gallery` loads image
4. On Runflare: file persists after redeploy (disk mounted at `/app/public/uploads`)

Run seed first: `npm run db:seed:phase2`
