# TODO v8 — داده واقعی + UX عملیاتی + رزرو/مشاوره/زحل/اقساط/پشتیبانی

سایت: `https://pasteur.plus`  
آخرین به‌روزرسانی: ۲۰۲۶-۰۸-۲۲ (فاز ۴.۳ — `06/03` · فاز ۸ — `06/04`)

> **هدف:** بعد از wipe production: پر کردن داده واقعی، بستن شکاف‌های UX/عملیاتی، و آماده‌سازی go-live.  
> **مرجع گزارش‌ها:**  
> `updates/06/01/New Text Document.txt` · `updates/06/02/` · `updates/06/03/` · `updates/06/04/`  
> **مرجع پروژه:** `todo-v6.md` · `todo-v7.md` · `MANUAL-SMOKE-CHECKLIST.md`

---

## خلاصه وضعیت (v8)

| موضوع | وضعیت |
|--------|--------|
| Deploy + migrate `010` + `011` + `012` + `013` | ✅ Runflare |
| `db:wipe-production --confirm` | ✅ — فقط `admin` |
| CRUD دندانپزشک/متخصص | ✅ کد |
| Sidebar آکاردئون ادمین (دسکتاپ) | ✅ کد |
| داده واقعی از ادمین | 🟨 در حال پر کردن |
| لغو/ویرایش رزرو (ادمین + بیمار) | ✅ فاز ۱ — لغو + مودال ویرایش ادمین |
| قیمت مشاوره خالی بعد از wipe | ✅ فاز ۲.۱ |
| پورسانت ویزیتور — پیش‌فرض ۵٪ + بدون ویرایش | ✅ فاز ۲.۲ |
| آیکون/کارت سرویس صفحه اصلی | ✅ فاز ۳ — empty state + fallback تصویر |
| زحل شاهکار در `/account` | ✅ |
| تسهیلات + زحل کامل | ✅ `/shop/facility` + `/admin/facilities` |
| اعتبارسنجی **درخواست وام/اقساط** برای ادمین | ✅ فاز ۴.۳ — migration `012` |
| `/admin/installments` (فقط گزارش طرح فعال) | 🟨 read-only — gap workflow |
| `/admin/memberships` (فرم وام بدون تأیید/زحل) | ✅ فاز ۴.۳ |
| **شکایت** یک‌طرفه (`Complaint` — submit فقط) | 🟨 ~۳۰٪ — `POST` بدون thread |
| `/admin/complaints` (inbox بدون پاسخ) | 🟨 status فقط — gap workflow |
| `/help` (آموزش ویدیو/PDF) | ✅ — **≠** پشتیبانی تیکتی |
| سیستم **پشتیبانی / تیکت** دوطرفه | ✅ فاز ۸ — migration `013` |
| Sidebar موبایل ادمین (drawer) | ✅ فاز ۵ |
| Go-live ops (DEV_OTP، CRON، SMS) | ⬜ فاز ۶ — دستی |

---

## migrations

| Migration | موضوع | v8 |
|-----------|--------|-----|
| `010_patient_zohal` | زحل پروفایل | ✅ deploy |
| `011_dentists` | جدول Dentist | ✅ deploy |
| جدید (فاز ۱) | لغو رزرو بیمار + ویرایش ادمین | ✅ بدون migration |
| **`012_membership_zohal`** (پیشنهادی) | `MembershipApplication`: zohal + workflow تأیید/رد وام | ✅ فاز ۴.۳ |
| **`013_support_tickets`** (پیشنهادی) | `SupportTicket` + `SupportMessage` — thread دوطرفه | ✅ فاز ۸ |

---

# فاز ۰ — بعد از wipe: محتوای واقعی + smoke (P0)

**هدف:** سایت و ادمین قابل استفاده باشد — **بدون `db:seed:phase2`**.

**گزارش:** `06/01` — رزرو خالی طبیعی تا داده واقعی؛ مشاوره لیزل (`0936522555`) نمونه live.

**وضعیت smoke (۲۰۲۶-۰۸-۲۲):** APIها خالی/حداقل (`services=[]`, `consultationTypes` تا seed ادمین)؛ فازهای ۱–۵ و ۸ smoke API ✅.

### ۰.۱ — پر کردن محتوا (گام‌به‌گام از ادمین)

ورود: `https://pasteur.plus/admin/login` → `admin`

| # | مسیر | گام‌ها | وضعیت |
|---|------|--------|--------|
| 1 | `/admin/services` | **افزودن کارت** → emoji + عنوان + توضیح + href + رنگ + تصویر (`/uploads/…`) → **ذخیره** → تکرار برای هر سرویس صفحه اصلی | ⬜ |
| 2 | `/admin/doctors` | تب **دندانپزشکان** → افزودن/ویرایش (نام، روزها، ساعت، تصویر) → **ذخیره** → تب **متخصصین** همین کار | ⬜ |
| 3 | `/admin/insurances` | بیمه **پایه** + **مکمل** + درصد فرانشیز → ذخیره | ⬜ |
| 4 | `/admin/consultation-prices` | **ایجاد انواع پیش‌فرض** (یا wizard دستی) → قیمت هر نوع + تعرفه تخصص → **ذخیره همه** | 🟨 seed smoke OK |
| 5 | `/admin/bookings` | تنظیم **مبلغ بیعانه** (مثلاً ۲۰۰٬۰۰۰) → ذخیره | ⬜ |
| 6 | `/admin/visitors` | فرم بالای جدول → نام + کد معرف + **درصد پورسانت** → ثبت | 🟨 ۱ ویزیتور در DB |
| 7 | `/admin/gallery` | (اختیاری) آیتم قبل/بعد | ⬜ |
| 8 | `/admin/shop` | (اختیاری) دسته + محصول | ⬜ |
| 9 | `public/uploads` | (اختیاری) حذف تصاویر seed قدیمی | ⬜ |

**چک بعد از هر گام:** صفحه عمومی مربوطه (مثلاً `/` برای services، `/dental/general` برای پزشکان).

### ۰.۲ — smoke

- [ ] `/` — کارت سرویس + emoji/تصویر (یا empty state تا گام ۱)
- [ ] `/dental/general` + `/dental/booking`
- [x] `/admin/consultation-prices` — empty state + «ایجاد انواع پیش‌فرض»
- [ ] `/admin/consultations` — درخواست live
- [x] `/admin/visitors` — ثبت/ویرایش پورسانت
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — CRUD پزشکان

**Done when:** مسیر اصلی بیمار + پنل ادمین با داده واقعی مرکز کار کند.

---

# فاز ۱ — رزرو: لغو و ویرایش (P0)

**گزارش:** `06/01` بند ۱.

**وضعیت فعلی:**
- ادمین: **لغو** + **ویرایش** (`/admin/bookings`)
- بیمار: **لغو** در `/account`
- API بیمار: `PATCH /api/operations/bookings/[id]`

### ۱.۱ — API

- [x] `PATCH /api/operations/bookings/[id]` — بیمار: لغو با چک `patientPhone` / `userId`
- [x] پیام بیعانه غیرقابل استرداد (`depositNonRefundable`)
- [x] `PATCH /api/admin/operations/bookings` — ویرایش روز/ساعت/پزشک/وضعیت
- [x] slot occupied بعد از لغو/ویرایش (`status !== cancelled` در slot-check)

### ۱.۲ — UI ادمین

- [x] پیام تأیید لغو واضح‌تر
- [x] ستون **موبایل** مراجع
- [x] مودال/فرم **ویرایش** رزرو

### ۱.۳ — UI بیمار

- [x] دکمه **لغو نوبت** در «رزروهای اخیر» (`/account`)
- [x] پیام «بیعانه قابل استرداد نیست»
- [ ] (بعداً) درخواست تغییر زمان

### ۱.۴ — تست

- [x] لغو از account → admin
- [x] لغو از admin → slot آزاد
- [x] smoke بند ۲ (`MANUAL-SMOKE-CHECKLIST` v8.۴)

**Done when:** بیمار و ادمین رزرو فعال را لغو کنند؛ ادمین در صورت نیاز ویرایش کند.

---

# فاز ۲ — قیمت مشاوره + ویزیتور (P1)

**گزارش:** `06/01` بند ۲ و ۳ · **`06/02`** (پورسانت خودکار ۵٪)

### ۲.۱ — قیمت مشاوره (`/admin/consultation-prices`)

**علت خالی:** `ConsultationType` بعد از wipe خالی است.

- [x] empty state: «انواع مشاوره تعریف نشده — پس از wipe…»
- [x] دکمه **«ایجاد انواع پیش‌فرض»** (بدون `db:seed:phase2` کامل)
- [x] wizard افزودن نوع (id, label, emoji, priceNum)
- [x] وقتی `types.length === 0` — جدول تعرفه پیام راهنما ندهد (ستون خالی گیج‌کننده)
- [x] smoke: `/consultation` مبلغ درست (API smoke ۲۰۲۶-۰۸-۲۲)

### ۲.۲ — ویزیتور (`/admin/visitors`)

**گزارش `06/02`:** «۵٪ پورسانت خودکار می‌اندازد» — در کد `useState("5")` و بعد از ثبت `setRate("5")`؛ جدول **read-only**.

**اسکرین:** ویزیتور `CD` / `09064684849` / `5%` / غیرفعال — فرم پایین با فیلد «۵».

- [x] **حذف hardcode پیش‌فرض ۵٪** — فیلد خالی یا placeholder «مثلاً ۵»
- [x] **FormLabel** واضح: «درصد پورسانت (٪)»
- [x] **ویرایش inline** `commissionRate` (+ نام/تماس در صورت نیاز) در جدول
- [x] دکمه **ذخیره** per-row یا «ذخیره همه»
- [x] فرم افزودن **بالای** جدول (موبایل بدون اسکرول طولانی)
- [x] پیام موفق: «ویزیتور X با پورسانت Y٪ ثبت شد»
- [x] validation: نام + کد معرف اجباری؛ درصد ۰–۱۰۰
- [x] smoke: کد در رزرو → `/admin/commissions`

**Done when:** ادمین درصد را آزادانه set/edit کند؛ ۵٪ فقط پیشنهاد نباشد مگر کاربر بخواهد.

---

# فاز ۳ — صفحه اصلی و empty state (P1)

**گزارش:** `06/01` بند ۴.

- [x] `/` وقتی services خالی: کارت «از /admin/services اضافه کنید»
- [ ] ادمین services: emoji + image اجباری یا placeholder
- [x] fallback تصویر شکسته (`/uploads/` 404)

**Done when:** سکشن سرویس خالی بی‌صدا نباشد.

---

# فاز ۴ — زحل، اعتبارسنجی، درخواست وام/اقساط (P1)

**گزارش:** `06/01` بند ۵ · **`06/03`** — «اعتبارسنجی بانکی در درخواست اقساط برای ادمین → بعد تأیید/رد وام»

### ۴.۰ — تشخیص: سه مسیر جدا در کد (مهم)

| مسیر ادمین | مدل DB | زحل اعتبار | تأیید/رد | یادداشت |
|------------|--------|------------|----------|---------|
| **`/admin/facilities`** | `FacilityRequest` | ✅ submit + خلاصه در جدول | ✅ dropdown | **الان کار می‌کند** — تسهیلات تجهیزات |
| **`/admin/installments`** | `InstallmentPlan` | ❌ | ❌ | فقط **لیست read-only** طرح‌های فعال (`GET` only) |
| **`/admin/memberships`** | `MembershipApplication` | ✅ credit-check + خلاصه | ✅ dropdown تأیید/رد | فاز ۴.۳ — migration `012` |

**کار فوری (بدون کد):** اگر منظور **تسهیلات تجهیزات** است → از **`/admin/facilities`** استفاده کنید، نه `/admin/installments`.

**تصمیم پیاده‌سازی v8 (پیشنهاد):** گسترش **`MembershipApplication`** + UI در **`/admin/memberships`** — الگو از `/admin/facilities`.  
`/admin/installments` بعداً لینک به «درخواست‌های pending» یا فقط گزارش طرح‌های **فعال** بماند.

---

### ۴.۱ — نقشه زحل روی سایت

| مسیر بیمار | سرویس زحل | نمایش |
|------------|-----------|--------|
| `/account` + save | شاهkar (کد ملی + موبایل) | badge «کد ملی (شاهکار)» |
| `/shop/facility` | شاهkar + هویت + **اعتبار** + چک برگشتی | submit / خطا |
| `/dental/membership` | فرم عضویت + **`loanAmount`** | ثبت → `/admin/memberships` (بدون زحل) |
| `/installments` | — | فقط طرح‌های **فعال** بیمار |

| مسیر ادمین | کار |
|------------|-----|
| `/admin/facilities` | ✅ استعلام + تأیید/رد + ساخت `InstallmentPlan` |
| `/admin/patients` | ✅ شاهkar + تأیید کاربری |
| `/admin/memberships` | ✅ استعلام + تأیید/رد **وام** |
| `/admin/installments` | 🟨 گزارش اقساط جاری — نه inbox درخواست |

---

### ۴.۲ — UX بیمار (راهنما + زحل)

- [x] `/account`: بلوک «اعتبارسنجی بانکی» + لینک `/shop/facility` (تسهیلات) و `/dental/membership` (وام درمانی)
- [x] `/shop/facility`: توضیح «استعلام اعتبار از زحل»
- [x] `/dental/membership`: بعد از submit — «درخواست ثبت شد؛ پس از بررسی اعتبار با شما تماس می‌گیریم»
- [x] `/installments`: توضیح تفاوت «طرح فعال» vs «درخواست در انتظار»
- [ ] `ZOHAL_TOKEN` روی Runflare + restart

---

### ۴.۳ — درخواست وام عضویت: زحل + تأیید/رد (`06/03`) — **اولویت کد**

**گزارش:** «اعتبارسنجی بانکی در قسمت درخواست اقساط برای ادمین → بعد تأیید/رد درخواست وام»

**Gap:** `MembershipApplication` فیلد `status` دارد ولی **بدون** `zohalStatus` / workflow در UI.

#### ۴.۳.۱ — Schema (migration `012_membership_zohal`)

- [x] `MembershipApplication`: `zohalStatus`, `zohalPayload` (Json), `shahkarMatched`, `zohalCheckedAt`
- [x] `reviewedAt`, `reviewNote` (اختیاری)
- [x] `status`: `pending` | `approved` | `rejected` (هماهنگ با facilities)

#### ۴.۳.۲ — API ادمین

- [x] `GET /api/admin/commerce/members` — لیست applications + map زحل
- [x] `POST /api/admin/commerce/membership-applications/[id]/credit-check` — زحل chain
- [x] `PATCH /api/admin/commerce/membership-applications/[id]` — `status: approved|rejected` + یادداشت
- [x] helper `mapMembershipApplication` — `zohalSummary` مثل `mapFacilityRequest`
- [ ] بعد از **approved**: (طبق تصمیم کسب‌وکار) ایجاد `InstallmentPlan` یا flag «وام تأیید» — **نه** auto بدون قانون

#### ۴.۳.۳ — UI `/admin/memberships`

- [x] جدول «فرم‌های پیشنهاد» → ستون‌های **کد ملی**، **مبلغ وام** (`loanAmount`)، **زحل**، **خلاصه استعلام**
- [x] دکمه **«استعلام اعتبار»** per-row
- [x] dropdown یا دکمه **تأیید / رد / در بررسی** (الگو: `/admin/facilities`)
- [x] پیام موفق/خطا؛ disable تأیید اگر شاهkar failed (با override دستی اختیاری)
- [x] لینک راهنما: «تسهیلات تجهیزات → `/admin/facilities`»

#### ۴.۳.۴ — (اختیاری) `/admin/installments` inbox

- [ ] تب «درخواست‌های در انتظار» vs «طرح‌های فعال»
- [ ] یا redirect به memberships برای workflow وام

#### ۴.۳.۵ — تست smoke

- [x] فرم عضویت با `loanAmount` → ادمین استعلام زحل → تأیید
- [ ] رد با شاهkar ناموفق (نیاز داده واقعی زحل)
- [x] `ZOHAL_TOKEN` خاموش → `zohalStatus=error|skipped` + manual flow (smoke API ۲۰۲۶-۰۸-۲۲)

**Done when:** ادمین برای **درخواست وام عضویت** همان کنترل اعتبار + تأیید/رد مثل تسهیلات داشته باشد؛ `/admin/installments` گیج‌کننده نباشد (راهنما یا inbox).

---

# فاز ۵ — UX ادمین موبایل (P2)

**گزارش:** `06/01` اسکرین‌ها — chip افقی فقط بخش فعلی (عملیات یا رشد).

- [x] drawer / آکاردئون موبایل (مثل دسکتاپ)
- [x] دکمه «منو» به‌جای scroll بی‌نهایت chip
- [x] touch target و فونت مناسب

**Done when:** superadmin از موبایل به همه `/admin/*` برسد.

---

# فاز ۶ — Go-live ops (P0 ops)

- [ ] `SESSION_SECRET` + `CRON_SECRET`
- [ ] CRON `/api/cron/sms-reminders`
- [ ] SMS body IDs (رزرو، مشاوره، یادآور)
- [ ] زیibal IP whitelist + پرداخت واقعی
- [ ] حذف `DEV_OTP_*`
- [ ] `MANUAL-SMOKE-CHECKLIST.md` full pass
- [ ] `KALI-SECURITY-CHECKLIST.md`

**Done when:** بدون OTP تست، رزرو + پرداخت + مشاوره واقعی pass شود.

---

# فاز ۷ — polish و مستندات (P2)

- [x] `README.md`: بعد از wipe — `db:wipe-production` نه `db:seed:phase2`
- [x] `MANUAL-SMOKE-CHECKLIST.md`: لغو رزرو بیمار، قیمت مشاوره، ویزیتور، **تیکت پشتیبانی**
- [ ] `todo-v6` R4 وقتی محتوا از ادمین پر شد
- [x] deploy آخرین commit (012، 013، sidebar، wipe، dentist)

---

# فاز ۸ — پشتیبانی / تیکت (`06/04`) (P2 — feature جدید)

**گزارش:** «قسمت پشتیبانی برای تیکت گذاشتن — هم فرانت هم بک‌اند آماده شود.»

### ۸.۰ — تشخیص: سه مسیر جدا در کد (مهم)

| مسیر | مدل / ذخیره | بیمار | ادمین | thread / پاسخ | یادداشت |
|------|-------------|-------|-------|---------------|---------|
| **`/complaints`** | `Complaint` (Prisma) | ✅ `POST` فقط | 🟨 inbox | ❌ | یک پیام ثابت؛ بدون `GET` لیست بیمار |
| **`/help`** | `HelpItem` (localStorage) | ✅ محتوای آموزشی | ✅ CRUD | — | ویدیو/PDF — **≠** تیکت |
| **پشتیبانی تیکتی** | `SupportTicket` + `SupportMessage` | ✅ `/support` | ✅ `/admin/support` | ✅ POST روی `[id]` | migration `013` — smoke ✅ |

**وضعیت `Complaint` فعلی:**
- API بیمار: فقط `POST /api/operations/complaints` — `ComplaintsPage.tsx`
- API ادمین: `GET` + `PATCH status` — بدون فیلد پاسخ / پیام follow-up
- UI ادمین: دکمه «بررسی» / «بستن» — بدون textarea پاسخ
- `/account`: لینک «ثبت شکایت» — نه «تیکت‌های من»

**Gap نسبت به `06/04`:**

| قابلیت | الان | درخواست |
|--------|------|---------|
| فرم ثبت | ✅ شکایت | ✅ تیکت |
| لیست تیکت‌های بیمار | ✅ | ✅ |
| وضعیت (باز/بسته/…) | ✅ هر دو طرف | ✅ |
| پاسخ ادمین | ✅ | ✅ |
| تاریخچه مکالمه | ✅ | ✅ |
| مسیر «پشتیبانی» | ✅ `/support` | ✅ |

**تصمیم پیاده‌سازی v8 (پیشنهاد):** مدل جدید **`SupportTicket` + `SupportMessage`** (migration `013`) — تفکیک از «شکایت formal».  
`/complaints` فعلاً بماند؛ لینک‌های جدید به `/support`. (اختیاری بعداً: migrate `Complaint` → ticket)

---

### ۸.۱ — Schema (migration `013_support_tickets`)

- [x] enum `SupportTicketStatus`: `open` | `reviewing` | `closed`
- [x] enum `SupportMessageSender`: `patient` | `admin`
- [x] `SupportTicket`: id, userId?, patientPhone, patientName, subject, status, priority?, createdAt, updatedAt, closedAt?
- [x] `SupportMessage`: id, ticketId, sender, body, createdAt
- [x] index: `[patientPhone]`, `[userId]`, `[status]`, `[ticketId]`
- [x] wipe/reset scripts: include `SupportMessage` + `SupportTicket`

---

### ۸.۲ — API بیمار

- [x] `POST /api/operations/support/tickets` — subject + body (+ name/phone یا از session)
- [x] `GET /api/operations/support/tickets` — لیست خود (filter `patientPhone` / `userId`)
- [x] `GET /api/operations/support/tickets/[id]` — جزئیات + messages (ownership check)
- [x] `POST /api/operations/support/tickets/[id]` — follow-up (POST روی همان route؛ نه `/messages`)
- [x] mapper: `mapSupportTicket`, `mapSupportMessage`

---

### ۸.۳ — API ادمین

- [x] `GET /api/admin/operations/support/tickets` — inbox + filter status
- [x] `GET /api/admin/operations/support/tickets/[id]` — thread کامل
- [x] `POST /api/admin/operations/support/tickets/[id]` — پاسخ admin
- [x] `PATCH /api/admin/operations/support/tickets/[id]` — status + priority + closedAt
- [x] permission: reuse **`complaints`**
- [ ] dashboard: badge «تیکت باز» (مثل `newComplaints`)

---

### ۸.۴ — UI بیمار

- [x] `/support` — لیست تیکت‌ها + فرم «تیکت جدید» + صفحه thread
- [x] `/app/support` — parity اپ
- [x] `/account`: لینک **«پشتیبانی / تیکت‌های من»**
- [x] وضعیت فارسی: باز / در حال بررسی / بسته
- [x] empty state: «هنوز تیکتی ثبت نکرده‌اید»
- [x] **نه** `/help` — help فقط آموزش بماند

---

### ۸.۵ — UI ادمین

- [x] `/admin/support` — inbox + پنل مکالمه (الگو: chat ساده)
- [ ] یا گسترش `/admin/complaints` با تب «شکایت قدیمی» / «تیکت»
- [x] sidebar: آیتم «پشتیبانی» با permission
- [x] فیلتر: باز / در بررسی / بسته
- [x] textarea پاسخ + دکمه «ارسال پاسخ» + «بستن تیکت»
- [ ] (اختیاری) SMS notify هنگام پاسخ admin

---

### ۸.۶ — تست smoke

- [x] بیمار: تیکت جدید → در لیست «باز»
- [x] ادمین: پاسخ → بیمار thread را می‌بیند
- [x] بیمار: follow-up → ادمین inbox
- [ ] بستن تیکت → follow-up مسدود (تست دستی)
- [x] `MANUAL-SMOKE-CHECKLIST.md` — بند v8.۷

**Done when:** بیمار و ادمین **مکالمه دوطرفه** داشته باشند؛ `/help` و `/complaints` با «پشتیبانی تیکتی» قاطی نشوند.

**اولویت:** P2 — blocker go-live نیست؛ اگر مرکز inbox پشتیبانی می‌خواهد قبل از launch، اولویت بالاتر.

---

## جدول گزارش‌های `updates/06`

| منبع | گزارش | فاز |
|------|--------|-----|
| `06/01` #1 | ویرایش/لغو رزرو | ۱ |
| `06/01` #2 | قیمت مشاوره | ۰ + ۲ |
| `06/01` #3 | پورسانت ویزیتور (فرم پیدا نمی‌شد) | ۲ |
| `06/01` #4 | آیکون سرویس صفحه اصلی | ۰ + ۳ |
| `06/01` #5 | زحل / اعتبار روی سایت | ۴ |
| **`06/02`** | **۵٪ پورسانت خودکار + بدون ویرایش** | **۲.۲** |
| **`06/03`** | **اعتبارسنجی وام عضویت برای ادمین → تأیید/رد** (`MembershipApplication`؛ نه `/admin/installments` read-only) | **۴.۰ + ۴.۳** |
| **`06/04`** | **پشتیبانی / تیکت دوطرفه** (≠ `/help` آموزش · ≠ `Complaint` یک‌طرفه) | **۸.۰ + ۸.۱–۸.۶** |

---

## ترتیب پیشنهادی اجرا

```text
فاز ۰ (محتوا + smoke)
  → فاز ۲ (قیمت مشاوره + fix ویزیتور 06/02)
  → فاز ۳ (empty state صفحه اصلی)
  → فاز ۱ (لغو/ویرایش رزرو)
  → فاز ۴ (زحل UX + وام عضویت 06/03 — migration 012)
  → فاز ۵ (ادمین موبایل)
  → فاز ۶ (go-live)
  → فاز ۷ (docs)
  → فاز ۸ (تیکت 06/04 — migration 013)
```

---

## جدول وضعیت (پر کنید بعد از هر فاز)

| فاز | Deploy | Smoke | نتیجه |
|-----|--------|-------|--------|
| ۰ محتوا واقعی | ✅ wipe | 🟨 | API خالی — پر کردن از ادمین (جدول ۰.۱) |
| ۱ رزرو لغو/ویرایش | ✅ | ✅ | API smoke ۲۰۲۶-۰۸-۲۲؛ edit modal در commit بعدی |
| ۲ قیمت + ویزیتور | ✅ | ✅ | seed consultation + visitors |
| ۳ صفحه اصلی | ✅ | ✅ | empty state (client-side) |
| ۴ زحل + وام عضویت (`012`) | ✅ | ✅ | credit-check API؛ `ZOHAL_TOKEN` ops |
| ۵ ادمین موبایل | ✅ | ✅ | drawer «منو» — UI دستی |
| ۶ go-live ops | ⬜ | ⬜ | DEV_OTP، CRON، SMS |
| ۷ docs | ✅ | — | README + MANUAL-SMOKE |
| ۸ پشتیبانی / تیکت (`013`) | ✅ | ✅ | thread دوطرفه API smoke |
