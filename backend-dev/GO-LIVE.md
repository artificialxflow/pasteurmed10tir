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
- [ ] Connect real SMS provider for OTP (replace mock API)
- [ ] (Optional) Separate production database — update `DATABASE_URL`
- [ ] (Optional) Rotate Postgres password

## Final tests

- [ ] Full manual test from `backend-dev/TEST-MANUAL.md` on production
- [ ] Kali/Burp: no dev OTP bypass; admin roles enforced
- [ ] Run `scripts/reset-all.ts` only on staging — never on prod with real patients

## فارسی

- [ ] DEV_OTP_PHONE و DEV_OTP_CODE از پنل Runflare حذف شود
- [ ] SESSION_SECRET پروداکشن عوض شود
- [ ] SMS واقعی وصل شود
- [ ] ورود با 00000 روی سایت واقعی کار نکند
