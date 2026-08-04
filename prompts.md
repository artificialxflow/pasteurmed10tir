# Backend Roadmap Prompts — Pasteur Plus

> **Stack:** PostgreSQL + Prisma + Next.js | **NOT Supabase**  
> Frontend is complete (~70 routes). Replace `PasteurStorage` (localStorage mock) with API + DB.  
> **Do not redesign UI** — wire existing pages to real backend.

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

> **Security:** This file contains real credentials. Do **not** push to a public Git repo. Prefer `.env.local` for secrets; rotate password if exposed.

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

- [ ] `.env.local` exists with **remote** URI (no quotes)
- [ ] Runflare panel has **internal** vars + **DEV_OTP** from `.env.production`
- [ ] Live test: https://pasteur.plus/account with 09126723365 / 00000 (after Phase 1)
- [ ] Neither env file is in git
- [ ] Connection OK after Phase 1 migrate

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
   - admin / pasteur1403 → superadmin
   - ops / ops1403, content / content1403, finance / finance1403
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
- seed: admin/pasteur1403 + ops/content/finance + بیمار dev با 09126723365
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
| 2 | `/admin/login` | admin / pasteur1403 | Dashboard `/admin` |
| 3 | `/admin/login` | ops / ops1403 | bookings ✅, access ❌ |
| 4 | `/admin/bookings` (no login) | — | Redirect to login |
| 5 | Refresh `/account` | — | Still logged in |
| 6 | `https://pasteur.plus/account` | 09126723365, 00000 | Same on live server (Runflare env) |
| 7 | `https://pasteur.plus/admin/login` | admin / pasteur1403 | Dashboard on live server |

| # | مسیر | ورودی | انتظار |
|---|------|-------|--------|
| 1 | `/account` | 09126723365، کد 00000، نام | فرم پروفایل |
| 2 | `/admin/login` | admin / pasteur1403 | داشبورد |
| 3 | `/admin/login` | ops / ops1403 | رزرو ✅، access ❌ |
| 4 | `/admin/bookings` بدون login | — | redirect |
| 5 | refresh `/account` | — | session بماند |
| 6 | `https://pasteur.plus/account` | 09126723365، 00000 | همان روی سرور زنده |
| 7 | `https://pasteur.plus/admin/login` | admin / pasteur1403 | داشبورد روی سرور |

### ✅ Phase 1 complete when / تکمیل فاز ۱

- [x] Migration `001_auth` applied
- [x] Seed ran successfully
- [x] All 7 manual tests pass (local + pasteur.plus live)
- [ ] `git commit` done

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
4. Admin CRUD API for each entity — match existing admin pages under app/admin/(panel)/
5. Wire public pages to API (not localStorage):
   /, /laser, /nursing, /gallery, /shop/catalog, /medical/doctors (+ /app/* equivalents)
6. Create backend-dev/TODO-v2.md + TEST-MANUAL.md phase 2 section

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
- TODO-v2 + تست‌های فاز ۲ در TEST-MANUAL

UI عوض نشود. auth فاز ۱ نشکند.
```

### Manual tests / تست دستی

| UI | Link | Admin | Expected |
|----|------|-------|----------|
| Home | `/` | `/admin/services` edit title | Change visible on `/` |
| Laser | `/laser` | `/admin/laser-services` add item | New item on site |
| Gallery | `/gallery` | `/admin/gallery` | Local images load |
| Nursing | `/nursing` | `/admin/nursing-services` | Price on item select |

### ✅ Phase 2 complete when / تکمیل فاز ۲

- [ ] `seed-phase2` OK
- [ ] No live Unsplash URLs in DB for core content
- [ ] Admin CRUD reflects on public pages

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

DO NOT change UI. Payment stays MOCK (no real gateway).
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

پرداخت mock بماند.
```

### Manual tests / تست دستی

1. `/dental/booking` → confirm → pay 200k → `/admin/bookings` shows booking  
2. `/medical` → doctors → `/consultation` → `/admin/consultations`  
3. `/account` insurance → `/admin/patients` approve → `/dental/confirm` franchise amount  

### ✅ Phase 3 complete when / تکمیل فاز ۳

- [ ] Full booking flow end-to-end
- [ ] IDOR manually checked (two test patients)
- [ ] Insurance approve changes payable amount

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
6. Payment remains MOCK
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
- پرداخت mock
- TODO-v4 + تست فاز ۴
```

### Manual tests / تست دستی

- `/dental/membership` VIP → `/admin/memberships`  
- `/wallet` → `/admin/wallets`  
- `/shop` → cart → order → `/admin/shop`  
- `/installments` → `/admin/installments`  

### ✅ Phase 4 complete when / تکمیل فاز ۴

- [ ] Wallet + shop + membership persisted in DB
- [ ] Commission on referral code (if visitor seeded)

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

- [ ] reset-all works
- [ ] TEST-MANUAL.md complete for all phases
- [ ] Staging deploy on Runflare with `pasteur_prod` DATABASE_URL

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
Phase 0: DB + .env.local          (you)
    ↓
Phase 1: Auth prompt → migrate → test → commit
    ↓
Phase 2 → 3 → 4 → 5               (one prompt at a time; confirm before next)
    ↓
Kali ZAP (optional each phase)
    ↓
Runflare: internal DATABASE_URL + migrate deploy + production
```

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
| `lib/storage.ts` | Current mock — replace gradually |
| `lib/adminAccess.ts` | Roles & permissions |
| `lib/routes.ts` | All route paths |
| `lib/data.ts` | Default seed data |
| `backend-dev/GO-LIVE.md` | Remove DEV_OTP before public launch |
| `backend-dev/TEST-MANUAL.md` | Manual test scenarios |
| `reports/` | Kali / ZAP export |
