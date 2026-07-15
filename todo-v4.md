# TODO v4 - نسخه موبایل شبیه اندروید (پیش‌نمای HTML → Flutter)

> هدف: طراحی تجربه کاربری موبایل شبیه اپ اندروید با HTML/CSS/JS فعلی،
> به‌عنوان blueprint برای پیاده‌سازی نهایی با Flutter.

---

## فاز 0 - اصلاح متن‌ها و UX کوتاه‌مدت
- [x] تغییر دکمه «ثبت تخصصی» به «درخواست ویزیت تخصصی» در `pages/medical.html`
- [x] بهبود توضیح کارت تخصص‌ها
- [x] یکسان‌سازی CTA در `pages/medical/specialty.html`

---

## فاز 1 - Design System موبایل (Android-like)
- [x] `css/app.css`
- [x] `js/app-components.js`

---

## فاز 2 - App Shell و نقطه ورود
- [x] پوشه `app/` و `app/index.html`
- [x] دکمه «ورود به نسخه موبایل» در `index.html`
- [x] mockup موبایل لندینگ → `app/index.html`
- [x] localStorage ترجیح نسخه موبایل + redirect خودکار

---

## فاز 3 - مسیرهای اصلی (MVP)
- [x] `app/index.html`
- [x] `app/medical.html` + `app/medical/specialty.html`
- [x] `app/consultation.html`
- [x] `app/dental/*` (index, general, booking, specialty, membership, confirm, success, failed)
- [x] `app/shop.html`, `app/club.html`, `app/nursing.html`

---

## فاز 4 - صفحات تکمیلی
- [x] `app/contact.html`
- [x] `app/partners.html`
- [x] `app/gallery.html`
- [x] `app/privacy.html`

---

## فاز 5 - جزئیات اندرویدی
- [x] انیمیشن `app-page-enter`
- [x] Snackbar
- [x] Safe area / frame موبایل
- [x] Empty state در لیست پزشکان

---

## فاز 6 - Flutter handoff
- [x] `flutter-handoff.md`
- [ ] تست دستی روی 360px / 390px / 430px (کارفرما)
- [ ] تست کل مسیرها از لندینگ تا ثبت درخواست (کارفرما)

---

## خارج از scope
- پنل ادمین (وب دسکتاپ)
- بک‌اند واقعی و API
- build نهایی Flutter
