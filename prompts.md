# Backend Roadmap Prompts — Pasteur Plus

> **Stack:** PostgreSQL + Prisma + Next.js | **NOT Supabase**  
> Frontend is complete (~70 routes). Replace `PasteurStorage` (localStorage mock) with API + DB.  
> **Do not redesign UI** — wire existing pages to real backend.

**Project snapshot (2026-08-16):**

| Area | Status |
|------|--------|
| Phases 1–5 (this file) | ✅ Code + migrations `001`–`005` |
| Phase 6 SMS + Zohal | ✅ Live (`006_sms_zohal`) — see `todo-v6.md` |
| Phase 7 Zibal payment | ✅ Code (`007_zibal`) — live test pending |
| Phase 8 Content fix | ✅ Surgery card (`008_surgery_service`) |
| Go-Live ops | 🟨 CRON, SESSION, DEV_OTP removal — `GO-LIVE.md` |
| **Phase R Real data** | ⬜ **Next** — de-fake DB + remove mock fallbacks |

**Active checklist:** `todo-v6.md` · **Deploy steps:** `backend-dev/GO-LIVE.md`

---

## Prompt language — English or Persian?

| | English prompt | Persian prompt |
|---|----------------|----------------|
| **Cursor code quality** | ✅ Usually better — models trained heavily on English code/docs | ⚠️ Sometimes vague or wrong field names |
| **Your site is Persian (fa-IR)** | No conflict — UI text stays Persian in components | UI language does not require Persian prompts |
| **Prisma / SQL / API** | Always English identifiers anyway | Mixed language adds confusion |

**Recommendation:** Copy the **English block** into Cursor Agent mode. Read the **Persian block** below each prompt to understand what should happen and how to verify completion.

---

## Database connections — Runflare Postgres

> **Security:** Prefer `.env.local` / Runflare panel for secrets — **do not commit passwords**.  
> This file may contain example URIs; rotate credentials if ever pushed to a public repo.

| URI | When to use |
|-----|-------------|
| **Internal** | App running **on Runflare** (same private network as DB service) |
| **Remote** | **Windows dev**, **Kali local**, Cursor on your machine, `prisma migrate` from outside Runflare |

### Internal URI (Runflare app → DB)

```
postgresql://postgres:dKuNIi3n52lSSpgAKptg@pasteurplusdb-jkc-service:5432/pasteurpods_db
```

Host `pasteurplusdb-jkc-service` resolves **only inside Runflare** — not from your PC.

### Remote URI (dev machine / Kali / Windows Server)

```
postgresql://postgres:dKuNIi3n52lSSpgAKptg@remote-pishgaman.runflare.com:32536/pasteurpods_db
```

Use this for local development, migrations, and `prisma db seed` from Cursor.

### Database name

Both URIs use database: **`pasteurpods_db`** (single DB for now — dev + prod can share during build; split later if needed).

---

## Env files — `.env.local` vs `.env.production`

> **No quotes** on values — copy-paste friendly for Runflare panel.  
> **Build phase:** same dev OTP on PC **and** live Runflare server. Remove OTP vars at go-live → `backend-dev/GO-LIVE.md`.

| | `.env.local` | `.env.production` (Runflare — build phase) |
|---|--------------|---------------------------------------------|
| **Where** | PC (Windows / Cursor / Kali) | Runflare panel or server file |
| **DB URI** | Remote | Internal |
| **Site URL** | http://localhost:3000 | https://pasteur.plus |
| **Dev OTP** | 09126723365 / 00000 | **Same** — for live server testing now |
| **Git commit** | Never | Never |

### `.env.local` (dev on your PC)

```
DATABASE_URL=postgresql://postgres:dKuNIi3n52lSSpgAKptg@remote-pishgaman.runflare.com:32536/pasteurpods_db
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SESSION_SECRET=pasteur-dev-session-change-in-production
DEV_OTP_PHONE=09126723365
DEV_OTP_CODE=00000
NODE_ENV=development
```

### `.env.production` (Runflare — copy into env panel)

```
DATABASE_URL=postgresql://postgres:dKuNIi3n52lSSpgAKptg@pasteurplusdb-jkc-service:5432/pasteurpods_db
NEXT_PUBLIC_SITE_URL=https://pasteur.plus
SESSION_SECRET=CHANGE-ME-strong-random-secret-min-32-chars-production-only
DEV_OTP_PHONE=09126723365
DEV_OTP_CODE=00000
NODE_ENV=production
```

### Runflare panel — key / value (no quotes)

| Key | Value |
|-----|--------|
| DATABASE_URL | postgresql://postgres:dKuNIi3n52lSSpgAKptg@pasteurplusdb-jkc-service:5432/pasteurpods_db |
| NEXT_PUBLIC_SITE_URL | https://pasteur.plus |
| SESSION_SECRET | (strong random string — change before public go-live) |
| DEV_OTP_PHONE | 09126723365 |
| DEV_OTP_CODE | 00000 |
| NODE_ENV | production |

After adding/changing vars → **redeploy / restart** the app on Runflare.

### Runflare persistent disk (images)

| Field | Value |
|-------|--------|
| Size | 0.5–1 GB (cannot shrink later) |
| Directory path | `/app/public/uploads` |
| Application | pasteur (Next.js web app) |

After mount → restart app → `npm run db:seed:phase2` in Runflare terminal (empty disk hides git-baked images).

Optional env override: `UPLOAD_DIR=/app/public/uploads` (default matches mount path).

---

## Phase 0 — Infrastructure (YOU — no Cursor)

### English checklist

```
Phase 0 — do manually before any Cursor prompt:

1. Postgres ready on Runflare (pasteurpods_db)
2. Create .env.local in project root — content above (REMOTE, no quotes)
3. Set Runflare env panel from .env.production (INTERNAL + DEV_OTP for live testing, no quotes)
4. After deploy: test https://pasteur.plus/account with 09126723365 / 00000
5. Before public go-live: remove DEV_OTP_* — see backend-dev/GO-LIVE.md
6. Never commit .env.local or .env.production — only .env.example
7. Test after Phase 1: npx prisma migrate dev (uses .env.local remote)
```

### فارسی — فاز ۰

```
فاز ۰:

۱. دیتابیس pasteurpods_db آماده است
۲. .env.local روی PC — Remote (بدون کوتیشن)
۳. پنل Runflare — از .env.production کپی کن (Internal + DEV_OTP برای تست روی سرور زنده)
۴. بعد deploy: تست https://pasteur.plus/account با 09126723365 / 00000
۵. قبل لانچ عمومی: DEV_OTP_* را حذف کن — backend-dev/GO-LIVE.md
۶. commit نشود — فقط .env.example
۷. بعد فاز ۱: npx prisma migrate dev
```

### Which URI where? / کدام URI کجا؟

| محیط | DATABASE_URL |
|------|----------------|
| Cursor روی Windows Server | **Remote** (.env.local) |
| Kali لوکال | **Remote** (.env.local) |
| Runflare deploy | **Internal** (panel / .env.production) |
| `npx prisma migrate dev` از PC | **Remote** |
| `npx prisma migrate deploy` روی Runflare | **Internal** |

### ✅ Phase 0 complete when / تکمیل فاز ۰

- [x] `.env.local` exists with **remote** URI (no quotes)
- [x] Runflare panel has **internal** vars + **DEV_OTP** from `.env.production`
- [x] Live test: https://pasteur.plus/account with 09126723365 / 00000 (after Phase 1)
- [x] Neither env file is in git
- [x] Connection OK after Phase 1 migrate
- [ ] `SESSION_SECRET` + `CRON_SECRET` production-strong on Runflare — `GO-LIVE.md`

---

## Phase 1 — Auth & RBAC

### English prompt (paste into Cursor Agent)

```
PHASE 1 ONLY — Auth & RBAC for pasteurmed10tir

Stack: PostgreSQL + Prisma. NO Supabase.

Context:
- Next.js 16 frontend is complete (~70 routes)
- All data currently in lib/storage.ts (PasteurStorage) — mock/localStorage
- DO NOT change UI layout/design — only wire auth to API
- Reference files: lib/adminAccess.ts, lib/routes.ts, lib/storage.ts,
  components/account/AccountPage.tsx, app/admin/login/page.tsx,
  components/admin/AdminShell.tsx

Tasks:
1. Install: prisma @prisma/client bcryptjs (dev: prisma)

2. Create prisma/schema.prisma:
   - User (id, phone unique, name, role enum PATIENT|ADMIN)
   - AdminRole (id, name, description?, permissions String[])
   - AdminUser (id, username unique, passwordHash, roleId, displayName, active)
   - PatientProfile (userId unique, nationalId?, baseInsuranceId?, complementaryInsuranceId?,
     franchisePercent, status enum pending|approved|rejected, createdAt, updatedAt)
   Match roles from lib/adminAccess.ts: superadmin, ops, content, finance

3. lib/prisma.ts — singleton client

4. prisma/seed.ts:
   - admin → superadmin (password from ADMIN-CREDENTIALS.local.json)
   - ops, content, finance (same file)
   - dev patient: phone 09126723365, name "کاربر تست"

5. API routes (app/api/):
   - POST /api/auth/otp/send — when DEV_OTP_PHONE is set in env, only that phone accepts OTP
   - POST /api/auth/otp/verify — when DEV_OTP_CODE is set, accept it; httpOnly session cookie
   - OTP mock MUST work when DEV_OTP_* env vars exist — even if NODE_ENV=production (Runflare live testing)
   - When DEV_OTP_* are absent (go-live), OTP mock is disabled — real SMS hook later
   - GET /api/auth/me, POST /api/auth/logout
   - POST /api/admin/login, GET /api/admin/me

6. Wire frontend MINIMALLY (same UI):
   - AccountPage → patient auth API
   - app/admin/login → admin API
   - AdminShell → session from API, permission checks preserved

7. Create:
   - .env.example
   - backend-dev/TODO-v1.md
   - backend-dev/TEST-MANUAL.md (phase 1 tests: local + https://pasteur.plus)
   - backend-dev/GO-LIVE.md (remove DEV_OTP before public launch)

8. Run: npx prisma migrate dev --name 001_auth && npx prisma db seed

Dev OTP policy (IMPORTANT):
- Works on BOTH .env.local AND Runflare when DEV_OTP_PHONE + DEV_OTP_CODE are set
- Do NOT disable mock OTP only because NODE_ENV=production
- Document go-live removal in backend-dev/GO-LIVE.md

STOP after phase 1. Do not start phase 2.
No real SMS/email during build phase.
```

### فارسی — فاز ۱ (توضیح)

```
فقط فاز ۱ — احراز هویت و سطح دسترسی

تکنولوژی: Postgres + Prisma. بدون Supabase.

کارها:
- Prisma + جداول User, AdminRole, AdminUser, PatientProfile
- seed: admin roles/users from ADMIN-CREDENTIALS.local.json + بیمار dev با 09126723365
- API: OTP ساختگی (00000) — روی local **و** Runflare وقتی DEV_OTP_* در env باشد
- حتی با NODE_ENV=production روی سرور زنده OTP mock کار کند
- GO-LIVE.md: قبل لانچ DEV_OTP حذف شود
- AccountPage و /admin/login به API وصل شوند — ظاهر UI عوض نشود
- migrate: 001_auth + seed

بعد از فاز ۱ متوقف شو. SMS واقعی نه.
```

### After Phase 1 — run / بعد از فاز ۱

```powershell
npx prisma generate
npx prisma migrate dev --name 001_auth
npx prisma db seed
npm run dev
```

### Manual tests / تست دستی

| # | Path | Input | Expected |
|---|------|-------|----------|
| 1 | `/account` | 09126723365, code 00000, name | Profile form opens |
| 2 | `/admin/login` | admin + local credentials file | Dashboard `/admin` |
| 3 | `/admin/login` | ops + local credentials file | bookings ✅, access ❌ |
| 4 | `/admin/bookings` (no login) | — | Redirect to login |
| 5 | Refresh `/account` | — | Still logged in |
| 6 | `https://pasteur.plus/account` | 09126723365, 00000 | Same on live server (Runflare env) |
| 7 | `https://pasteur.plus/admin/login` | admin + local credentials file | Dashboard on live server |

| # | مسیر | ورودی | انتظار |
|---|------|-------|--------|
| 1 | `/account` | 09126723365، کد 00000، نام | فرم پروفایل |
| 2 | `/admin/login` | admin + فایل رمز محلی | داشبورد |
| 3 | `/admin/login` | ops + فایل رمز محلی | رزرو ✅، access ❌ |
| 4 | `/admin/bookings` بدون login | — | redirect |
| 5 | refresh `/account` | — | session بماند |
| 6 | `https://pasteur.plus/account` | 09126723365، 00000 | همان روی سرور زنده |
| 7 | `https://pasteur.plus/admin/login` | admin + فایل رمز محلی | داشبورد روی سرور |

### ✅ Phase 1 complete when / تکمیل فاز ۱

- [x] Migration `001_auth` applied
- [x] Seed ran successfully
- [x] All 7 manual tests pass (local + pasteur.plus live)
- [x] `git commit` done (ongoing deploys)

---

## Phase 2 — Content & Catalog

### English prompt

```
PHASE 2 ONLY — Content & catalog. Phase 1 auth must already work.

Add Prisma models + API + replace PasteurStorage reads for:
- Service, LaserService, NursingService, NursingItem
- Physician, ConsultationType, SpecialtyTariff (JSON field)
- GalleryItem, Product
- BaseInsurance, ComplementaryInsurance
- SiteSettings (dentalReservationFee default 200000, wallet settings)
- MediaAsset (path, mime, filename)

Tasks:
1. npx prisma migrate dev --name 002_content
2. scripts/seed-phase2.ts — seed from lib/data.ts defaults
3. Replace Unsplash URLs: download images, save under public/uploads/ or storage,
   store local paths in DB (no external CDN in production)
   On Runflare (no outbound internet): bundled copies in scripts/seed-assets/uploads/
4. Admin CRUD API for each entity — match existing admin pages under app/admin/(panel)/
5. Wire public pages to API (not localStorage):
   /, /laser, /nursing, /gallery, /shop/catalog, /medical/doctors (+ /app/* equivalents)
6. Create backend-dev/TODO-v2.md + TEST-MANUAL.md phase 2 section
7. POST /api/admin/upload — admin image upload to public/uploads (Runflare disk)
8. ImageUploadField on admin gallery, services, shop, nursing
9. Auto-generate service href from title (inferServiceHref)

DO NOT change UI design. DO NOT break phase 1 auth.
STOP after phase 2.
```

### فارسی — فاز ۲

```
فقط فاز ۲ — محتوا و کاتالوگ (فاز ۱ باید کار کند)

مدل‌ها: سرویس‌ها، لیزر، پرستاری، پزشکان، انواع مشاوره، تعرفه، گالری، محصولات، بیمه‌ها، تنظیمات، media

کارها:
- migrate 002_content + seed-phase2 از lib/data.ts
- تصاویر Unsplash → دانلود → public/uploads — بدون CDN خارجی
- API CRUD ادمین + صفحات عمومی از API بخوانند
- آپلود تصویر admin → /uploads روی دیسک Runflare
- لینک سرویس خودکار از عنوان
- TODO-v2 + تست‌های فاز ۲ در TEST-MANUAL

UI عوض نشود. auth فاز ۱ نشکند.
```

### Manual tests / تست دستی

| UI | Link | Admin | Expected |
|----|------|-------|----------|
| Home | `/` | `/admin/services` edit title | Change visible on `/` |
| Laser | `/laser` | `/admin/laser-services` add item | New item on site |
| Gallery | `/gallery` | `/admin/gallery` upload file | `/uploads/` images load |
| Nursing | `/nursing` | `/admin/nursing-services` | Price on item select |

### ✅ Phase 2 complete when / تکمیل فاز ۲

- [x] `seed-phase2` OK
- [x] No live Unsplash URLs in DB for core content
- [x] Admin CRUD reflects on public pages
- [x] Image upload API + admin file picker
- [x] Runflare disk at `/app/public/uploads` documented
- [x] Live deploy on pasteur.plus
- [x] Surgery service card migration `008_surgery_service` (was mistaken «دندان‌سازی»)
- [x] `git commit` done (ongoing)

---

## Phase 3 — Clinical Operations

### English prompt

```
PHASE 3 ONLY — Clinical operations. Phases 1–2 must work.

Models: Booking, Consultation, InsuranceInquiry, Reminder, DoctorReview, Complaint, PartnerRequest

Tasks:
1. npx prisma migrate dev --name 003_operations
2. scripts/seed-phase3.ts — sample booking + consultation
3. Wire to API:
   - BookingWizard, ConfirmPayment (dental reservation fee 200000, deposit non-refundable)
   - ConsultationForm, insurance inquiry flow (pending/approved/rejected)
4. Admin pages: bookings, consultations, insurances, patients, reviews, complaints, partners
5. Authorization: patient A MUST NOT read patient B's booking/consultation (prevent IDOR)
6. backend-dev/TODO-v3.md + TEST-MANUAL phase 3

DO NOT change UI. Payment was MOCK in original phase 3 spec — **superseded by Phase 7 (Zibal)**.
STOP after phase 3.
```

### فارسی — فاز ۳

```
فقط فاز ۳ — عملیات بالینی

مدل‌ها: رزرو، مشاوره، استعلام بیمه، یادآور، نظر پزشک، شکایت، درخواست همکاری

کارها:
- migrate 003 + seed-phase3
- BookingWizard و ConfirmPayment → API (بیعانه ۲۰۰٬۰۰۰، غیرقابل‌عودت)
- ConsultationForm + استعلام بیمه
- جلوگیری از IDOR — بیمار A داده بیمار B را نبیند
- TODO-v3 + تست فاز ۳

پرداخت: اول mock بود؛ الان Phase 7 (زیبال) — mock UI حذف شده.
```

### Manual tests / تست دستی

1. `/dental/booking` → confirm → pay 200k → `/admin/bookings` shows booking  
2. `/medical` → doctors → `/consultation` → `/admin/consultations`  
3. `/account` insurance → `/admin/patients` approve → `/dental/confirm` franchise amount  

### ✅ Phase 3 complete when / تکمیل فاز ۳

- [x] Prisma + API for bookings, consultations, inquiries, reminders, reviews, complaints, partners
- [x] Admin patients wired to DB
- [x] BookingWizard + ConfirmPayment wired to API
- [x] RemindersPage + admin dashboard wired to API
- [x] `npm run build` OK
- [x] `npm run db:seed:phase3` OK
- [ ] Full booking flow end-to-end with **Zibal** on pasteur.plus (Phase 7)
- [ ] IDOR manually checked (two test patients)
- [ ] Insurance approve via **admin only** (remove simulate button — Phase R)
- [x] git commit (ongoing)

---

## Phase 4 — Commerce & Finance

### English prompt

```
PHASE 4 ONLY — Commerce & finance. Phases 1–3 must work.

Models: MembershipPlan, Member, MembershipApplication, Wallet, WalletTransaction,
ShopOrder, Visitor, Commission, FacilityRequest, InstallmentPlan

Tasks:
1. npx prisma migrate dev --name 004_commerce
2. scripts/seed-phase4.ts
3. Wire: /dental/membership, /wallet, /shop (cart, orders), commissions, facilities, /installments
4. Wallet ceilings: regular 15M, membership VIP 30M, shop VIP 20M (max if multiple VIP)
5. Admin: memberships, wallets, shop, commissions, facilities, installments
6. Payment was MOCK in original spec — **superseded by Phase 7 (Zibal)**
7. backend-dev/TODO-v4.md + TEST-MANUAL phase 4

STOP after phase 4.
```

### فارسی — فاز ۴

```
فقط فاز ۴ — مالی و تجاری

مدل‌ها: عضویت، کیف اعتبار، فروشگاه، ویزیتور، پورسانت، تسهیلات، اقساط

کارها:
- migrate 004 + seed-phase4
- membership, wallet, shop, installments → API
- سقف کیف: عادی ۱۵M، VIP عضویت ۳۰M، VIP فروشگاه ۲۰M
- پرداخت: Phase 7 زیبال
- TODO-v4 + تست فاز ۴
```

### Manual tests / تست دستی

- `/dental/membership` VIP → `/admin/memberships`  
- `/wallet` → `/admin/wallets`  
- `/shop` → cart → order → `/admin/shop`  
- `/installments` → `/admin/installments`  

### ✅ Phase 4 complete when / تکمیل فاز ۴

- [x] Wallet + shop + membership persisted in DB
- [x] Commission on referral code (if visitor seeded)
- [ ] Manual tests phase 4 with **Zibal** (membership + shop-vip)
- [x] `git commit` done (ongoing)

---

## Phase 5 — Club, Cleanup & Deploy Prep

### English prompt

```
PHASE 5 — Club, cleanup, production prep. Phases 1–4 must work.

Models: ClubProfile, ClubHistoryItem (linked to user phone)

Tasks:
1. npx prisma migrate dev --name 005_loyalty
2. Wire /club and /app/club: brush action (+5 points, max 3/day, 8h cooldown), Instagram CTA
3. scripts/seed-phase5.ts — club sample data
4. scripts/reset-all.ts — truncate all data EXCEPT admin roles/users (dev/staging only)
5. UX fixes (minimal):
   - MembershipPage modals: close on backdrop click
   - Replace window.alert in admin/doctors with inline message or toast
6. backend-dev/TODO-v5.md + complete TEST-MANUAL.md
7. Document in README: Runflare deploy + `npx prisma migrate deploy`

After reset-all works, backend is ready for staging deploy.
```

### فارسی — فاز ۵

```
فاز ۵ — باشگاه، پاکسازی، آماده deploy

مدل‌ها: باشگاه + تاریخچه امتیاز

کارها:
- migrate 005 + seed-phase5
- /club: مسواک زدم (+۵، ۳/روز، ۸ ساعت فاصله)
- reset-all.ts — پاک کردن داده تست (admin بماند)
- modal عضویت: بستن با کلیک بیرون؛ حذف alert در doctors
- TODO-v5 + TEST-MANUAL کامل + README deploy

بعد از reset-all → staging Runflare
```

### Manual tests / تست دستی

- `/club` → brush +5 points, cooldown message on repeat  
- `npx ts-node scripts/reset-all.ts` → data cleared, admin login still works  

### ✅ Phase 5 complete when / تکمیل فاز ۵

- [x] reset-all works
- [x] TEST-MANUAL.md complete for all phases
- [x] Production deploy on Runflare (`pasteur.plus`)
- [x] `git commit` done (ongoing)
- [ ] Phase R: do **not** run reset-all on live patient data without backup

---

## Phase + — Kali Linux Security (YOU — after each phase)

### English guide

```
Optional after each phase (on local Kali):

1. git pull && npm install && npm run build && npm run start
2. OWASP ZAP: Automated Scan on http://localhost:3000 → export HTML to reports/
3. Burp Suite (advanced): proxy login, test ops cannot access /admin/access
4. During build phase: DEV_OTP on Runflare is OK — test live login with 09126723365 / 00000
5. Before public go-live only: remove DEV_OTP_* from Runflare — see backend-dev/GO-LIVE.md

Tools: zaproxy, burpsuite, nuclei, ffuf (wordlist: dirb/common.txt)
Do NOT write code on Kali — test only.
```

### فارسی — Kali

```
بعد از هر فاز (اختیاری روی Kali لوکال):

۱. git pull → npm run build → npm run start
۲. ZAP: اسکن http://localhost:3000 → گزارش در reports/
۳. Burp: تست role bypass (ops → /admin/access)
۴. فاز توسعه: DEV_OTP روی Runflare OK — تست روی pasteur.plus
۵. فقط قبل لانچ عمومی: DEV_OTP_* از Runflare حذف شود — GO-LIVE.md

روی Kali کد ننویس — فقط تست امنیتی.
```

---

## Overall order / ترتیب کلی

```
Phase 0: DB + .env.local          (you)                    ✅
    ↓
Phase 1–5: Auth → Content → Ops → Commerce → Club         ✅
    ↓
Phase 6: SMS + Zohal (006)                                  ✅ live
    ↓
Phase 7: Zibal payment (007)                                ✅ code / 🟨 test
    ↓
Phase 8: Content fixes (008 surgery card)                   ✅
    ↓
Go-Live ops: SESSION, CRON, DEV_OTP removal                 🟨  → GO-LIVE.md
    ↓
Phase R: Real data — de-fake DB + remove mock fallbacks      ⬜ NEXT
    ↓
Kali ZAP (optional) + TEST-MANUAL full pass
```

---

## Phase 6 — SMS + Zohal (post-roadmap)

> Migration `006_sms_zohal` · Checklist: **`todo-v6.md`** sections A–G

### ✅ Phase 6 complete when

- [x] Real OTP SMS on live (non-DEV phone)
- [x] Zohal facility inquiry on `/shop/facility` → `/admin/facilities`
- [x] Transactional SMS code (booking, consultation, reminders)
- [ ] Live SMS test: consultation + booking body IDs
- [ ] `CRON_SECRET` on Runflare + cron HTTP 200
- [ ] Remove `DEV_OTP_*` after above green

---

## Phase 7 — Zibal payment gateway

> Migration `007_zibal` · Env: `ZIBAL_MERCHANT_ID`, `ZIBAL_SANDBOX=false`

### English summary

```
PHASE 7 — Real payment (supersedes Phase 3/4 "payment mock").

Implemented:
- lib/zibal/client.ts — request + verify
- PaymentIntent model + API routes /api/payments/zibal/*
- ConfirmPayment → redirect to gateway; callback completes booking/membership/shop-vip

Manual test:
1. /dental/booking → confirm → pay → Zibal → success
2. /admin/bookings shows paid booking
3. Zibal panel shows transaction
Optional: membership + shop-vip flows
```

### ✅ Phase 7 complete when

- [x] Code + migration `007_zibal`
- [x] `npm run build` OK
- [x] Deploy + migrate (reported)
- [ ] End-to-end live payment test (booking minimum)
- [ ] Optional: membership + shop-vip live test

---

## Phase 8 — Content fixes (surgery homepage card)

> Migration `008_surgery_service`

- [x] Replace mistaken «دندان‌سازی» card with **جراحی** + surgery image
- [x] `lib/data.ts` seed includes surgery service
- [ ] Live homepage shows correct card after deploy/migrate

---

## Phase R — Real Data (de-fake → production)

> **Next major work.** Full checklist also in **`todo-v6.md` → بخش C**.

### Goal / هدف

Remove demo/seed/mock/dev data and code fallbacks so **pasteur.plus runs on real clinic data only**.

### R0 — Prepare (YOU + backup)

```
Before deleting anything on production:

1. pg_dump / Runflare backup of pasteurpods_db
2. Export admin lists: bookings, consultations, users, orders — mark TEST rows
3. Decide: selective DELETE vs reset-all + re-seed content only (NEVER reset-all on live without approval)
4. Test procedure on local/staging with remote DATABASE_URL first
```

| # | Task | Owner |
|---|------|-------|
| R0.1 | DB backup | You |
| R0.2 | Inventory fake rows (09126723365, seed-phase3 samples) | You + admin |
| R0.3 | Staging dry-run | Cursor + you |

### R1 — Clean database (fake transactional data)

| # | Task | How |
|---|------|-----|
| R1.1 | Remove test bookings/consultations/orders | Admin or targeted SQL |
| R1.2 | Remove dev patient user after DEV_OTP removed | Admin `/admin/patients` or SQL |
| R1.3 | Clear old `PaymentIntent` pending/failed | SQL or admin tool |
| R1.4 | Update `scripts/reset-all.ts` to include `PaymentIntent`, `OtpChallenge` | Cursor |
| R1.5 | Re-seed **content only** if needed: `db:seed:phase2` (not phase3 demo bookings) | Terminal |

**NEVER** `npx tsx scripts/reset-all.ts --confirm` on production without backup + explicit approval.

### R2 — Remove dev/mock UI & auth bypass

| # | Task | File / area |
|---|------|-------------|
| R2.1 | Remove DEV_OTP env | Runflare — `GO-LIVE.md` |
| R2.2 | Remove «شبیه‌سازی تأیید» insurance button | `ConfirmPayment.tsx` |
| R2.3 | Insurance approve **only** via admin | `/admin/insurance-inquiries` |
| R2.4 | Remove unused mock payment path | `lib/payment.ts` `completePaymentAsync` |
| R2.5 | Remove demo copy | `DoctorReviewForm.tsx` |

### R3 — Wire remaining PasteurStorage fallbacks to API

| # | Current mock | Target API |
|---|--------------|------------|
| R3.1 | `ShopCart` + `initProductsIfNeeded` | `/api/content/products` only |
| R3.2 | `ConsultationForm` club points local | `/api/club/*` |
| R3.3 | `consultationPrice.ts` localStorage | `/api/content/consultation-pricing` |
| R3.4 | `MedicalDoctorList` PASTEUR_DATA fallback | `/api/content/physicians` |
| R3.5 | `admin/help` PasteurStorage | DB model or remove |
| R3.6 | `admin/doctors` extraDoctors localStorage | DB physicians only |
| R3.7 | `BookingWizard` local slot cache | `/api/operations/bookings/slot-check` only |

**Keep (client session OK):** pending payment localStorage (pre-Zibal redirect), shop cart, app view preference.

### R4 — Enter real content via admin

| # | Admin path | Content |
|---|------------|---------|
| R4.1 | `/admin/doctors` | Real dentists + physicians |
| R4.2 | `/admin/services` | 6 homepage cards (incl. surgery) |
| R4.3 | `/admin/shop` | Real products + stock |
| R4.4 | `/admin/gallery` | Real before/after (`/uploads/`) |
| R4.5 | `/admin/insurances` | Contracted insurances |
| R4.6 | `/admin/consultation-prices` | Real tariffs |
| R4.7 | `/admin/memberships` | Real plans if used |

### R5 — Production verification

| # | Test |
|---|------|
| R5.1 | Full `TEST-MANUAL.md` on pasteur.plus |
| R5.2 | Kali/ZAP — no DEV OTP bypass |
| R5.3 | One real booking + Zibal payment + SMS |
| R5.4 | No external Unsplash URLs in DB |
| R5.5 | `grep PasteurStorage` — only allowed client caches |

### English prompt (paste into Cursor Agent for Phase R)

```
PHASE R ONLY — Real data / de-fake. Phases 1–7 + Go-Live ops must be stable first.

DO NOT run reset-all on production without user explicit approval + backup.

Tasks (in order):
1. R2: Remove ConfirmPayment simulateApprove; remove mock completePaymentAsync if unused
2. R3: Replace PasteurStorage/PASTEUR_DATA fallbacks listed in prompts.md Phase R table with API calls
3. R1.4: Add PaymentIntent + OtpChallenge to scripts/reset-all.ts
4. R4: Document admin entry checklist — no code unless missing API wiring
5. Update todo-v6.md checkboxes as each R item completes

DO NOT change UI layout. DO NOT break Zibal payment flow.
STOP after Phase R wiring; user enters real content in admin separately.
```

### ✅ Phase R complete when

- [ ] No DEV_OTP on Runflare
- [ ] No simulate insurance approve in UI
- [ ] No PASTEUR_DATA runtime fallback on public pages
- [ ] DB has no intentional test patients/bookings (or archived)
- [ ] Real doctors/products/services entered in admin
- [ ] TEST-MANUAL + one live payment pass

---

## Changing database later / عوض کردن DB آخر کار

Switch between internal (Runflare) and remote (local) by changing `DATABASE_URL` only:

| Action | Where | URI |
|--------|-------|-----|
| Dev / migrate from PC | `.env.local` | Remote |
| Deployed app | Runflare env | Internal |

```powershell
# From Windows (remote in .env.local):
npx prisma migrate dev
npx prisma db seed

# On Runflare after deploy (internal DATABASE_URL in panel):
npx prisma migrate deploy
```

Schema stays the same — no Supabase migration needed.

---

## Reference files / فایل‌های مرجع

| File | Purpose |
|------|---------|
| `lib/storage.ts` | Legacy mock — Phase R removes most runtime use |
| `lib/adminAccess.ts` | Roles & permissions |
| `lib/routes.ts` | All route paths |
| `lib/data.ts` | Default **seed** data (not production fallback after Phase R) |
| `lib/zibal/` | Zibal payment client (Phase 7) |
| `lib/commerce/zibal-intent-service.ts` | PaymentIntent + callback |
| `backend-dev/GO-LIVE.md` | Runflare env, CRON, DEV_OTP, Zibal |
| `backend-dev/TEST-MANUAL.md` | Manual test scenarios |
| `todo-v6.md` | **Active checklist** — Go-Live + Zibal + Phase R |
| `KALI-SECURITY-CHECKLIST.md` | Security pass after DEV_OTP removed |
| `scripts/reset-all.ts` | Dev/staging truncate — **danger on production** |
| `reports/` | Kali / ZAP export |
