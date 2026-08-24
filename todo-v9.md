# TODO v9 — عضویت/وام/کیف/اقساط + پزشکان per-day + باگ‌های 07

سایت: `https://pasteur.plus`  
آخرین به‌روزرسانی: ۲۰۲۶-۰۸-۲۴ (فاز ۱۷ — `07/16` · فاز ۱۶ — `07/15` · فاز ۱۴ — `07/12` + `07/14` · فاز ۱۵ — `07/13` · فاز ۱۳ — `07/11` · فاز ۱۲ — `07/10` · فاز ۱۱ — `07/08` + `07/09` · فاز ۱۰ — `07/07` · فاز ۲.۱.۱ — `07/06` · فاز ۹ — `07/05` ✅ · فاز ۸ — `07/04` · فاز ۷ — `07/02` + `07/03` · فاز ۱–۴ — `07/01`)  
مرجع: `updates/07/01/` · `updates/07/02/` · `updates/07/03/` · `updates/07/04/` · `updates/07/05/` · `updates/07/06/` · `updates/07/07/` · `updates/07/08/` · `updates/07/09/` · `updates/07/10/` · `updates/07/11/` · `updates/07/12/` · `updates/07/13/` · `updates/07/14/` · `updates/07/15/` · `updates/07/16/` · `todo-v8.md` · `MANUAL-SMOKE-CHECKLIST.md`

> **هدف v9:** جداسازی عضویت از درخواست وام، **کد ملی اجباری در درخواست وام**، رفع باگ «اقساط بدون لاگین»، نمایش وام/اقساط بعد از تأیید ادمین، شفاف‌سازی کیف اعتبار، **ساعت حضور جدا برای هر روز پزشک**، **پورسانت دوگانه ویزیتور (بالینی vs فروشگاه)**، **شفاف‌سازی رزرو vs استعلام بیمه در پنل**، **تخصص دندانپزشکی در ادمین + فیلتر رزرو (`/dental/specialty`)**، **کلیپ‌های آموزشی دندان از ادمین**، **امتیاز باشگاه برای عضویت طرح (۱۰۰)**، **شفاف‌سازی سرویس‌های صفحه اصلی vs محتوای داخل**، **تعویض تصویر hero صفحه اصلی**، **محتوای تو در تو (دسته/خدمت) روی همان سرویس اضافه‌شده**، **QR/بارکد برای اسکن و دسترسی به خدمات**.  
> **ادامه v8:** فاز ۰ (محتوا) و go-live — در v9 فاز ۰ و ۵.

---

## خلاصه وضعیت

| موضوع | v8 | v9 |
|--------|-----|-----|
| لغو/ویرایش رزرو، تیکت، consultation، visitors | ✅ | — |
| عضویت + وام در یک فرم (`/dental/membership`) | 🟨 | ⬜ فاز ۲ |
| تأیید وام ادمین → نمایش برای بیمار | ❌ gap | ⬜ فاز ۲ |
| کد ملی در درخواست وام (`07/06`) | ❌ اختیاری | ✅ کد فاز ۲.۱.۱ · smoke ⬜ |
| `/installments` با session فعال | ❌ باگ | ✅ کد فاز ۱ · smoke ⬜ |
| کیف: سقف vs موجودی vs تراکنش | 🟨 گیج‌کننده | ⬜ فاز ۳ |
| `/admin/doctors` — یک فیلد ساعات برای همه روزها | 🟨 | ✅ کد فاز ۷ · smoke ⬜ |
| `schedule` رزرو vs فیلد `hours` ادمین | ❌ ناهم‌خوان | ✅ کد فاز ۷ · smoke ⬜ |
| ادمین «۱۰–۲۲» → رزرو درمان اسلات **۹–۱۷** (`07/03`) | ❌ باگ smoke | ✅ کد فاز ۷ · smoke ⬜ |
| `/dental/general` — کارت per روز (یک پزشک، چند روز) | 🟨 | ✅ کد فاز ۷.۳ · smoke ⬜ |
| پورسانت ویزیتور — یک درصد برای همه منابع | 🟨 | ⬜ فاز ۸ |
| پورسانت جدا: دندان/پزشکی vs فروشگاه (`07/04`) | ❌ gap | ⬜ فاز ۸ |
| CTA «درخواست همکاری» در `/contact` (`07/05`) | 🟨 | ✅ فاز ۹ |
| تأیید رزرو ادمین vs «در انتظار کارشناس» پنل (`07/07`) | 🟨 ابهام UX | ⬜ فاز ۱۰ |
| تخصص دندان — ادمین فقط «عمومی» · specialty→general بدون فیلتر (`07/08`) | ❌ gap | ✅ کد فاز ۱۱ · smoke ⬜ |
| `/dental/specialty` (ایمپلنت) → همان دکتر عمومی | ❌ | ✅ کد فاز ۱۱ · smoke ⬜ |
| CTA «رزرو نوبت با پزشک» در `/dental/specialty` (`07/09`) | 🟨 | ✅ فاز ۱۱.۳ |
| کلیپ آموزشی دندان — ادمین ندارد (`07/10`) | ❌ gap | ⬜ فاز ۱۲ |
| باشگاه: ماموریت «عضویت طرح» + ۱۰۰ امتیاز (`07/11`) | ❌ gap | ✅ کد فاز ۱۳ · smoke ⬜ |
| سرویس صفحه اصلی ≠ محتوای داخل (`07/12` + `07/14`) | 🟨 ابهام UX | ✅ کد فاز ۱۴ · smoke ⬜ |
| منوی لیزر/پرستاری/پزشکان ≠ سرویس اضافه‌شده · نیاز دسته/خدمت روی سرویس (`07/15`) | ❌ gap محصول | ✅ تصمیم ۱۶ = **A** (فاز ۱۴ کافی) |
| بارکد/QR اسکن برای دسترسی به خدمات (`07/16`) | ❌ وجود ندارد | ✅ کد فاز ۱۷ **B** · smoke ⬜ |
| hero صفحه اصلی — قاب موبایل + عکس قدیمی (`07/13`) | 🟨 | ✅ کد فاز ۱۵ · smoke ⬜ |
| محتوای واقعی از ادمین (فاز ۰ v8) | ⬜ | ⬜ فاز ۰ |
| Go-live ops (فاز ۶ v8) | ⬜ | ⬜ فاز ۵ |

---

## migrations

| Migration | موضوع | v9 |
|-----------|--------|-----|
| — | فاز ۱–۴، ۷ — احتمالاً بدون migration | ⬜ |
| (در صورت نیاز) | فیلد `loanRequestStatus` جدا از `membership paid` | ⬜ بررسی |
| `014_visitor_commission_split` (پیشنهادی) | `commissionRateClinical` + `commissionRateShop` روی `Visitor` | ⬜ فاز ۸ |
| (در صورت ۱۰.۳) | `bookingId` روی `InsuranceInquiry` | ⬜ فاز ۱۰ |
| `015_dentist_specialty_id` | `specialtyId` روی `Dentist` | ✅ migration آماده · deploy ⬜ |
| `016_dental_education_clips` (پیشنهادی) | مدل کلیپ آموزشی دندان + seed | ⬜ فاز ۱۲ |
| `017_service_nested_catalog` (پیشنهادی) | دسته/آیتم وابسته به `Service` | ⬜ فاز ۱۶ |
| (در صورت ۱۷.۲ C) | `patientAccessCode` / barcode روی پروفایل | ⬜ فاز ۱۷ |
| — | فاز ۱۳–۱۵ · ۱۷.۱ A/B — بدون migration یا کم | ⬜ |

---

# فاز ۰ — محتوای واقعی (ادامه v8) (P0)

**مرجع:** `todo-v8.md` §۰.۱

**وابستگی:** برای دندانپزشکان با ساعت متفاوت هر روز → ابتدا **فاز ۷** (یا موقت با seed؛ فیلد `hours` فعلاً روی رزرو اثر مستقیم ندارد).

- [ ] `/admin/services` — کارت‌های صفحه اصلی (**بعد از فاز ۱۴** — بنر راهنما vs لیزر/پرستاری)
- [ ] `/admin/laser-services` · `/admin/nursing-services` — محتوای داخل کاتالوگ (همراه فاز ۰)
- [ ] `/admin/doctors` — دندانپزشک + متخصص (**بعد از فاز ۷** برای ساعت per-day · **بعد از ۱۱** برای dropdown تخصص)
- [ ] `/admin/insurances` — بیمه پایه/مکمل
- [ ] `/admin/consultation-prices` — انواع پیش‌فرض + ذخیره
- [ ] `/admin/bookings` — مبلغ بیعانه
- [ ] `/admin/visitors` — پورسانت (**بعد از فاز ۸** برای clinical vs shop)
- [ ] smoke: `/` · `/dental/general` · `/dental/booking` · CRUD پزشکان

**Done when:** مسیر اصلی بیمار با داده واقعی مرکز کار کند.

---

# فاز ۱ — باگ: اقساط/کیف «ابتدا وارد شوید» (P0)

**گزارش `07/01` #3:** از `/account` (لاگین) → «اقساط» → «ابتدا باید وارد پنل کاربری شوید».

**علت:** `/api/auth/me` → `{ profile: { phone } }` ولی `InstallmentsPage` / `WalletPage` دنبال `data.user.phone` می‌گردند.

### ۱.۱ — Fix کد

- [x] `components/account/InstallmentsPage.tsx` — خواندن `profile.phone`
- [x] `components/wallet/WalletPage.tsx` — همین fix + auto-load
- [x] grep سراسری: `data.user?.phone` بعد از `/api/auth/me` → اصلاح (`ClubPage` هم)

### ۱.۲ — Smoke

- [ ] لاگین → `/account` → **اقساط** → «اقساط من» (نه پیام لاگین)
- [ ] `/wallet` — auto-load با session (بدون تایپ دستی موبایل)
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — بند v9.۱

**Done when:** با session فعال، `/installments` و `/wallet` بدون پیام «وارد شوید» لود شوند.  
**کد:** ✅ ۲۰۲۶-۰۸-۲۴ · **Smoke:** ⬜ بعد deploy

---

# فاز ۲ — وام درمانی: جدا از عضویت + نمایش بعد از تأیید (P0)

**گزارش `07/01` #1 و #2** · **`07/06` #8** (کد ملی)

### ۲.۰ — تشخیص

| مسیر | کار | مشکل |
|------|-----|------|
| `/dental/membership` | عضویت + `loanAmount` در یک فرم | قاطی |
| `/dental/membership` — فیلد کد ملی | UI + submit | **اختیاری** — فقط نام/موبایل validate می‌شود |
| `POST …/membership-applications` | ثبت درخواست | `nationalId` nullable — بدون checksum |
| `/admin/memberships` → credit-check | زحل/شاهکار | بدون کد ملی روی رکورد → اجرا نمی‌شود |
| `/admin/memberships` | approve وام | فقط `status` — **بدون** `InstallmentPlan` |
| `/installments` | طرح‌های فعال | خالی بعد از approve |
| `/wallet` | سقف ۱۵M | ≠ وام — **بسته اعتبار عضویت** |

**الگوی موجود:** `ShopFacility` + `POST /api/commerce/facilities` — کد ملی ۱۰ رقمی + `isValidNationalId` (`lib/validation/national-id.ts`)

**فایل‌های کلیدی:** `components/dental/MembershipPage.tsx` · `app/api/commerce/membership-applications/route.ts` · (بعداً) فرم وام `/account`

### ۲.۱.۱ — کد ملی اجباری در درخواست وام (`07/06`) (P0)

**گزارش `07/06` #8:** «در قسمت درخواست وام حتماً کد ملی ضروری باشه»

> **می‌توان روی فرم فعلی `/dental/membership` قبل از جداسازی کامل فاز ۲.۱ پیاده کرد.**

- [x] `MembershipPage.tsx` — `required` روی input کد ملی وقتی `loanAmount > 0`
- [x] `submitApplication`: `normalizeNationalId` + `isValidNationalId` — پیام «کد ملی ۱۰ رقمی معتبر الزامی است»
- [x] `POST …/membership-applications`: اگر `loanAmount > 0` → reject 400 بدون کد ملی معتبر · ذخیره normalized
- [ ] (بعد از ۲.۱) فرم «درخواست وام درمانی» در `/account` — همان validation
- [ ] smoke: submit با وام بدون کد ملی → خطا · با کد معتبر → ستون کد ملی در `/admin/memberships` · credit-check قابل اجرا

**Done when:** درخواست با وام بدون کد ملی معتبر ثبت نشود.  
**کد:** ✅ ۲۰۲۶-۰۸-۲۴ · **Smoke:** ⬜ بعد deploy

### ۲.۱ — جداسازی UX

- [ ] **عضویت:** پرداخت حق عضویت — `/dental/membership` (بدون وام اجباری در همان submit)
- [ ] **درخواست وام:** بخش در `/account` («درخواست وام درمانی») — `loanAmount` → `MembershipApplication`
- [ ] copy: «سقف ۱۵M = اعتبار بسته عضویت» vs «وام = طرح اقساط جدا»
- [ ] لینک از بلوک «اعتبارسنجی بانکی» به flow وام

### ۲.۲ — Backend: approve → طرح اقساط

- [ ] `PATCH …/membership-applications/[id]` + `approved` + `loanAmount > 0` → `createMembershipInstallmentPlan` (الگو: facilities)
- [ ] سود ۱۲٪، تعداد اقساط — از metadata / `loanAmount`
- [ ] `rejected` — بدون plan · idempotent روی approve مجدد

### ۲.۳ — UI بیمار

- [ ] `/account` — کارت «درخواست وام من»: pending / approved / rejected
- [ ] `/installments` — طرح وام بعد از approve
- [ ] empty state به‌روز

### ۲.۴ — Smoke

- [ ] عضویت → `/wallet` سقف ۱۵M، موجودی ۰
- [ ] وام از account → admin zohal → تأیید → `/installments`
- [ ] `/admin/facilities` ≠ وام عضویت
- [ ] وام بدون کد ملی → رد (`07/06`) · با کد ملی → credit-check در ادمین

**Done when:** بیمار بعد از تأیید وام طرح را در «اقساط من» ببیند؛ درخواست وام همیشه کد ملی معتبر دارد.

---

# فاز ۳ — شفاف‌سازی کیف اعتبار (P1)

**گزارش `07/01` #4**

### ۳.۱ — UI بیمار (`/wallet`)

- [ ] برچسب **سقف اعتبار** vs **موجودی**
- [ ] «موجودی ۰ تا اولین مصرف طبیعی است»
- [ ] لینک `/installments`

### ۳.۲ — UI ادمین (`/admin/wallets`)

- [ ] راهنما: سقف / موجودی / تراکنش
- [ ] انواع: `upgrade` | `credit` | `debit` | `adjustment`
- [ ] زمان ثبت تراکنش (ارتقای سقف عضویت، …)

### ۳.۳ — (اختیاری) ثبت دستی تراکنش ادمین

- [ ] فرم credit/debit یا مستند «فقط از جریان سایت»

**Done when:** تفاوت سقف/موجودی/وام بدون ابهام.

---

# فاز ۴ — تسهیلات تجهیزات vs وام عضویت (P1)

- [ ] `/account` — تسهیلات → `/shop/facility` · وام → فاز ۲
- [ ] `/admin/memberships` — بنر ارجاع به `/admin/facilities`
- [ ] `/admin/facilities` — empty state واضح
- [ ] smoke: facility approve → plan در `/installments`

---

# فاز ۵ — Go-live ops (ادامه v8 فاز ۶) (P0 ops)

- [ ] `SESSION_SECRET` + `CRON_SECRET`
- [ ] `ZOHAL_TOKEN` + smoke واقعی
- [ ] CRON `/api/cron/sms-reminders`
- [ ] SMS body IDs
- [ ] Zibal IP whitelist + پرداخت واقعی
- [ ] حذف `DEV_OTP_*`
- [ ] `MANUAL-SMOKE-CHECKLIST.md` full pass
- [ ] `KALI-SECURITY-CHECKLIST.md`

---

# فاز ۶ — polish و مستندات (P2)

- [ ] `MANUAL-SMOKE-CHECKLIST.md` — بند v9 (… محتوای تو در تو سرویس، **QR/بارکد دسترسی**)
- [ ] `todo-v8.md` — ارجاع «ادامه در v9»
- [ ] `todo-v6` R4 وقتی فاز ۰ تمام شد
- [ ] (اختیاری) badge تیکت باز dashboard (v8)

---

# فاز ۷ — پزشکان: ساعت حضور per-day (`07/02` + `07/03`) (P0)

**گزارش `07/02` #5:** «هر روز جلوش ساعت داشته باشه — روزهای متفاوت ساعت‌های متفاوت»

**گزارش `07/03` (smoke live — دکتر وحید واحد):**
- ادمین: ساعت **۱۰ تا ۲۲** ثبت شده
- `/dental/booking` (درمان): اسلات **۹–۱۰ … ۱۶–۱۷** — نه تا ۲۲
- `/dental/general`: دو کارت جدا (یکشنبه ۱۰–۱۶، سه‌شنبه ۱۰–۲۲) — رفتار مطلوب برای نمایش per-day

**اسکرین‌ها:** `updates/07/03/photo_*` · ادمین: `07/02/photo_*`

### ۷.۰ — تشخیص (وضعیت فعلی)

| لایه | الان | مشکل |
|------|------|------|
| UI ادمین | `days` متنی + `hours` یک فیلد | ساعت per-day قابل set نیست |
| مدل `Dentist` | `schedule: Record<day, DaySchedule>` | **وجود دارد** ولی UI پر نمی‌کند |
| `defaultScheduleForDays` | `buildVisitHours(9,17)` + `buildTreatmentSlots(9,17,…)` | **علت اسلات ۹–۱۷** — نادیده گرفتن «۱۰–۲۲» |
| `BookingWizard` | `schedule[day].treatmentSlots` | از schedule می‌خواند — نه `hours` |
| `DentistList` | یک کارت per پزشک (`days` + `hours`) | per-day جدا نیست (یا workaround: چند رکورد) |

**وابستگی:** فاز **۱۱** (فیلتر تخصص) با **۷.۳** (per-day cards) — فیلتر specialty قبل یا همزمان با general per-day.

**فایل‌های کلیدی:** `app/admin/(panel)/doctors/page.tsx` · `lib/content/doctor-mappers.ts` · `components/dental/BookingWizard.tsx` · `components/dental/DentistList.tsx` · `components/dental/SpecialtyList.tsx`

### ۷.۱ — UI ادمین (`/admin/doctors` — تب دندانپزشک)

- [x] ۷ ردیف روز هفته (شنبه … جمعه): checkbox «حضور» + فیلد ساعت «از–تا» (مثلاً ۱۰–۲۲)
- [x] جایگزینی فیلدهای قدیمی «روزها، ساعات» (یا نگه‌داشتن `hours` به‌صورت خلاصه auto-generated)
- [x] ویرایش inline در جدول — per-day برای هر پزشک
- [x] (اختیاری) treatment slots ساده per-day یا پیش‌فرض از visitHours

### ۷.۲ — Backend / mapper

- [x] `parseHoursRange("10 تا 22")` → `{ start: 10, end: 22 }`
- [x] `buildScheduleFromDayHours(...)` → per-day `visitHours` + `treatmentSlots` تا **end-1** (مثلاً ۱۰–۲۲ → اسلات ۱۰–۱۱ … ۲۱–۲۲)
- [x] `normalizeDentistBody`: schedule از UI یا parse `hours` — **حذف hardcode ۹–۱۷**
- [x] migrate رکوردهای موجود: regenerate `schedule` از `hours` / per-day UI
- [x] `days[]` از روزهای فعال · `hours` خلاصه نمایشی

### ۷.۳ — نمایش عمومی + رزرو (`07/03`)

- [x] `/dental/booking` — درمان: اسلات تا آخر بازه (۱۰–۲۲ نه ۹–۱۷)
- [x] `/dental/booking` — ویزیت: `visitHours` همان بازه روز
- [x] `/dental/general` — **یک کارت per (پزشک + روز)** با ساعت همان روز (مثل اسکرین 07/03)
- [x] لینک رزرو: `?doctor=id&day=یکشنبه` (pre-select روز)
- [ ] smoke `07/03`: ادمین ۱۰–۲۲ → رزرو درمان آخرین اسلات **۲۱–۲۲**
- [ ] smoke: یکشنبه ۱۰–۱۶ ≠ سه‌شنبه ۱۰–۲۲

### ۷.۴ — متخصصین (اختیاری v9)

- [ ] همان الگو برای تب **متخصصین** اگر رزرو/نمایش نیاز دارد
- [ ] یا صریح: «فقط دندانپزشک — متخصص فعلاً روز کلی»

### ۷.۵ — Smoke

- [ ] ادمین: دکتر وحید واحد — per-day ساعت → ذخیره → reload
- [ ] `/dental/booking` — **نه** اسلات ۹–۱۷ وقتی ۱۰–۲۲ set شده (`07/03`)
- [ ] `/dental/general` — کارت‌های per-day
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — CRUD + per-day + بازه رزرو

**Done when:** ساعت ادمین = اسلات رزرو = نمایش general (per-day).  
**کد:** ✅ ۲۰۲۶-۰۸-۲۴ · **Smoke:** ⬜ بعد deploy

---

# فاز ۸ — پورسانت دوگانه ویزیتور (`07/04`) (P1)

**گزارش `07/04` #6:** «یک قسمت پورسانت دندانپزشکی و پزشکی — یک قسمت پورسانت فروشگاه»

### ۸.۰ — تشخیص (وضعیت فعلی)

| لایه | الان | مشکل |
|------|------|------|
| مدل `Visitor` | یک فیلد `commissionRate` | تفکیک بالینی / فروشگاه نیست |
| `/admin/visitors` | یک فیلد «درصد پورسانت (٪)» | دو نرخ قابل set نیست |
| `createCommission` | همیشه `visitor.commissionRate` | بدون توجه به `sourceType` |
| `/admin/commissions` | یک جدول؛ ستون منبع (`booking` / `membership` / `shop-vip`) | فقط گزارش — نرخ واحد |

**منبع پورسانت در کد:**

| `sourceType` | جریان | نرخ پیشنهادی |
|--------------|--------|--------------|
| `booking` | `lib/operations/booking-service.ts` | clinical |
| `membership` | `lib/commerce/payment-service.ts` | clinical |
| `shop-vip` | `lib/commerce/payment-service.ts` | shop |

**فایل‌های کلیدی:** `prisma/schema.prisma` (`Visitor`) · `lib/commerce/commission-service.ts` · `app/admin/(panel)/visitors/page.tsx` · `app/api/admin/commerce/visitors/route.ts` · `app/admin/(panel)/commissions/page.tsx`

### ۸.۱ — Schema + migration

- [ ] `Visitor`: `commissionRateClinical` (دندان + پزشکی) · `commissionRateShop` (فروشگاه)
- [ ] migration `014_visitor_commission_split`: migrate `commissionRate` قدیمی → `commissionRateClinical` (هر دو یا shop=0)
- [ ] (اختیاری) deprecate / حذف `commissionRate` بعد از migrate
- [ ] seed / `lib/data.ts` — به‌روز هر دو فیلد

### ۸.۲ — UI ادمین (`/admin/visitors`)

- [ ] دو فیلد: «پورسانت دندانپزشکی/پزشکی (٪)» · «پورسانت فروشگاه (٪)»
- [ ] ایجاد ویزیتور جدید — هر دو فیلد
- [ ] ویرایش inline هر دو (جایگزین فیلد واحد)
- [ ] راهنمای کوتاه: booking/membership → clinical · shop-vip → shop

### ۸.۳ — Backend: `createCommission`

- [ ] `sourceType` ∈ `booking` | `membership` → `commissionRateClinical`
- [ ] `sourceType` = `shop-vip` (و بعداً `shop-order` اگر اضافه شد) → `commissionRateShop`
- [ ] fallback: اگر نرخ ۰ — commissionAmount = ۰ (یا legacy `commissionRate` تا حذف کامل)
- [ ] snapshot `commissionRate` روی رکورد `Commission` — همان نرخ اعمال‌شده

### ۸.۴ — `/admin/commissions` (اختیاری v9)

- [ ] فیلتر یا تب: **بالینی** vs **فروشگاه**
- [ ] یا دو KPI خلاصه: جمع پورسانت بالینی / جمع فروشگاه

### ۸.۵ — Smoke

- [ ] ویزیتور: clinical 5٪ · shop 10٪
- [ ] رزرو با کد referral → پورسانت 5٪ (`sourceType=booking`)
- [ ] پرداخت VIP تجهیزات → پورسانت 10٪ (`sourceType=shop-vip`)
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — بند v9.۸

**Done when:** ادمین دو درصد جدا set کند و هر تراکنش با نرخ درست محاسبه شود.

---

# فاز ۹ — حذف CTA همکاری از تماس (`07/05`) (P2) ✅

**گزارش `07/05` #7:** «درخواست همکاری از قسمت تماس با ما حذف بشه»

**اسکرین:** `updates/07/05/photo_2026-08-23_00-40-29.jpg`

### ۹.۱ — تغییرات UI

- [x] `app/(site)/contact/page.tsx` — حذف دکمه «درخواست همکاری» · grid سه‌ستونه
- [x] `app/app/contact/page.tsx` — حذف لینک «درخواست همکاری»
- [ ] smoke deploy: `/contact` — فقط تماس فوری · واتساپ · مسیریابی
- [ ] smoke: `/partners` همچنان از منو/URL مستقیم در دسترس

**نگه داشته شده:** `/partners` · فرم · `/admin/partners` · منوی «همکاری» در header

**Done when:** صفحه تماس فقط کانال‌های تماس/آدرس/نقشه را نشان دهد.

---

# فاز ۱۰ — رزرو vs استعلام بیمه (`07/07`) (P1)

**گزارش `07/07` #9:** «نوبت رزرو کردم، ادمین تأیید کرد، ولی در پنل کاربری نوشته در انتظار کارشناس»

**اسکرین‌ها:** `updates/07/07/photo_2026-08-23_00-48-56.jpg` (پنل `/account`) · `updates/07/07/photo_2026-08-23_00-50-48.jpg` (`/admin/bookings`)

### ۱۰.۰ — تشخیص (باگ sync نیست — دو جریان جدا)

| لایه | الان | مشکل |
|------|------|------|
| `/admin/bookings` | PATCH `status: confirmed` | فقط `Booking.status` |
| `/admin/insurances` | PATCH inquiry `approved` | جریان **جدا** — در bookings اثر ندارد |
| پنل — «رزروهای اخیر» | `bookingStatusLabel` → **تأیید شده** | درست sync شده (`07/07` smoke) |
| پنل — badge «آخرین استعلام رزرو» | `InsuranceInquiry` pending → **در انتظار کارشناس** | کاربر فکر می‌کند نوبت تأیید نشده |
| `InsuranceInquiry` | بدون `bookingId` | لینک صریح booking↔inquiry نیست |
| `ConfirmPayment` | ایجاد inquiry با `status: pending` | بعد از پرداخت رزرو، استعلام جدا pending می‌ماند |

**دو مسیر ادمین:**

```text
/admin/bookings     → تأیید نوبت
/admin/insurances   → تأیید استعلام بیمه (پوشش / فرانشیز پرداخت)
```

**فایل‌های کلیدی:** `components/account/AccountDashboard.tsx` · `app/admin/(panel)/bookings/page.tsx` · `app/admin/(panel)/insurances/page.tsx` · `app/api/admin/operations/bookings/route.ts` · `components/dental/ConfirmPayment.tsx`

**راه‌حل فوری (ops):** علاوه بر bookings، استعلام همان بیمار در **`/admin/insurances`** تأیید شود.

### ۱۰.۱ — UX پنل بیمار (سریع)

- [ ] badge: برچسب **«استعلام بیمه»** (نه فقط «استعلام رزرو») · متن «در انتظار **تأیید بیمه**»
- [ ] badge جدید **«آخرین نوبت»** → تأیید شده / در انتظار / لغو شده (از آخرین booking)
- [ ] راهنمای کوتاه زیر grid وضعیت: «تأیید نوبت جدا از تأیید پوشش بیمه است»
- [ ] یکسان‌سازی copy: badge «کارشناس» vs لیست «در انتظار بررسی»

### ۱۰.۲ — UX ادمین

- [ ] `/admin/bookings`: اگر inquiry `pending` برای همان `patientPhone` → بنر «استعلام بیمه در `/admin/insurances` تأیید نشده»
- [ ] لینک مستقیم به `/admin/insurances` (فیلتر موبایل اختیاری)

### ۱۰.۳ — (اختیاری) sync / لینک داده

- [ ] `InsuranceInquiry.bookingId` + migration · پر کردن از `ConfirmPayment` هنگام submit inquiry
- [ ] یا: PATCH booking → `confirmed` → auto-approve inquiry مرتبط (همان phone / bookingId)
- [ ] مستند تصمیم: auto-approve vs فقط UX (مرکز ممکن است بخواهد تأیید دستی بماند)

### ۱۰.۴ — Smoke

- [ ] رزرو + استعلام → admin فقط bookings تأیید → پنل: **نوبت تأیید** · **استعلام pending**
- [ ] admin insurances تأیید → badge «تأیید شده»
- [ ] (اگر ۱۰.۳) یک تأیید bookings → هر دو green
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — بند v9.۱۰

**Done when:** بیمار/ادمین بدون ابهام بدانند نوبت تأیید شده؛ «در انتظار کارشناس» فقط استعلام بیمه است (یا با insurances برطرف شود).

---

# فاز ۱۱ — تخصص دندانپزشکی: ادمین + فیلتر رزرو (`07/08` + `07/09`) (P0)

**گزارش `07/08` #10:**
1. افزودن دندانپزشک در ادمین — فقط «دندانپزشکی عمومی»؛ تخصص‌های دیگر (ریشه، ارتودنسی، …) نیست
2. `/dental/specialty` — مثلاً ایمپلنت → همان **دکتر عمومی** در `/dental/general`

**گزارش `07/09` #11:** دکمه پایین صفحه تخصصی — «رزرو نوبت با پزشک» — **حذف شود** (مسیر بدون فیلتر تخصص به `/general`)

**اسکرین‌ها:** `updates/07/08/01.jpg` · `07/08/02.jpg` · `updates/07/09/photo_2026-08-23_00-55-54.jpg` (فلش روی CTA پایین)

### ۱۱.۰ — تشخیص

| لایه | الان | مشکل |
|------|------|------|
| Admin `/admin/doctors` | فیلد متنی `تخصص` · پیش‌فرض «دندانپزشکی عمومی» | بدون dropdown از `dentalSpecialties` |
| `/dental/specialty` (`SpecialtyList`) | همه کارت‌ها → `/dental/general` **بدون query** | کلیک «ایمپلنت» = لیست همه پزشکان |
| `/dental/specialty` — دکمه پایین | `Button` → `/general` بدون فیلتر | CTA گمراه‌کننده (`07/09`) — اپ این دکمه را ندارد |
| `/dental/general` (`DentistList`) | فیلتر فقط نام | بدون `?specialty=` |
| مدل `Dentist` | فقط `specialty: String` | **`specialtyId` ندارد** (برخلاف `Physician`) |
| `PASTEUR_DATA.dentalSpecialties` | ۶ تخصص (ارتودنسی، ایمپلنت، …) | در flow رزرو استفاده نمی‌شود |

**الگوی موجود (پزشکی):** `MedicalSpecialtyList` → `?specialty=id` · `MedicalDoctorList` فیلتر `specialtyId`

**فایل‌های کلیدی:** `components/dental/SpecialtyList.tsx` · `components/dental/DentistList.tsx` · `app/admin/(panel)/doctors/page.tsx` · `prisma/schema.prisma` (`Dentist`) · `lib/content/doctor-mappers.ts` · `lib/data.ts` (`dentalSpecialties`)

### ۱۱.۱ — Schema / types

- [x] `Dentist.specialtyId` (string — مثلاً `implant` یا id از `dentalSpecialties`)
- [x] migration `015_dentist_specialty_id`
- [x] `lib/data.ts` · `Dentist` type · mappers · API `/api/content/dentists`

### ۱۱.۲ — Admin `/admin/doctors` (تب دندانپزشک)

- [x] dropdown تخصص از `PASTEUR_DATA.dentalSpecialties` + گزینه «دندانپزشکی عمومی» (`general`)
- [x] جایگزین/مکمل فیلد متنی آزاد در افزودن + ویرایش inline
- [x] migrate رکوردهای موجود (مثلاً وحید واحد → `general`)

### ۱۱.۳ — `/dental/specialty` (`SpecialtyList`) · شامل `07/09`

- [x] لینک هر کارت: `/dental/general?specialty={id}` (الگو: `MedicalSpecialtyList`)
- [x] PWA `/app/dental/specialty` — همین الگو
- [x] **حذف** دکمه پایین «رزرو نوبت با پزشک» (`07/09`) — فقط وب؛ اپ ندارد
- [x] پاک‌سازی import `Button` اگر دیگر استفاده نشود
- [ ] smoke: `/dental/specialty` — فقط کارت‌های تخصص · بدون CTA سراسری

### ۱۱.۴ — `/dental/general` (`DentistList`)

- [x] `useSearchParams().get("specialty")` → فیلتر `specialtyId`
- [x] عنوان/context: «پزشکان {نام تخصص}» وقتی فیلتر فعال
- [x] empty state: «پزشک این تخصص ثبت نشده»
- [x] بدون query: همه پزشکان (یا فقط عمومی — **تصمیم محصول**)
- [ ] (با فاز ۷.۳) per-day cards فقط برای پزشکان فیلترشده

### ۱۱.۵ — Smoke

- [ ] ادمین: دکتر ایمپلنت + دکتر عمومی با `specialtyId` جدا
- [ ] `/dental/specialty` → ایمپلنت → **فقط** دکتر ایمپلنت (نه عمومی)
- [ ] `/dental/general` بدون query → رفتار تعریف‌شده
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — بند v9.۱۱

**راه‌حل موقت (ops):** `/dental/specialty` فعلاً فقط نمایشی — رزرو از `/dental/general` مستقیم.

**Done when:** تخصص در ادمین set شود؛ مسیر specialty → general فقط پزشک همان تخصص را نشان دهد؛ CTA «رزرو نوبت با پزشک» از صفحه تخصصی حذف شده باشد.  
**کد:** ✅ ۲۰۲۶-۰۸-۲۴ · **Migration:** آماده · DB remote unreachable locally · **Smoke:** ⬜ بعد deploy

---

# فاز ۱۲ — کلیپ‌های آموزشی دندان از ادمین (`07/10`) (P1)

**گزارش `07/10` #12:** «در بخش ادمین قسمتی برای اضافه کردن کلیپ‌های آموزشی برای سرویس دندانپزشکی وجود نداره»

### ۱۲.۰ — تشخیص

| لایه | الان | مشکل |
|------|------|------|
| `/dental/education` | `EducationList` ← `PASTEUR_DATA.educationCourses` | ۳ آیتم hardcode · بدون URL ویدیو |
| مدل `EducationCourse` | `title` · `duration` · `level` · `description` | پخش واقعی / لینک کلیپ نیست |
| ادمین | — | **هیچ CRUD برای آموزش دندان نیست** |
| `/admin/help` | «آموزش سامانه» (ویدیو/PDF · `PasteurStorage`) | **جدا** — راهنمای سایت، نه مراقبت بعد از درمان |

**فایل‌های کلیدی:** `components/dental/EducationList.tsx` · `lib/data.ts` (`educationCourses`) · `app/admin/(panel)/help/page.tsx` (الگوی فرم، نه همان محتوا) · `components/admin/AdminShell.tsx`

### ۱۲.۱ — Schema

- [ ] مدل `DentalEducationClip` (یا معادل): `id` · `title` · `level`/`tag` · `description` · `videoUrl` · `durationLabel` · `sortOrder` · `active`
- [ ] migration `016_dental_education_clips`
- [ ] seed از ۳ آیتم فعلی `educationCourses` (URL خالی تا ادمین پر کند)

### ۱۲.۲ — Admin

- [ ] `/admin/dental-education` — CRUD عنوان، برچسب خدمت، توضیح، **لینک کلیپ** (URL یا آپلود)
- [ ] منو در `AdminShell` + permission در `adminAccess`
- [ ] الگو: فرم شبیه `/admin/help` · persistence مثل doctors (API + Prisma)

### ۱۲.۳ — Public

- [ ] `EducationList` از `/api/content/dental-education` (نه `PASTEUR_DATA`)
- [ ] نمایش لینک/پخش وقتی `videoUrl` هست
- [ ] empty state اگر لیست خالی
- [ ] PWA `/app/dental/education` همان منبع

### ۱۲.۴ — Smoke

- [ ] ادمین: افزودن کلیپ → ظاهر در `/dental/education`
- [ ] ویرایش / غیرفعال / حذف → لیست عمومی به‌روز
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — بند v9.۱۲

**Done when:** مرکز بتواند کلیپ آموزشی دندان را از ادمین اضافه/ویرایش کند و در `/dental/education` دیده شود.

---

# فاز ۱۳ — امتیاز باشگاه برای عضویت طرح (`07/11`) (P1)

**گزارش `07/11` #13:** «در باشگاه مشتریان گزینه عضو طرح‌های عضویت شدن را هم بگذارید و ۱۰۰ امتیاز بگذارید برایش»

### ۱۳.۰ — تشخیص

| لایه | الان | مشکل |
|------|------|------|
| `clubMissions` | رزرو ۵۰ · مشاوره ۲۰ · معرف ۱۰۰ | **عضویت طرح نیست** |
| کارت‌های hero `/club` | مراجعه / معرفی / مشاوره | بدون کارت عضویت |
| `completeMembershipPayment` | کیف + پورسانت | **`addClubPoints` صدا زده نمی‌شود** |
| رزرو (الگو) | `addClubPoints(..., 50, 'رزرو نوبت')` | برای عضویت مشابه لازم است |

**فایل‌های کلیدی:** `components/club/ClubPage.tsx` · `lib/data.ts` (`clubMissions`) · `lib/commerce/payment-service.ts` · `lib/club/service.ts` (`addClubPoints`)

### ۱۳.۱ — Copy / UI باشگاه

- [x] `clubMissions`: «عضویت در طرح‌های عضویت (عادی/VIP)» · **۱۰۰ امتیاز**
- [x] کارت hero در `ClubPage` (وب): «عضویت طرح» + توضیح ۱۰۰ امتیاز
- [x] لینک CTA به `/dental/membership` (و PWA معادل)
- [x] (اختیاری) یک خط در `clubRules` دربارهٔ امتیاز عضویت

### ۱۳.۲ — Backend

- [x] در `completeMembershipPayment`: `addClubPoints(phone, 100, 'عضویت طرح …')`
- [x] idempotent: یک‌بار per پرداخت موفق (نه refresh)
- [x] (اختیاری) فقط `regular`/`vip` دندان — نه `shop-vip` مگر مرکز بخواهد

### ۱۳.۳ — Smoke

- [ ] `/club` — ماموریت عضویت با ۱۰۰ امتیاز دیده شود
- [ ] پرداخت عضویت موفق → تاریخچه باشگاه: +۱۰۰ · دلیل عضویت
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — بند v9.۱۳

**Done when:** عضویت طرح در باشگاه به‌عنوان مسیر امتیاز مشخص است و بعد از پرداخت، ۱۰۰ امتیاز ثبت می‌شود.  
**کد:** ✅ ۲۰۲۶-۰۸-۲۴ · **Smoke:** ⬜ بعد deploy

---

# فاز ۱۴ — سرویس‌ها vs محتوای داخل مسیرها (`07/12` + `07/14`) (P1)

**گزارش `07/12` #14:** «قسمت سرویس‌ها مثلاً لیزر زیبایی اضافه کردم، اما داخل اون سرویس چیزایی که باید می‌اومد نیومد»

**گزارش `07/14`:** «این سرویس‌ها را اضافه کردم اما نمی‌تونم موارد داخل سرویس را تنظیم کنم — چطور اضافه کنم؟ اصلاحات لازم اعمال بشه.»

**اسکرین:** `updates/07/14/photo_2026-08-23_09-39-59.jpg` — ۵ کارت «مسیرهای اصلی» روی `/`

### ۱۴.۰ — تشخیص (باگ داده نیست — دو لایه ادمین)

| ادمین | نقش | صفحه عمومی |
|--------|------|-------------|
| `/admin/services` | کارت‌های صفحه اصلی (عنوان + لینک) | `/` → مثلاً `/laser` |
| جداگانه per مسیر | محتوای داخل آن مسیر | جدول زیر |

| کارت صفحه اصلی | لینک عمومی | کجا محتوا را تنظیم کنید |
|----------------|------------|-------------------------|
| دندانپزشکی | `/dental` | `/admin/doctors` · consultation-prices |
| فروشگاه تجهیزات | `/shop` | `/admin/shop` |
| لیزر و زیبایی | `/laser` | **`/admin/laser-services`** |
| ویزیت پزشکی | `/medical` | `/admin/doctors` (متخصصین) · consultation-prices |
| پرستاری در منزل | `/nursing` | **`/admin/nursing-services`** |

افزودن کارت در **سرویس‌ها** فقط لینک می‌سازد (`inferServiceHref`).  
محتوای داخل از کاتالوگ/پزشکان جدا می‌آید — **از کارت سرویس ساخته نمی‌شود**.

**راه‌حل فوری (ops):** برای لیزر → `/admin/laser-services` · پرستاری → nursing-services · فروشگاه → shop · پزشکان → doctors.

**فایل‌های کلیدی:** `app/admin/(panel)/services/page.tsx` · `laser-services` · `nursing-services` · shop · doctors · `components/laser/LaserCatalog.tsx` · `lib/content/service-href.ts`

### ۱۴.۱ — شفاف‌سازی ادمین (سریع)

- [x] بنر در `/admin/services` با جدول کوتاه: هر `href` → لینک ادمین محتوا (لیزر / پرستاری / فروشگاه / پزشکان / دندان)
- [x] در هر ردیف سرویس: دکمه «مدیریت محتوای مقصد» بر اساس `href`
- [x] بعد از افزودن سرویس با `href=/laser` (یا nursing/shop/…) → لینک مستقیم به همان ادمین
- [x] empty state در `/laser` و `/nursing`: «هنوز خدمتی ثبت نشده — از ادمین … اضافه کنید»

### ۱۴.۲ — (اختیاری) محصول

- [ ] سرویس سفارشی بدون کاتالوگ اختصاصی → صفحه توضیح + تماس (نه لیست خالی)
- [ ] هشدار وقتی کارت لیزر/پرستاری ساخته می‌شود ولی کاتالوگ مقصد خالی است

### ۱۴.۳ — Smoke

- [ ] کارت لیزر در services + چند آیتم در laser-services → `/` و `/laser` هر دو پر
- [ ] فقط services بدون laser-services → empty state واضح (نه «باگ»)
- [ ] ادمین از services بدون سردرگمی به laser / nursing / shop / doctors برسد (`07/14`)
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — بند v9.۱۴

### ۱۴.۴ — راهنمای درون‌محصولی (`07/14`)

- [x] متن کمکی زیر فرم افزودن: «اینجا فقط کارت صفحه اصلی است؛ موارد داخل سرویس در منوی جداگانه (لیزر / پرستاری / فروشگاه / پزشکان)»
- [ ] (اختیاری) لینک کوتاه همین راهنما در فاز ۰ محتوا

**Done when:** ادمین بداند کارت سرویس ≠ محتوای داخل؛ و برای هر ۵ مسیر اصلی بداند محتوا را کجا اضافه کند.  
**کد (بنر + لینک مقصد):** ✅ ۲۰۲۶-۰۸-۲۴ · **Smoke:** ⬜ بعد deploy

---

# فاز ۱۵ — تعویض تصویر hero صفحه اصلی (`07/13`) (P2)

**گزارش `07/13` #15:** «بجای این عکس، `01.png` همین فولدر را آپلود کنید و در صفحه اصلی بجای موبایل استفاده کنید؛ طرح را هم هر جا لازم است عوض کنید.»

**منابع:** `updates/07/13/01.png` (کلینیک + لوگوی دندان روی دیوار) · `updates/07/13/photo_2026-08-23_09-37-42.jpg` (فلش روی قاب موبایل فعلی)

### ۱۵.۰ — تشخیص

| لایه | الان | مشکل |
|------|------|------|
| `app/(site)/page.tsx` hero راست | قاب شبیه گوشی (`aspect-[9/14]`) + `/uploads/hero-home.jpg` | عکس قدیمی · قاب برای عکس عریض کلینیک نامناسب |
| لینک قاب | → `ROUTES.app.home` (نسخه موبایل) | ممکن است بعد از تعویض تصویر حفظ یا جدا شود |

### ۱۵.۱ — دارایی + کد

- [x] کپی `updates/07/13/01.png` → `public/uploads/hero-home.png` (یا جایگزینی `hero-home.jpg`)
- [x] `app/(site)/page.tsx` — `src` به تصویر جدید
- [x] layout: **خروج از قاب موبایل** یا قاب ملایم‌تر مناسب عکس اتاق (`aspect-[4/5]` یا `3/4`، بدون notch جعلی)
- [x] `object-position` مناسب (لوگو دیوار / صندلی)
- [x] تنظیم overlay متن پایین تا با لوگوی دیوار تداخل نکند
- [x] تصمیم: لینک «ورود به اپ» روی تصویر بماند یا CTA جدا

### ۱۵.۲ — Smoke

- [ ] `/` دسکتاپ + موبایل — تصویر جدید واضح
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — بند v9.۱۵ (اختیاری)

**Done when:** صفحه اصلی به‌جای mockup قدیمی، عکس کلینیک `01.png` را با layout مناسب نشان دهد.  
**کد:** ✅ ۲۰۲۶-۰۸-۲۴ · **Smoke:** ⬜ بعد deploy

---

# فاز ۱۶ — محتوای تو در تو روی سرویس صفحه اصلی (`07/15`) (P1 محصول)

**گزارش `07/15` #16:** «این قسمت (منوی محتوا: لیزر / پرستاری / پزشکان) به سرویس‌هایی که اضافه می‌شن مرتبط نیست — که بشه روش دسته و خدمات اضافه کرد»

**اسکرین:** `updates/07/15/photo_2026-08-23_09-46-29.jpg` — دایره روی «محتوا و خدمات» در حالی که صفحه «مدیریت سرویس‌ها» باز است

### ۱۶.۰ — تشخیص

| لایه | الان | مشکل |
|------|------|------|
| `/admin/services` | فقط کارت صفحه اصلی (عنوان + لینک) | روی همان سرویس نمی‌شود دسته/خدمت ساخت |
| منوی لیزر / پرستاری / پزشکان | کاتالوگ‌های **سراسری و جدا** | از نظر ادمین «مرتبط با سرویس اضافه‌شده» نیست |
| فاز ۱۴ | بنر و لینک مقصد | فقط شفاف‌سازی ops — مدل تو در تو نیست |

**رابطه با فاز ۱۴:** ۱۴ = راهنمای وضعیت فعلی · **۱۶ = تغییر معماری** که `07/15` می‌خواهد.

**دو مسیر (تصمیم محصول در ۱۶.۰):**

| مسیر | کار | پیچیدگی |
|------|-----|---------|
| A | فقط UX قوی‌تر (ادامه ۱۴) | کم |
| **B (درخواست واقعی)** | هر سرویس → دسته‌ها → خدمات داخلی | زیاد |

### ۱۶.۰.۱ — تصمیم محصول

- [x] **تصمیم ۲۰۲۶-۰۸-۲۴:** مسیر **A** — فقط UX قوی‌تر (ادامه فاز ۱۴)؛ معماری تو در تو ساخته نمی‌شود
- [x] پزشکان / فروشگاه / دندان / لیزر / پرستاری همچنان کاتالوگ جدا + لینک از `/admin/services`

### ۱۶.۱ — Schema (مسیر B) — ❌ لغو شده

- [ ] ~~`ServiceCategory` / `ServiceOffering`~~ — انجام نمی‌شود (مسیر A)

### ۱۶.۲–۱۶.۴ — مسیر B — ❌ لغو شده

**Done when (مسیر A):** ادمین از بنر و لینک‌های فاز ۱۴ بداند محتوا را کجا اضافه کند — بدون مدل تو در تو.  
**وضعیت:** ✅ بسته با فاز ۱۴

> اگر بعداً مرکز مسیر B بخواهد، این بخش دوباره باز می‌شود.

---

# فاز ۱۷ — QR / بارکد دسترسی به خدمات (`07/16`) (P1 بعد از تصمیم)

**گزارش `07/16` #17:** «بارکد برای اسکن و دسترسی به خدمات کی حل می‌شه؟ چیکار باید کرد؟»

### ۱۷.۰ — تشخیص

| لایه | الان | مشکل |
|------|------|------|
| کد / API / UI | — | **هیچ قابلیت بارکد/QR خدمات وجود ندارد** |
| todo قبلی | — | در v8/v9 ثبت نشده بود |
| نزدیک‌ترین موجود | کد معرف متنی ویزیتور (`PLUS100`) | اسکن نیست |

**جواب «کی؟»:** هنوز شروع نشده — بعد از تصمیم سناریو در بک‌لاگ v9.

**راه‌حل موقت (ops):** QR استاتیک چاپ‌شده برای `https://pasteur.plus` یا `/app` تا پیاده‌سازی.

### ۱۷.۰.۱ — تصمیم محصول (مسدودکننده)

| سناریو | معنی | پیچیدگی |
|--------|------|---------|
| A | QR ورودی مرکز → `/` یا `/app` | کم |
| **B ✅ انتخاب‌شده** | QR per سرویس → `/dental` · `/laser` · … | کم–متوسط |
| C | بارکد بیمار در پذیرش → پروفایل/کیف/نوبت | زیاد |
| D | QR کد معرف ویزیتور | متوسط |

- [x] تأیید سناریو با مرکز — **B** (۲۰۲۶-۰۸-۲۴)
- [x] محل اسکن: گوشی بیمار (QR چاپ‌شده روی پوستر/میز)

### ۱۷.۱ — مسیر B (+ presets کمکی)

- [x] ادمین `/admin/services`: تولید QR برای URLهای اصلی (`/` · `/app` · `/dental` · `/laser` · …)
- [x] دانلود PNG برای چاپ
- [x] QR روی هر سرویس ثبت‌شده بر اساس `href`
- [ ] smoke: اسکن موبایل → مسیر درست روی pasteur.plus

### ۱۷.۲ — اگر C (بزرگ) — خارج از اسکوپ v9 این تصمیم

- [ ] ~~`patientAccessCode`~~ — انجام نمی‌شود مگر درخواست جدا

### ۱۷.۳ — اگر D — خارج از اسکوپ

- [ ] ~~QR ویزیتور~~ — انجام نمی‌شود مگر درخواست جدا

### ۱۷.۴ — Smoke

- [ ] اسکن با موبایل → صفحه/جریان درست
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — بند v9.۱۷

**Done when:** سناریو تأییدشده پیاده شده و اسکن واقعی به مسیر خدمت می‌رسد.  
**کد (B):** ✅ ۲۰۲۶-۰۸-۲۴ در `/admin/services` · **Smoke:** ⬜ بعد deploy

---

## جدول گزارش‌های `updates/07`

| منبع | گزارش | فاز v9 |
|------|--------|--------|
| `07/01` #1 | عضویت ≠ وام؛ وام در پنل کاربری | ۲.۱ |
| `07/01` #2 | approve وام → چیزی برای بیمار نیست | ۲.۲–۲.۴ |
| `07/01` #3 | اقساط «وارد شوید» با session | ۱ |
| `07/01` #4 | کیف: موجودی ۰، سقف ۱۵M، تراکنش | ۳ |
| **`07/02` #5** | **ساعت حضور جدا برای هر روز پزشک** | **۷.۱–۷.۲** |
| **`07/03`** | **ادمین ۱۰–۲۲ → رزرو ۹–۱۷ (defaultSchedule)** · general per-day | **۷.۳–۷.۵** |
| **`07/04` #6** | **پورسانت جدا: دندان/پزشکی vs فروشگاه** | **۸.۱–۸.۵** |
| **`07/05` #7** | **حذف «درخواست همکاری» از `/contact`** | **۹.۱ ✅** |
| **`07/06` #8** | **کد ملی اجباری در درخواست وام** | **۲.۱.۱** |
| **`07/07` #9** | **تأیید رزرو ادمین vs «در انتظار کارشناس» — استعلام بیمه جدا** | **۱۰.۱–۱۰.۴** |
| **`07/08` #10** | **تخصص دندان در ادمین · specialty→general بدون فیلتر (ایمپلنت→عمومی)** | **۱۱.۱–۱۱.۵** |
| **`07/09` #11** | **حذف CTA «رزرو نوبت با پزشک» از `/dental/specialty`** | **۱۱.۳** |
| **`07/10` #12** | **ادمین: افزودن کلیپ آموزشی دندان** | **۱۲.۱–۱۲.۴** |
| **`07/11` #13** | **باشگاه: ماموریت عضویت طرح + ۱۰۰ امتیاز** | **۱۳.۱–۱۳.۳** |
| **`07/12` #14** | **سرویس اضافه شد ولی داخلش خالی — services ≠ catalog** | **۱۴.۱–۱۴.۳** |
| **`07/13` #15** | **تعویض عکس hero صفحه اصلی (بجای قاب موبایل → `01.png`)** | **۱۵.۱–۱۵.۲** |
| **`07/14`** | **نمی‌تونم موارد داخل سرویس را تنظیم کنم — راهنما برای ۵ مسیر** | **۱۴.۱ + ۱۴.۴** |
| **`07/15` #16** | **منوی لیزر/پرستاری ≠ سرویس اضافه‌شده · نیاز دسته/خدمت روی سرویس** | **۱۶.۰–۱۶.۴** |
| **`07/16` #17** | **بارکد/QR برای اسکن و دسترسی به خدمات** | **۱۷.۰–۱۷.۴** |

---

## ترتیب پیشنهادی

```text
فاز ۱ (باگ اقساط — سریع)
  → فاز ۱۱ (تخصص دندان — specialtyId + فیلتر — `07/08` · قبل/per-day)
  → فاز ۷ (پزشکان per-day + fix 9–17 vs 10–22 — قبل پر کردن doctors)
  → فاز ۲.۱.۱ (کد ملی وام — `07/06`)
  → فاز ۲ (جداسازی وام + InstallmentPlan)
  → فاز ۳ (copy کیف)
  → فاز ۴ (facilities vs membership)
  → فاز ۱۰ (رزرو vs استعلام بیمه — UX `07/07` · سریع copy/badge)
  → فاز ۸ (پورسانت دوگانه ویزیتور — `07/04`)
  → فاز ۱۲ (کلیپ آموزشی دندان از ادمین — `07/10`)
  → فاز ۱۳ (امتیاز باشگاه عضویت طرح — `07/11` · سریع)
  → فاز ۱۴ (UX سرویس vs محتوای داخل — `07/12` + `07/14` · بنر · قبل فاز ۰)
  → فاز ۱۶ (محتوای تو در تو روی سرویس — `07/15` · بعد تصمیم محصول · بعد/به‌جای کاتالوگ جدا)
  → فاز ۱۵ (hero صفحه اصلی — `07/13` · سریع design)
  → فاز ۱۷ (QR/بارکد دسترسی — `07/16` · بعد تصمیم A/B/C/D)
  → فاز ۰ (محتوا — موازی؛ services بعد از ۱۴؛ nested بعد از ۱۶ اگر B)
  → فاز ۵ (go-live)
  → فاز ۶ (docs)
```

---

## جدول وضعیت

| فاز | Deploy | Smoke | نتیجه |
|-----|--------|-------|--------|
| ۰ محتوا | ⬜ | ⬜ | وابسته فاز ۷ + ۱۱ برای doctors |
| ۱ باگ اقساط/کیف | ⬜ | ⬜ | کد ✅ · smoke بعد deploy |
| ۲ وام + عضویت جدا | ⬜ | ⬜ | شامل ۲.۱.۱ کد ملی (`07/06`) |
| ۳ شفاف‌سازی کیف | ⬜ | ⬜ | |
| ۴ facilities vs membership | ⬜ | ⬜ | |
| ۵ go-live | ⬜ | ⬜ | |
| ۶ docs | ⬜ | ⬜ | |
| ۷ پزشکان per-day (`07/02` + `07/03`) | ⬜ | ⬜ | smoke: 10–22 ≠ 9–17 |
| ۸ پورسانت ویزیتور (`07/04`) | ⬜ | ⬜ | clinical vs shop |
| ۹ حذف CTA همکاری از contact (`07/05`) | ⬜ | ⬜ | کد ✅ · smoke بعد deploy |
| ۱۰ رزرو vs استعلام بیمه (`07/07`) | ⬜ | ⬜ | UX · نه باگ sync |
| ۱۱ تخصص دندان (`07/08` + `07/09`) | ⬜ | ⬜ | specialtyId + فیلتر · حذف CTA پایین |
| ۱۲ کلیپ آموزشی دندان (`07/10`) | ⬜ | ⬜ | admin CRUD → `/dental/education` |
| ۱۳ امتیاز باشگاه عضویت (`07/11`) | ⬜ | ⬜ | UI + ۱۰۰ pts on payment |
| ۱۴ سرویس vs محتوای داخل (`07/12` + `07/14`) | ⬜ | ⬜ | بنر · لینک مقصد · ۵ مسیر |
| ۱۵ hero صفحه اصلی (`07/13`) | ⬜ | ⬜ | `01.png` · بدون قاب موبایل |
| ۱۶ محتوای تو در تو سرویس (`07/15`) | ⬜ | ⬜ | تصمیم محصول · nested catalog |
| ۱۷ QR/بارکد دسترسی (`07/16`) | ⬜ | ⬜ | تصمیم A/B/C/D · فعلاً وجود ندارد |
