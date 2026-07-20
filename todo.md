# TODO — مهاجرت طرح `pastour` به Next.js + Tailwind

> هدف: کلون کامل ظاهر و جریان‌های فرانت پروتوتایپ `pastour` داخل پروژه Next.js فعلی،
> بدون کم‌وکاست در سطح UI/UX و منطق mock سمت کلاینت.
>
> دامنه: **فقط فرانت** (بدون بک‌اند واقعی / API واقعی / پرداخت واقعی).
> مرجع طرح: پوشه `pastour/` (در `.gitignore` است؛ فقط به‌عنوان blueprint استفاده شود).
> دامنه سایت: `pasteur.plus`
>
> وضعیت بیلد: `npm run build` موفق — حدود ۷۰+ مسیر استاتیک وب/اپ/ادمین.

---

## وضعیت فعلی اسکلت Next

- [x] پاک‌سازی boilerplate خام Next
- [x] RTL (`lang="fa"` / `dir="rtl"`)
- [x] فونت BYekan از `public/fonts`
- [x] فاویکون بر اساس لوگوی پاستور
- [x] متادیتای اولیه `pasteur.plus`
- [x] قرار دادن `/pastour` در `.gitignore`
- [x] صفحه placeholder موقت → جایگزین با لندینگ واقعی (فاز ۲)

---

## اصول مهاجرت (حتماً رعایت شود)

- [x] هر صفحه/جریان در `pastour` باید معادل Next داشته باشد (وب و/یا `/app`)
- [x] ظاهر و کپی متن‌ها با پروتوتایپ هم‌تراز باشد (نه بازطراحی آزاد)
- [x] استایل با **Tailwind build** (نه CDN) + توکن‌های برند از `main.css` / `app.css`
- [x] منطق مشترک React (hooks/services) — از دوبل‌کردن منطق وب/اپ پرهیز شود
- [x] داده‌ها فعلاً mock: `localStorage` / repository قابل تعویض با API بعدی
- [x] مسیرهای ادمین هم در scope فرانت هستند (لاگین mock مثل پروتوتایپ)

### شمارش مرجع پروتوتایپ

| سطح | تعداد تقریبی | مسیر مرجع |
|-----|-------------|-----------|
| وب عمومی | ۱۹ | `pastour/index.html` + `pastour/pages/**` |
| اپ موبایل | ۲۸ | `pastour/app/**` |
| ادمین | ۱۵ | `pastour/admin/**` |
| JS مشترک | ۱۱ | `pastour/js/**` |
| CSS | ۲ | `pastour/css/main.css`, `pastour/css/app.css` |

---

## فاز ۰ — Foundations (زیرساخت)

- [x] نقشه مسیرها (Route map) نهایی شود:
  - [x] `/` و صفحات عمومی (معادل `pages/`)
  - [x] `/app/*` شل موبایل (معادل `app/`)
  - [x] `/admin/*` پنل ادمین
- [x] پورت توکن‌های رنگ/سایه/radius از `pastour/css/main.css` به `globals.css` / `@theme`
- [x] پورت توکن‌ها و utilityهای ضروری اپ از `pastour/css/app.css`
- [x] تصمیم فونت نهایی: **BYekan** یکدست در کل پروژه
- [x] کپی لوگو: `pastour/assets/logo/logo.png` → `public/logo.png`
- [x] مدل‌های TypeScript معادل `PASTEUR_DATA` و موجودیت‌های storage
- [x] ماژول داده اولیه (`lib/data.ts`) از `pastour/js/data.js`
- [x] لایه repository / storage (`lib/storage.ts`) معادل `PasteurStorage` + کلیدها:
  - [x] bookings / pending booking / pending payment
  - [x] members / membership applications
  - [x] products / shop orders / shop VIP phones
  - [x] consultations / reminders / club / gallery / services
  - [x] visitors / commissions / facility requests / partner requests
  - [x] session: admin session, last payment, last booking
  - [x] app prefs: app view, cart, customer type, VIP phone
- [x] ابزارهای مشترک: فرمت قیمت `fa-IR`، نرمال‌سازی موبایل، `generateId` (`lib/utils.ts`)
- [x] انتزاع پرداخت mock (`lib/payment.ts`) برای booking / membership / shop-vip
- [x] `lib/routes.ts` نقشه مسیرها

---

## فاز ۱ — Design System و Chrome

### ۱.۱ کامپوننت‌های پایه
- [x] `Button` (primary / accent / danger / ghost / outline)
- [x] `Card` / VIP variant (معادل `.card-bordered` / `.card-vip`)
- [x] `Badge` وضعیت پزشک (available / busy / inactive)
- [x] `FormInput` / `FormLabel` / `Textarea` / `Select`
- [x] `Logo`
- [x] `EmptyState`
- [x] Modal / lightbox (عضویت قرارداد + گالری)

### ۱.۲ شل وب
- [x] Header چسبان + منوی دسکتاپ + همبرگر موبایل
- [x] Footer
- [x] Mobile bottom nav (≤767px)
- [x] لینک ورود ادمین در هدر

### ۱.۳ شل اپ (`/app`)
- [x] Layout: AppBar + status bar + bottom nav (`AppShell`)
- [x] آیتم‌های ناوبری: خانه / رزرو / تجهیزات / باشگاه / مشاوره
- [x] انیمیشن ورود صفحه (`app-page-enter`)
- [x] فریم موبایل در دسکتاپ (`.app-device`)
- [x] ترجیح نسخه موبایل + ریدایرکت از وب در عرض موبایل (`MobileAppRedirect`)

### ۱.۴ شل ادمین (`/admin`)
- [x] Layout سایدبار RTL + هدر صفحه (`AdminShell`)
- [x] گارد لاگین mock
- [x] خروج از پنل

---

## فاز ۲ — صفحات مارکتینگ و استاتیک (وب + اپ)

### ۲.۱ لندینگ
- [x] `/` معادل `pastour/index.html`
  - [x] Hero + CTA
  - [x] کارت‌های سریع خدمات
  - [x] گرید سرویس‌ها از storage/data
  - [x] آمار (stats)
  - [x] بلوک اعتماد / CTA
  - [x] دکمه «ورود به نسخه موبایل» → `/app`
  - [x] mockup موبایل

### ۲.۲ صفحات مشترک
- [x] تماس با ما — `/contact` + `/app/contact`
- [x] حریم خصوصی — `/privacy` + `/app/privacy`
- [x] پرستاری — `/nursing` + `/app/nursing`
- [x] لیزر و زیبایی — `/laser` + `/app/laser`
- [x] گالری قبل/بعد — `/gallery` + `/app/gallery` (فیلتر + lightbox)
- [x] درخواست همکاری — `/partners` + `/app/partners` (فرم + ذخیره)
- [x] خانه اپ — `/app`

---

## فاز ۳ — دندانپزشکی و رزرو نوبت

### ۳.۱ هاب و لیست‌ها
- [x] هاب دندانپزشکی — `/dental` + `/app/dental`
- [x] لیست دندانپزشکان — `/dental/general` + `/app/dental/general`
- [x] تخصص‌های دندانپزشکی — `/dental/specialty` + `/app/dental/specialty`
- [x] آموزش بیمار — `/dental/education` + `/app/dental/education`

### ۳.۲ جریان رزرو (ویزارد)
- [x] `/dental/booking` + `/app/dental/booking` (`BookingWizard`)
  - [x] نوار پیشرفت مراحل
  - [x] نوع خدمت: ویزیت / درمان
  - [x] انتخاب پزشک (یا `?doctor=`)
  - [x] روز / زمان / اسلات رزرو‌شده
  - [x] اطلاعات مراجع + کد معرف
  - [x] pending payment

### ۳.۳ پرداخت mock و نتیجه
- [x] تأیید پرداخت — `/dental/confirm` + `/app/dental/confirm`
- [x] موفقیت — `/dental/success` + `/app/dental/success`
- [x] ناموفق — `/dental/failed` + `/app/dental/failed`
- [x] امتیاز باشگاه (+۵۰) در تکمیل رزرو (داخل `PaymentFlow`)

---

## فاز ۴ — عضویت مجموعه‌ها

- [x] صفحه عضویت — `/dental/membership` + `/app/dental/membership`
  - [x] کارت‌های طرح عادی / VIP
  - [x] خدمات مشترک / پوشش مجموعه‌ها
  - [x] مدت یک‌ساله / دوساله + تخفیف
  - [x] محاسبه‌گر وام ۱۲٪ + سقف
  - [x] فرم پیشنهاد صدور عضویت کامل
  - [x] پیش‌نمایش قرارداد + چاپ
  - [x] ذخیره application + پرداخت mock
- [x] نمایش در ادمین (فاز ۸)

---

## فاز ۵ — پزشکی و مشاوره / ویزیت

- [x] هاب پزشکی — `/medical` + `/app/medical`
- [x] لیست تخصص‌ها — `/medical/specialty` + `/app/medical/specialty`
- [x] فرم مشاوره — `/consultation` + `/app/consultation`
  - [x] انواع مشاوره، دسته، برآورد، آپلود تصویر
  - [x] deep link: `category` / `specialty` / `type`
  - [x] امتیاز باشگاه (+۲۰)

---

## فاز ۶ — فروشگاه تجهیزات

- [x] انتخاب نوع مشتری — `/shop` + `/app/shop`
- [x] فعال‌سازی VIP — `/shop/vip` + `/app/shop-vip`
- [x] کاتالوگ — `/shop/catalog` + `/app/shop-catalog`
- [x] سبد و ثبت سفارش — `/shop/cart` + `/app/shop-cart`
- [x] موفقیت سفارش — `/shop/success` + `/app/shop-success`
- [x] تسهیلات VIP — `/shop/facility` + `/app/shop-facility`
- [x] تخفیف ۲٪ VIP + پرداخت VIP از مسیر confirm مشترک

---

## فاز ۷ — باشگاه مشتریان و یادآورها

### ۷.۱ باشگاه
- [x] `/club` + `/app/club`
  - [x] پروفایل با موبایل، امتیاز، سطح، redeem، ماموریت، تاریخچه، دعوت، قوانین
  - [x] قواعد امتیاز رزرو/مشاوره/معرفی در storage/payment

### ۷.۲ یادآورها
- [x] `/reminders` + `/app/reminders`
  - [x] مجوز Notification، ساخت از آخرین رزرو، لیست/حذف
  - [x] آیکون نوتیفیکیشن با لوگو

---

## فاز ۸ — پنل ادمین (فرانت mock)

- [x] لاگین — `/admin/login` (`admin` / `pasteur1403`)
- [x] داشبورد — `/admin`
- [x] رزروها — `/admin/bookings`
- [x] مشاوره‌ها — `/admin/consultations`
- [x] یادآورها — `/admin/reminders`
- [x] سرویس‌ها — `/admin/services`
- [x] باشگاه — `/admin/club`
- [x] گالری — `/admin/gallery`
- [x] ویزیتورها — `/admin/visitors`
- [x] پورسانت‌ها — `/admin/commissions`
- [x] تسهیلات — `/admin/facilities`
- [x] همکاری‌ها — `/admin/partners`
- [x] پزشکان — `/admin/doctors`
- [x] عضویت‌ها — `/admin/memberships`
- [x] فروشگاه ادمین — `/admin/shop`

---

## فاز ۹ — Cross-cutting و Parity دقیق

### ۹.۱ منطق مشترک
- [x] اعتبارسنجی کد معرف در برابر visitors فعال (`findVisitorByCode`)
- [x] ثبت commission روی رزرو / عضویت / shop-vip
- [x] Payment abstraction برای هر سه kind
- [x] واحد پول تومان در UI
- [x] Deep linkها و query paramها

### ۹.۲ PWA / مانیفست
- [x] `public/manifest.webmanifest` با `start_url: /app`
- [x] theme-color `#0891b2` در metadata

### ۹.۳ دارایی‌ها و محتوا
- [ ] جایگزینی تدریجی تصاویر Unsplash با دارایی نهایی (در صورت موجود از کارفرما)
- [x] لوگو در هدر وب/اپ
- [x] متادیتا و OG پایه

### ۹.۴ کیفیت و دسترس‌پذیری
- [x] RTL در root layout
- [ ] تست دستی عرض: ۳۶۰ / ۳۹۰ / ۴۳۰ / تبلت / دسکتاپ (کارفرما / QA)
- [ ] مقایسه بصری با اسکرین‌شات‌های `pastour/update/**` (کارفرما / QA)

---

## فاز ۱۰ — تست انتها‌به‌انتها و Cutover

### ۱۰.۱ مسیرهای کاربر (دستی — باقی‌مانده برای QA)
- [ ] لندینگ → ورود به اپ → بازگشت به وب
- [ ] دندانپزشکی → رزرو ویزیت → پرداخت موفق → موفقیت → یادآور
- [ ] رزرو درمان → پرداخت ناموفق → تلاش مجدد
- [ ] عضویت عادی/VIP → محاسبه وام → قرارداد → پرداخت
- [ ] پزشکی → تخصص → مشاوره با تصویر
- [ ] پرستاری / لیزر / تماس / همکاری / حریم خصوصی
- [ ] فروشگاه عادی → سبد → سفارش
- [ ] فروشگاه VIP → پرداخت VIP → تخفیف ۲٪ → تسهیلات
- [ ] باشگاه → redeem → مشاهده تاریخچه
- [ ] گالری → فیلتر → lightbox

### ۱۰.۲ مسیرهای ادمین (دستی — باقی‌مانده برای QA)
- [ ] لاگین / خروج
- [ ] مشاهده و لغو رزرو
- [ ] پاسخ مشاوره
- [ ] CRUD سرویس‌ها و اثر روی لندینگ
- [ ] CRUD گالری
- [ ] ویزیتور + پورسانت
- [ ] سفارش فروشگاه و تغییر وضعیت
- [ ] عضویت‌ها و درخواست‌ها
- [ ] تسهیلات و همکاری‌ها

### ۱۰.۳ بستن مهاجرت
- [x] حذف/جایگزینی کامل صفحه placeholder
- [x] مسیرهای مهم پروتوتایپ معادل Next دارند (تأیید با `next build` route list)
- [ ] چک‌لیست parity دستی امضا شود (وب + اپ + ادمین)
- [x] آماده‌سازی برای فاز بک‌اند بعدی (خارج از این TODO)

---

## خارج از scope این TODO (عمداً بعداً)

- بک‌اند / دیتابیس / API واقعی
- احراز هویت امن ادمین
- درگاه پرداخت واقعی و webhook
- بیلد نهایی Flutter (فقط handoff در `pastour/flutter-handoff.md`)
- ادیتور کامل برنامه حضور پزشکان در ادمین (در خود پروتوتایپ هم ناقص است)

---

## ترتیب پیشنهادی اجرا

`فاز ۰ → ۱ → ۲ → ۳ → ۴ → ۵ → ۶ → ۷ → ۸ → ۹ → ۱۰`

**پیشرفت پیاده‌سازی:** فازهای ۰ تا ۹ (به‌جز تست دستی و جایگزینی تصاویر نهایی) انجام شده‌اند.  
**باقی‌مانده اصلی:** فاز ۱۰ تست دستی E2E توسط کارفرما/QA.
