# TODO v7 — تأیید کاربری + زحل + مدیریت ادمین + تکمیل UX

سایت: `https://pasteur.plus`  
آخرین به‌روزرسانی: ۲۰۲۶-۰۸-۱۸

> **هدف:** بستن شکاف‌های go-live بعد از v5 (فروشگاه) و v6 (زیبال/SMS):  
> استعلام زحل برای تأیید بیمار، CRUD ادمین واقعی، مدیریت بیمار در پنل، و polish UX.  
> **مرجع:** `todo-v5.md` · `todo-v6.md` · `backend-dev/GO-LIVE.md` · `MANUAL-SMOKE-CHECKLIST.md`

---

## خلاصه وضعیت (بعد از v7 — کد)

| موضوع | وضعیت |
|--------|--------|
| فروشگاه + پرداخت زیibal سبد | ✅ کد — deploy |
| Shop UX: اسکلتون + دسته‌بندی `/shop` | ✅ کد — deploy |
| پروفایل read-only برای تأییدشده `/account` | ✅ کد — deploy |
| زحل روی `/shop/facility` | ✅ |
| زحل روی تأیید کاربری `/admin/patients` | ✅ کد — migrate 010 + deploy |
| CRUD بیمار در ادمین (ویرایش/حذف) | ✅ کد |
| CRUD ادمین واقعی در DB | ✅ کد |
| `/admin/access` (localStorage) | ✅ جایگزین DB API |
| استعلام بیمه رزرو (`/dental/confirm`) | ✅ UX بهبود — smoke |
| migration `009_shop_enhancements` | ⬜ deploy Runflare (اگر نشده) |
| migration `010_patient_zohal` | ⬜ deploy Runflare |

---

## migrations

| Migration | موضوع | v7 |
|-----------|--------|-----|
| `009_shop_enhancements` | فروشگاه | deploy اگر مانده |
| `010_patient_zohal` | `zohalStatus`, `zohalPayload`, `shahkarMatched`, `zohalCheckedAt` | ✅ کد — deploy |

---

# فاز ۰ — Operational باقی‌مانده (انسان / Runflare)

**هدف:** قبل از feature جدید، env و deploy فعلی بسته شود.

- [ ] `NEXT_PUBLIC_SITE_URL=https://pasteur.plus` + `ZIBAL_MERCHANT_ID` + redeploy
- [ ] IPهای outbound Runflare در پنل زیibal (لیست کامل از Runflare بگیرید)
- [ ] `npx prisma migrate deploy` → migration `009` روی Runflare
- [ ] deploy آخرین کد v7 (shop UX + zohal + admin CRUD)
- [ ] `todo-v6` بند D/F: CRON + حذف `DEV_OTP_*` (بعد از SMS/زیibal سبز)

**Done when:** سبد + رزرو + account profile روی pasteur.plus بدون خطای env.

---

# فاز ۱ — زحل + تأیید خودکار کاربری (P0) ✅ کد

**هدف:** کد ملی + موبایل با شاهکار بررسی شود؛ در صورت موفقیت کاربر تأیید شود (یا semi-auto).

### ۱.۱ — Schema + API

- [x] migration `010`: فیلدهای `PatientProfile`:
  - `zohalStatus`: `skipped` | `pending` | `passed` | `failed` | `error`
  - `zohalPayload` Json (اختیاری)
  - `shahkarMatched` Boolean (اختیاری)
  - `zohalCheckedAt` DateTime (اختیاری)
- [x] `PATCH /api/auth/profile`: بعد از save معتبر → فراخوانی `zohalShahkar(nationalId, phone)`
- [x] اگر `isZohalConfigured()` false → `zohalStatus=skipped` + manual flow (status pending)
- [x] اگر شاهکار OK → `status=approved` + `reviewedAt`
- [x] اگر شاهکار fail → `status=rejected` + `reviewNote` خودکار
- [x] لاگ خطای زحل بدون leak token

### ۱.۲ — UI بیمار (`/account`)

- [x] بعد از ذخیره: نمایش «در حال استعلام…» / نتیجه شاهکار
- [x] در پروفایل read-only: badge «شاهکار: تطبیق / عدم تطبیق / بررسی نشده»
- [x] اگر rejected: راهنمای اصلاح کد ملی

### ۱.۳ — UI ادمین (`/admin/patients`)

- [x] ستون «زحل / شاهکار» (مثل `/admin/facilities`)
- [x] دکمه «استعلام مجدد زحل» برای یک ردیف
- [x] تأیید دستی همچنان ممکن (override)

**Done when:** بیمار با کد ملی+موبایل درست → بدون کلیک ادمین `approved` شود (یا یک کلیک تأیید بعد از زحل سبز).

**فایل‌های کلیدی:** `app/api/auth/profile/route.ts` · `lib/zohal/patient-verify.ts` · `app/admin/(panel)/patients/page.tsx` · `components/account/AccountPage.tsx`

---

# فاز ۲ — مدیریت بیمار در ادمین (P0) ✅ کد

**هدف:** `/admin/patients` فقط تأیید/رد نباشد — ویرایش و حذف هم باشد.

### ۲.۱ — API

- [x] `PATCH /api/admin/operations/patients` گسترش:
  - `name`, `nationalId`, `franchisePercent`, `baseInsuranceId`, `complementaryInsuranceId`
  - validation کد ملی (`isValidNationalId`)
  - تغییر بیمه/فرانشیز → `status=pending` (مثل patient self-service)
- [x] `DELETE /api/admin/operations/patients?phone=` (hard delete User + cascade)
- [x] نمایش **نام بیمه** نه فقط id (`alborz` → «بیمه البرز»)

### ۲.۲ — UI

- [x] دکمه «ویرایش» → modal form
- [x] دکمه «حذف» + confirm
- [x] فیلتر: pending / approved / rejected
- [x] جستجو با موبایل / نام

**Done when:** ادمین بتواند فرانشیز و بیمه را اصلاح کند و بیمار test را حذف/reset کند.

**فایل‌های کلیدی:** `app/api/admin/operations/patients/route.ts` · `app/admin/(panel)/patients/page.tsx`

---

# فاز ۳ — استعلام بیمه رزرو — UX + تست (P1) ✅ کد

**هدف:** گام ۲ walkthrough بدون گیر «تأیید نشده» و جدول خالی insurances.

### ۳.۱ — UX `/dental/confirm`

- [x] refresh پروفایل بعد از focus/tab + دکمه «بروزرسانی وضعیت»
- [x] اگر `!isPatientApproved`: لینک مستقیم «تکمیل پروفایل» → `/account`
- [x] پیام واضح‌تر: `/admin/patients` vs `/admin/insurances`
- [x] polling استعلام: ۱۵s (موجود) + sync پروفایل ۲۰s وقتی pending

### ۳.۲ — مستندات تست

- [x] `MANUAL-SMOKE-CHECKLIST.md` / walkthrough:
  1. تأیید کاربری `/admin/patients`
  2. استعلام `/dental/confirm`
  3. تأیید `/admin/insurances` → درخواست‌های استعلام
  4. مبلغ = `350000 × franchise%`

**Done when:** walkthrough گام ۲ بدون ابهام pass شود.

**فایل‌های کلیدی:** `components/dental/ConfirmPayment.tsx` · `app/admin/(panel)/insurances/page.tsx`

---

# فاز ۴ — مدیریت ادمین واقعی در DB (P0) ✅ کد

**هدف:** جایگزینی `/admin/access` localStorage با CRUD روی `AdminUser` + `AdminRole`.

### ۴.۱ — API

- [x] `GET/POST/PATCH/DELETE /api/admin/access/users` (permission: `access`)
- [x] `GET/PATCH/POST/DELETE /api/admin/access/roles` (permission: `access`)
- [x] hash password با bcrypt (مثل seed)
- [x] جلوگیری از حذف آخرین superadmin / خود کاربر logged-in

### ۴.۲ — UI

- [x] بازنویسی `app/admin/(panel)/access/page.tsx`:
  - fetch از API نه `PasteurStorage`
  - افزودن / ویرایش / غیرفعال / حذف ادمین
  - assign role
- [x] بنر: «تغییرات در دیتابیس — برای همه سرورها معتبر است»

### ۴.۳ — seed + ops

- [x] مستند در UI: «ادمین جدید» = UI یا `prisma db seed` + env
- [x] `/admin/access` دیگر localStorage-only نیست

**Done when:** ادمین جدید از `/admin/access` ساخته شود و با `/admin/login` وارد شود (مرورگر دیگر).

**فایل‌های کلیدی:** `prisma/schema.prisma` · `app/api/admin/access/` · `app/admin/(panel)/access/page.tsx` · `lib/auth/admin-db.ts`

---

# فاز ۵ — یکپارچه‌سازی لیست کاربران (P2) ✅ کد

**هدف:** یک نگاه کلی — بیمار vs staff (نه ادغام DB اجباری).

- [x] shortcut «بیماران» → `/admin/patients`
- [x] shortcut «کارکنان پنل» → `/admin/access`
- [x] dashboard: تعداد pending patients + pending insurance inquiries
- [ ] (آینده) invite link برای staff — out of scope v7

**Done when:** ادمین گم نشود بین patients و access.

**فایل‌های کلیدی:** `app/admin/(panel)/page.tsx`

---

# فاز ۶ — Polish فنی (P2) ✅ کد

- [x] `themeColor` → `viewport export` در `app/layout.tsx`
- [x] `SITE_URL` server-only برای callback زیibal (اولویت over `NEXT_PUBLIC_SITE_URL`)
- [x] fallback IP زیibal: پیام کاربرپسند + لینک پشتیبانی
- [x] `ConfirmPayment`: sync profile on interval when pending approval

**فایل‌های کلیدی:** `lib/zibal/config.ts` · `lib/zibal/client.ts` · `components/dental/ConfirmPayment.tsx`

---

# فاز ۷ — تست + deploy

- [x] `npm run build`
- [ ] smoke: account (زحل) · patients admin · dental insurance · shop pay
- [x] `MANUAL-SMOKE-CHECKLIST.md` به‌روز
- [ ] deploy Runflare + migrate `010`
- [ ] backup DB قبل از migration

**Done when:** v7 روی pasteur.plus بدون regression در فروشگاه/زیibal.

---

## اولویت اجرا (پیشنهاد)

```text
فاز ۰ (ops) → deploy + migrate 010 → smoke فاز ۷
```

---

## Definition of Done — v7

- [x] تأیید کاربری با زحل (یا مستند fallback manual)
- [x] ادمین بتواند بیمار را ویرایش/حذف کند
- [x] ادمین جدید از UI ساخته شود (DB)
- [ ] walkthrough استعلام بیمه end-to-end pass (smoke دستی)
- [x] `/admin/access` دیگر localStorage-only نباشد

---

## یادداشت‌های کشف‌شده در تست (۲۰۲۶-۰۸-۱۸)

| موضوع | یادداشت |
|--------|---------|
| زیibal IP | IP outbound Runflare عوض می‌شود — همه IPها whitelist شوند |
| `ZIBAL_TOKEN` vs `ZIBAL_MERCHANT_ID` | فقط `ZIBAL_MERCHANT_ID` در کد استفاده می‌شود |
| `/admin/access` | ✅ اکنون DB-backed |
| کد ملی | checksum + زحل شاهکار روی save پروفایل |
| دو تأیید جدا | `/admin/patients` (کاربری) ≠ `/admin/insurances` (استعلام پرداخت) |
| env جدید | `SITE_URL` (server) برای callback زیibal — اختیاری اگر `NEXT_PUBLIC_SITE_URL` درست است |
| migrate | `010_patient_zohal` قبل از deploy v7 روی Runflare |
| migrate v8 | `011_dentists` — جدول `Dentist` + CRUD در `/admin/doctors`؛ seed: `npm run db:seed:phase2` |
