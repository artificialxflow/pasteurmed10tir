# TODO v6 — SMS + Zohal + Go-Live prep

سایت: `https://pasteur.plus`  
آخرین به‌روزرسانی: ۲۰۲۶-۰۸-۰۹

پیش‌نیاز:

- [x] پترن‌های SMS تأیید + env روی Runflare
- [x] Zohal env روی سرور
- [x] Deploy + OTP واقعی لایو
- [x] تسهیلات + زحل لایو تست شد
- [x] تأیید کاربری `/admin/patients` لایو تست شد
- [x] `DEV_OTP_*` عمداً هنوز روی سرور مانده تا Go-Live بند ۴

جزئیات اجرایی Go-Live: **`backend-dev/GO-LIVE.md`**

---

## Body ID مرجع

| کاربرد | env | bodyId |
|--------|-----|--------|
| OTP | `SMS_OTP_BODY_ID` | `514428` |
| یادآور ۲۴س | `SMS_REMINDER_24H_BODY_ID` | `514430` |
| یادآور ۲س | `SMS_REMINDER_2H_BODY_ID` | `514431` |
| رزرو | `SMS_BOOKING_BODY_ID` | `514432` |
| مشاوره | `SMS_CONSULTATION_BODY_ID` | `514436` |

---

## باقی‌مانده تا تکمیل کامل

```text
Runflare: SESSION_SECRET جدید + CRON_SECRET
  → تست SMS مشاوره/رزرو (C)
  → تست cron (D)
  → رگرسیون DEV یک‌بار (B)
  → حذف DEV_OTP_* (F)
```

### Runflare / Go-Live (اقدام فوری انسان)

- [ ] کپی `SESSION_SECRET` جدید از `.env.production` به پنل Runflare
- [ ] کپی `CRON_SECRET` از `.env.production` به پنل Runflare
- [ ] زمان‌بندی `POST /api/cron/sms-reminders` هر ۱۰–۱۵ دقیقه
- [ ] تست cron تا HTTP 200 شود (الان بدون env روی سرور → 503)

### فاز C — SMS تراکنشی (تست لایو)

- [x] کد آماده و دیپلوی شده
- [ ] مشاوره لایو → SMS
- [ ] رزرو لایو → SMS

### فاز D — یادآور

- [x] کد + راهنما + `CRON_SECRET` در فایل لوکال
- [ ] فعال روی Runflare (بالا)

### فاز B — رگرسیون

- [x] OTP واقعی لایو
- [ ] یک‌بار `09126723365` / `00000` قبل از حذف DEV

### فاز F — حذف DEV

- [ ] فقط بعد از C+D طبق `GO-LIVE.md` بند ۴

---

# فازها (خلاصه)

## A SMS lib — ✅ تمام

## B OTP login — 🟨 تقریباً تمام (فقط رگرسیون DEV صریح)

- [x] کد، deploy، migration، OTP واقعی لایو

## C transactional SMS — 🟨 کد ✅ / تست مانده

## D reminders — 🟨 کد ✅ / Runflare CRON مانده (لایو الان 503)

## E Zohal — ✅ لایو تأیید شد

- [x] کد + UX ادمین
- [x] تست واقعی از `/shop/facility` → `/admin/facilities`
- [x] Deploy UX تسهیلات

## F Go-Live — 🟨 در حال اجرا

- [x] داک اجرایی به‌روز (`GO-LIVE.md`)
- [x] `SESSION_SECRET` لوکال `.env.production` از placeholder ضعیف چرخانده شد
- [ ] اعمال env روی Runflare + حذف DEV در انتها

## G Admin patients UX — ✅ لایو تأیید شد

- [x] کد UX
- [x] Deploy
- [x] تست لایو (تأیید امامی۲ + پیام موفقیت)

---

## وضعیت پیشرفت

| فاز | وضعیت | نکته |
|-----|--------|------|
| A SMS lib | ✅ | |
| B OTP | 🟨 | رگرسیون DEV قبل از حذف |
| C SMS تراکنشی | 🟨 | تست مشاوره/رزرو |
| D Reminders | 🟨 | CRON روی Runflare = 503 فعلاً |
| E Zohal | ✅ | لایو OK |
| F Go-Live | 🟨 | طبق GO-LIVE.md |
| G Patients UX | ✅ | لایو OK |

---

## ایمنی

- سکرت‌ها را در چت نگذار.
- `.env.production` را commit نکن.
- تا SMS تراکنشی و CRON سبز نشده، `DEV_OTP_*` را از Runflare حذف نکن.
- اگر توکن زحل قبلاً در `updates/` بوده، بچرخان.
