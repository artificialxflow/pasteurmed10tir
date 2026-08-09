# Go-live checklist — Pasteur Plus

> During **build phase**, `DEV_OTP_*` is set on both `.env.local` and Runflare (live server testing).  
> Before **public launch**, complete every item below.

## Remove dev OTP from Runflare

- [ ] Delete `DEV_OTP_PHONE` from Runflare env panel
- [ ] Delete `DEV_OTP_CODE` from Runflare env panel
- [ ] Redeploy app
- [ ] Verify login with 00000 **fails** on https://pasteur.plus/account

## Security

- [ ] Set new strong `SESSION_SECRET` on Runflare (different from dev)
- [x] Real SMS OTP via payamak-panel (`lib/sms` + `todo-v6`) — keep `DEV_OTP_*` until live SMS verified on several real numbers
- [ ] Set `CRON_SECRET` on Runflare and schedule `POST /api/cron/sms-reminders` every 10–15 min
- [x] Migration `006_sms_zohal` applied (OTP لایو بدون جدول `OtpChallenge` کار نمی‌کرد)
- [ ] (Optional) Separate production database — update `DATABASE_URL`
- [ ] (Optional) Rotate Postgres password
- [ ] If any SMS/Zohal token was ever pasted into `updates/` or chat: rotate in panel

### CRON یادآور — راه‌اندازی

1. در پنل env رانفلر یک مقدار تصادفی بلند ست کنید: `CRON_SECRET=...`
2. هر ۱۰–۱۵ دقیقه این درخواست زده شود (Uptime robot / cron job رانفلر / ویندوز Task / curl زمان‌دار):

```bash
curl -X POST "https://pasteur.plus/api/cron/sms-reminders" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

پاسخ نمونه: `{ "ok": true, "sent24": 0, "sent2": 0, "scanned24": 0, "scanned2": 0 }`

## Final tests

- [x] Real OTP login (non-DEV phone) — کد پیامک رسید و ورود لایو انجام شد
- [ ] Consultation + booking SMS received (تست دستی روی لایو)
- [ ] Facility request blocked without valid national ID / Shahkar mismatch
- [ ] Full manual test from `backend-dev/TEST-MANUAL.md` on production
- [ ] Kali/Burp: no unintended OTP bypass after DEV_OTP removed; admin roles enforced
- [ ] Run `scripts/reset-all.ts` only on staging — never on prod with real patients

## فارسی

- [ ] DEV_OTP_PHONE و DEV_OTP_CODE از پنل Runflare حذف شود (فقط بعد از تأیید SMS واقعی)
- [ ] SESSION_SECRET پروداکشن عوض شود
- [x] زیرساخت SMS واقعی وصل شد و OTP لایو کار کرد
- [ ] ورود با 00000 روی سایت واقعی کار نکند (بعد از حذف DEV)
- [ ] CRON یادآور نوبت روی Runflare فعال شود
