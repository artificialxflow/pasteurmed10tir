# Go-live checklist — Pasteur Plus

سایت: `https://pasteur.plus`  
آخرین به‌روزرسانی: ۲۰۲۶-۰۸-۱۵

> OTP واقعی و زحل تسهیلات روی لایو تأیید شده‌اند.  
> `DEV_OTP_*` هنوز روی سرور است تا SMS مشاوره/رزرو و CRON بسته شود، بعد حذف شود.

---

## وضعیت تأییدشده روی لایو

- [x] OTP واقعی (شماره غیر-DEV) — پیامک آمد و ورود انجام شد
- [x] تأیید کاربری `/admin/patients` (مثلاً امامی۲ → تأیید شده)
- [x] درخواست تسهیلات + استعلام زحل (فرم `/shop/facility` → نتیجه در `/admin/facilities`)
- [x] Migration `006_sms_zohal` (OTP واقعی بدون آن کار نمی‌کرد)
- [x] `SMS_*` و `ZOHAL_*` روی سرور فعال‌اند

---

## الان روی پنل Runflare اعمال کن (به ترتیب)

مقدارها را از فایل لوکال **`.env.production`** کپی کن (این فایل commit نشود).

### ۱) امنیت session
- [ ] در Runflare مقدار جدید `SESSION_SECRET` را از `.env.production` بگذار  
  (فایل لوکال از placeholder ضعیف چرخانده شد — حتماً همان را روی سرور هم عوض کن)
- [ ] اپ را ری‌استارت / redeploy کن تا session جدید لود شود
- [ ] یک بار با ادمین و یک بار با بیمار لاگین کن که session جدید OK باشد

### ۲) CRON یادآور (الان لایو `503` می‌دهد = `CRON_SECRET` روی سرور نیست)
- [ ] `CRON_SECRET` را از `.env.production` در پنل Runflare ست کن
- [ ] redeploy / restart
- [ ] تست:

```bash
curl -X POST "https://pasteur.plus/api/cron/sms-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

انتظار: HTTP 200 و JSON شبیه `{ "ok": true, "sent24": 0, "sent2": 0, ... }`  
(اگر 503 بود هنوز env ست نشده؛ اگر 401 بود secret اشتباه است)

- [ ] زمان‌بندی هر ۱۰–۱۵ دقیقه همان POST

### ۳) تست‌های مانده قبل از حذف DEV
- [ ] یک مشاوره لایو → SMS پیگیری (`514436`)
- [ ] یک رزرو لایو → SMS تأیید (`514432`)
- [ ] رگرسیون DEV: `09126723365` / `00000` هنوز OK
- [ ] (اختیاری) یک بار کد ملی غلط روی تسهیلات → رد/خطای واضح

### ۴) حذف DEV OTP (لانچ عمومی OTP)
فقط وقتی بند ۳ سبز شد:

- [ ] حذف `DEV_OTP_PHONE` از Runflare
- [ ] حذف `DEV_OTP_CODE` از Runflare
- [ ] حذف/کامنت همان‌ها از `.env.production` و `.env.local` (لوکال اگر هنوز تست می‌خواهی نگه دار)
- [ ] redeploy
- [ ] تست: `09126723365` + `00000` باید **رد** شود
- [ ] تست: شماره واقعی → فقط SMS واقعی

### ۵) چرخش توکن (اگر قبلاً در updates/چت لو رفته)
- [ ] توکن زحل را در پنل زحل بچرخان و در Runflare عوض کن
- [ ] در صورت نیاز SMS API key را هم بچرخان

### ۶) درگاه پرداخت زیبال (migration `007_zibal`)
- [ ] `ZIBAL_MERCHANT_ID` از پنل زیبال → درگاه «پاستور پلاس» → «کد مرچنت» در Runflare (بدون فاصله قبل/بعد `=`)
- [ ] `ZIBAL_SANDBOX=false` روی production (یا حذف متغیر)
- [ ] `NEXT_PUBLIC_SITE_URL=https://pasteur.plus` تأیید شود
- [ ] deploy کد + اجرای migration `007_zibal` (`npm run db:deploy`)
- [ ] redeploy
- [ ] تست: `/dental/booking` → confirm → «پرداخت و انتقال به درگاه» → برگشت موفق → رزرو در `/admin/bookings`
- [ ] (اختیاری) تست عضویت و shop-vip

---

## Final / امنیتی بعدی

- [ ] Full pass از `backend-dev/TEST-MANUAL.md` روی پروداکشن
- [ ] Kali/Burp بعد از حذف DEV: بدون بایپس OTP تستی
- [ ] `scripts/reset-all.ts` هرگز روی دیتای واقعی بیمار بدون تأیید صریح

---

## فارسی — مسیر سریع

1. `SESSION_SECRET` جدید → Runflare  
2. `CRON_SECRET` → Runflare + زمان‌بندی یادآور  
3. تست SMS مشاوره و رزرو  
4. حذف `DEV_OTP_*` از Runflare  
5. تأیید که `00000` دیگر کار نمی‌کند  
6. `ZIBAL_MERCHANT_ID` + migration `007_zibal` + تست پرداخت  
