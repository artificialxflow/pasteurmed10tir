# TODO v6 — Go-Live + Zibal + Real Data

سایت: `https://pasteur.plus`  
آخرین به‌روزرسانی: ۲۰۲۶-۰۸-۱۶

> **وضعیت کلی:** roadmap بک‌اند (فاز ۱–۵ `prompts.md`) ✅ | SMS/زحل ✅ | زیبال ✅ (کد) | go-live operational 🟨 | **real data / de-fake ⬜ بعدی**

جزئیات اجرایی: **`backend-dev/GO-LIVE.md`** · roadmap: **`prompts.md`** · تست: **`backend-dev/TEST-MANUAL.md`**

---

## خلاصه migrations

| Migration | موضوع | وضعیت |
|-----------|--------|--------|
| `001_auth` … `005_loyalty` | فاز ۱–۵ prompts | ✅ |
| `006_sms_zohal` | OTP/SMS واقعی + زحل | ✅ لایv |
| `007_zibal` | `PaymentIntent` + درگاه | ✅ deploy + migrate (طبق گزارش) |
| `008_surgery_service` | کارت «جراحی» صفحه اصلی | ✅ کد — بعد push/deploy |

---

## Body ID مرجع SMS

| کاربرد | env | bodyId |
|--------|-----|--------|
| OTP | `SMS_OTP_BODY_ID` | `514428` |
| یادآور ۲۴س | `SMS_REMINDER_24H_BODY_ID` | `514430` |
| یادآور ۲س | `SMS_REMINDER_2H_BODY_ID` | `514431` |
| رزرو | `SMS_BOOKING_BODY_ID` | `514432` |
| مشاوره | `SMS_CONSULTATION_BODY_ID` | `514436` |

---

# بخش A — Go-Live operational (فوری)

```text
Runflare: SESSION_SECRET + CRON_SECRET
  → تست SMS مشاوره/رزرو
  → تست cron (D)
  → تست پرداخت زیبال (H)
  → رگرسیون DEV یک‌بار
  → حذف DEV_OTP_*
  → بعد: فاز R (real data)
```

### Runflare env (اقدام انسان)

- [ ] `SESSION_SECRET` جدید از `.env.production` → Runflare
- [ ] `CRON_SECRET` → Runflare
- [ ] `ZIBAL_MERCHANT_ID` + `ZIBAL_SANDBOX=false` (اگر نیست)
- [ ] `NEXT_PUBLIC_SITE_URL=https://pasteur.plus`
- [ ] redeploy بعد از هر تغییر env

### D — CRON یادآور

- [x] کد + `CRON_SECRET` در `.env.production` لوکال
- [ ] `CRON_SECRET` روی Runflare (بدون آن → HTTP 503)
- [ ] زمان‌بندی `POST /api/cron/sms-reminders` هر ۱۰–۱۵ دقیقه
- [ ] curl تست → HTTP 200

### C — SMS تراکنشی (تست لایv)

- [x] کد deploy شده
- [ ] مشاوره لایv → SMS (`514436`)
- [ ] رزرو لایv → SMS (`514432`)

### B — OTP

- [x] OTP واقعی لایv
- [x] `DEV_OTP_*` عمداً مانده تا C+D+H سبز شود
- [ ] یک‌بار رگرسیون `09126723365` / `00000` **قبل** حذف DEV

### F — حذف DEV OTP

- [ ] فقط بعد از C + D + H (طبق `GO-LIVE.md` بند ۴)
- [ ] حذف `DEV_OTP_*` از Runflare + redeploy
- [ ] تأیید: `00000` دیگر کار **نمی‌کند**

---

# بخش B — تکمیل‌شده (v6)

## A SMS lib — ✅

## E Zohal — ✅

- [x] تسهیلات + استعلام لایv (`/shop/facility` → `/admin/facilities`)

## G Admin patients UX — ✅

- [x] تأیید کاربری لایv (`/admin/patients`)

## H Zibal — 🟨 کد ✅ / تست لایv ⬜

- [x] `lib/zibal/*` + API `request/callback/result`
- [x] `ConfirmPayment` → redirect به درگاه
- [x] `PaymentIntent` + migration `007`
- [x] `npm run build` OK
- [x] deploy + migrate (گزارش شده)
- [ ] تست end-to-end: booking → زیبال → `/admin/bookings`
- [ ] (اختیاری) عضویت + shop-vip

## I Homepage surgery card — 🟨

- [x] `lib/data.ts` + migration `008_surgery_service`
- [ ] push/deploy + migrate `008` اگر هنوز روی لایv نیست
- [ ] تأیید: کارت «جراحی» با تصویر درست روی `/`

---

# بخش C — فاز R: Real Data (حذف فیک → production واقعی)

> **هدف:** DB و UI فقط داده واقعی مرکز پاستور؛ بدون seed/demo/mock/dev bypass.  
> **خطر:** `reset-all` روی پروداکشن فقط با backup + تأیید صریح.  
> جزئیات کامل: **`prompts.md` → Phase R**

## R0 — آماده‌سازی (قبل از پاک‌سازی)

- [ ] backup کامل DB پروداکشن (Runflare / pg_dump)
- [ ] لیست رکوردهای seed/demo در ادمین (رزرو تست، مشاوره تست، بیمار `09126723365`)
- [ ] تصمیم: **پاک‌سازی انتخابی** vs **`reset-all` + re-seed محتوا**
- [ ] staging/لوکال: یک‌بار `reset-all --confirm` + seed فقط محتوا — بدون بیمار فیک

## R1 — پاک‌سازی DB (تراکنش‌ها و کاربران فیک)

- [ ] حذف/آرشیو booking/consultation/member/order **تست** (ادمین یا SQL هدفمند)
- [ ] حذف user/profile بیمار dev (`09126723365`) بعد از حذف DEV_OTP
- [ ] پاک `PaymentIntent` قدیمی / pending (جدول `007`)
- [x] اسکریپت `scripts/clean-demo-data.ts` (+ `npm run db:clean-demo`)
- [ ] اجرای `npm run db:clean-demo -- --confirm` روی DB در دسترس (بعد از backup)
- [x] `reset-all.ts`: اضافه کردن `PaymentIntent` + `OtpChallenge` به اسکریپت (کد — فاز بعد)
- [ ] **هرگز** `reset-all --confirm` روی پروداکشن بدون backup + تأیید کتبی

## R2 — حذف mock/dev در کد (UI و auth)

- [ ] حذف `DEV_OTP_*` از env (بند F بالا)
- [x] حذف دکمه «شبیه‌سازی تأیید» در `ConfirmPayment.tsx` — فقط تأیید ادمین `/admin/insurance-inquiries`
- [x] حذف/غیرفعال مسیر `PaymentFlow.completePaymentAsync` mock در `lib/payment.ts`
- [x] حذف متن demo در `DoctorReviewForm` («نمونه پزشکان دمو»)

## R3 — قطع fallbackهای `PasteurStorage` / `PASTEUR_DATA`

| محل | وضعیت فعلی | کار |
|-----|------------|-----|
| `ShopCatalog` / `lib/shop.ts` | ~~localStorage products~~ | فقط `/api/content/products` |
| `ConsultationForm` | ~~club points PasteurStorage~~ | API club (`/api/club/points`) |
| `consultationPrice.ts` | ~~localStorage~~ | فقط API settings |
| `MedicalSpecialtyList` / `MedicalDoctorList` | ~~PASTEUR_DATA fallback~~ | فقط API physicians |
| `admin/help` | `PasteurStorage.getHelpItems` | DB یا حذف صفحه mock |
| `admin/doctors` | ~~extraDoctors localStorage~~ | فقط DB + ادمین |
| `BookingWizard` | ~~slot check hybrid~~ | فقط API slot-check + occupied |
| pending payment | localStorage تا redirect زیبال | OK نگه دار (session کوتاه) |
| shop cart | localStorage | OK (سبد client-side) |

- [x] `ShopCatalog` / `lib/shop.ts` → `/api/content/products`
- [x] `ConsultationForm` club points → `/api/club/points`
- [x] `consultationPrice.ts` → `/api/content/consultation-pricing`
- [x] `MedicalSpecialtyList` / `MedicalDoctorList` → `/api/content/physicians`
- [x] `admin/doctors` extraDoctors حذف — فقط DB
- [x] `BookingWizard` slot check → API (occupied + slot-check)
- [ ] `admin/help` PasteurStorage → DB یا حذف (فاز بعد)
- [ ] `grep PasteurStorage` → فقط موارد مجاز (cart, pending pay, app view)

## R4 — محتوای واقعی از ادمین

- [x] پزشکان/دندانپزشکان واقعی → `/admin/doctors` (migration `011_dentists` + CRUD دندانپزشک + متخصص)
- [ ] سرویس‌های صفحه اصلی → `/admin/services` (۶ کارت شامل جراحی)
- [ ] محصولات فروشگاه → `/admin/shop`
- [ ] گالری → `/admin/gallery` (تصاویر `/uploads/`)
- [ ] بیمه‌ها → `/admin/insurances`
- [ ] تعرفه مشاوره → `/admin/consultation-prices`
- [ ] بیعانه رزرو → `/admin/bookings` settings
- [ ] ویزیتور/پورسانت → فقط اگر واقعاً استفاده می‌شود

## R5 — تأیید نهایی production

- [ ] `backend-dev/TEST-MANUAL.md` full pass روی `pasteur.plus`
- [ ] Kali/ZAP بعد از حذف DEV_OTP (`KALI-SECURITY-CHECKLIST.md`)
- [ ] یک رزرو + یک پرداخت + یک مشاوره **واقعی** end-to-end
- [ ] بدون Unsplash/live CDN در DB (فقط `/uploads/`)
- [ ] `lib/data.ts` فقط seed/dev — نه fallback runtime در production

---

## وضعیت پیشرفت (جدول)

| فاز | وضعیت | نکته |
|-----|--------|------|
| A SMS lib | ✅ | |
| B OTP | 🟨 | حذف DEV بعد از C+D+H |
| C SMS تراکنشی | 🟨 | تست لایv |
| D CRON | 🟨 | 503 بدون `CRON_SECRET` |
| E Zohal | ✅ | |
| F Go-Live env | 🟨 | SESSION + CRON |
| G Patients UX | ✅ | |
| H Zibal | 🟨 | تست پرداخت |
| I Surgery card | 🟨 | migrate 008 |
| **R Real data** | ⬜ | **فاز بعدی اصلی** |

---

## ایمنی

- سکرت‌ها را در چت/commit نگذار.
- `.env.production` commit نشود.
- `prompts.md` دارای credential است — rotate اگر لو رفته.
- تا C+D+H سبز نشده `DEV_OTP_*` حذف نشود.
- `reset-all` روی دیتای واقعی بیمار **ممنوع** بدون backup.

---

## مسیر پیشنهادی (ترتیب اجرا)

1. Go-Live: SESSION + CRON + تست SMS  
2. تست زیبال  
3. حذف DEV_OTP  
4. **فاز R0→R5** (real data)  
5. Kali + TEST-MANUAL نهایی
