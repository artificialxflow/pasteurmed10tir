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

---

## فاز 8 - فروشگاه و عضویت کامل در اپ
- [x] `js/app-shop.js` — سبد خرید، VIP، checkout
- [x] `app/shop.html` — انتخاب نوع مشتری (عادی / VIP)
- [x] `app/shop-catalog.html` — لیست محصول + جستجو + فیلتر
- [x] `app/shop-cart.html` — سبد خرید و ثبت سفارش
- [x] `app/shop-vip.html` — فعال‌سازی VIP تجهیزات + پرداخت
- [x] `app/shop-success.html` — تأیید سفارش
- [x] `app/shop-facility.html` — درخواست تسهیلات VIP
- [x] `js/app-membership.js` + تکمیل `app/dental/membership.html`
- [x] به‌روزرسانی `js/payment.js` برای مسیرهای اپ و shop-vip
- [ ] تست دستی مسیر خرید و عضویت (کارفرما)

---

## فاز 9 - Parity کامل با وب
- [x] VIP فروشگاه: دکمه «قبلاً VIP هستم» + کد معرف
- [x] عضویت: فرم کامل، محاسبه‌گر وام، پیش‌نمایش/چاپ قرارداد
- [x] استایل modal و coverage در `css/app.css`
- [ ] تست دستی parity (کارفرما)

---

## فاز ۱۰ - Parity UI با وب (صفحات کلیدی)
- [x] `booking.js` — نوار پیشرفت رزرو با استایل `app-*` در اپ
- [x] `app/dental/general.html` — badge وضعیت + روز/ساعت + غیرفعال برای inactive
- [x] `app/gallery.html` — فیلتر دسته + lightbox بزرگنمایی
- [x] `app/contact.html` — hero + ساعات + آدرس + دکمه‌های سریع
- [x] `app/dental/index.html` — اصلاح kicker hero
- [x] `css/app.css` — استایل progress، gallery، lightbox
- [ ] تست دستی فاز ۱۰ (کارفرما)

---

## فاز 7 - بهبود UI و تکمیل قابلیت‌ها (بازبینی)
- [x] گسترش `css/app.css` — Design System + utility classes (`.hidden`, `.app-*`)
- [x] AppBar با status bar و لوگوی واقعی
- [x] رفع باگ Tailwind/`hidden` در consultation، club، booking
- [x] آپلود تصویر در `app/consultation.html`
- [x] `manifest.webmanifest` → `app/index.html`
- [x] تکمیل باشگاه: ماموریت، تاریخچه، معرفی، کد دعوت
- [x] صفحات جدید: `reminders`, `laser`, `dental/education`
- [x] اعزام مجموعه + آموزش در dental index
- [x] گالری، لیزر، یادآور در دسترسی سریع خانه
- [x] یکپارچه‌سازی استایل tile/card در صفحات اصلی
- [ ] تست دستی روی 360px / 390px / 430px (کارفرما)
- [x] فرم VIP/عضویت کامل داخل اپ
