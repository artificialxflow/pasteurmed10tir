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
| Deploy + migrate `010` + `011` | ✅ |
| `db:wipe-production --confirm` | ✅ — فقط `admin` |
| CRUD دندانپزشک/متخصص | ✅ کد |
| Sidebar آکاردئون ادمین (دسکتاپ) | ✅ کد |
| داده واقعی از ادمین | 🟨 در حال پر کردن |
| لغو/ویرایش رزرو (ادمین + بیمار) | ✅ فاز ۱ — لغو بیمار + ستون موبایل ادمین |
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
| جدید (فاز ۱) | لغو رزرو بیمار | ⬜ در صورت نیاز |
| **`012_membership_zohal`** (پیشنهادی) | `MembershipApplication`: zohal + workflow تأیید/رد وام | ✅ فاز ۴.۳ |
| **`013_support_tickets`** (پیشنهادی) | `SupportTicket` + `SupportMessage` — thread دوطرفه | ✅ فاز ۸ |

---

# فاز ۰ — بعد از wipe: محتوای واقعی + smoke (P0)

**هدف:** سایت و ادمین قابل استفاده باشد.

**گزارش:** `06/01` — رزرو خالی طبیعی تا داده واقعی؛ مشاوره لیزل (`0936522555`) نمونه live.

### ۰.۱ — پر کردن محتوا (دستی از ادمین)

- [ ] `/admin/services` — کارت‌های صفحه اصلی (emoji + تصویر `/uploads/` + href + رنگ)
- [ ] `/admin/doctors` — دندانپزشک + متخصص
- [ ] `/admin/insurances` — بیمه پایه و مکمل
- [ ] `/admin/consultation-prices` — «بازگشت به پیش‌فرض» یا تعریف دستی + **ذخیره**
- [ ] `/admin/bookings` — بیعانه (مثلاً ۲۰۰٬۰۰۰)
- [ ] `/admin/gallery` — در صورت نیاز
- [ ] `/admin/shop` — دسته + محصول
- [ ] `/admin/visitors` — ویزیتور با **درصد پورسانت دلخواه** (فعلاً تا fix فاز ۲ با دقت مقدار را قبل از ثبت عوض کنید)
- [ ] (اختیاری) پاکسازی تصاویر seed در `public/uploads`

### ۰.۲ — smoke

- [ ] `/` — کارت سرویس + emoji/تصویر
- [ ] `/dental/general` + `/dental/booking`
- [ ] `/admin/consultation-prices` — جدول پر
- [ ] `/admin/consultations` — درخواست live
- [ ] `/admin/visitors` — ثبت کد معرف + فعال‌سازی
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — CRUD پزشکان

**Done when:** مسیر اصلی بیمار + پنل ادمین با داده واقعی مرکز کار کند.

---

# فاز ۱ — رزرو: لغو و ویرایش (P0)

**گزارش:** `06/01` بند ۱.

**وضعیت فعلی:**
- ادمین: فقط **لغو** (`/admin/bookings`)
- بیمار: فقط **نمایش** در `/account`
- API بیمار برای `PATCH booking` **ندارد**

### ۱.۱ — API

- [ ] `PATCH /api/operations/bookings/[id]` — بیمار: لغو با چک `patientPhone` / `userId`
- [ ] پیام بیعانه غیرقابل استرداد (`depositNonRefundable`)
- [ ] (اختیاری) `PATCH /api/admin/operations/bookings` — ویرایش روز/ساعت/پزشک/وضعیت
- [ ] slot occupied بعد از لغو/ویرایش

### ۱.۲ — UI ادمین

- [ ] پیام تأیید لغو واضح‌تر
- [ ] ستون **موبایل** مراجع
- [ ] مودال/فرم **ویرایش** رزرو

### ۱.۳ — UI بیمار

- [ ] دکمه **لغو نوبت** در «رزروهای اخیر» (`/account`)
- [ ] پیام «بیعانه قابل استرداد نیست»
- [ ] (بعداً) درخواست تغییر زمان

### ۱.۴ — تست

- [ ] لغو از account → admin
- [ ] لغو از admin → slot آزاد
- [ ] smoke بند ۲

**Done when:** بیمار و ادمین رزرو فعال را لغو کنند؛ ادمین در صورت نیاز ویرایش کند.

---

# فاز ۲ — قیمت مشاوره + ویزیتور (P1)

**گزارش:** `06/01` بند ۲ و ۳ · **`06/02`** (پورسانت خودکار ۵٪)

### ۲.۱ — قیمت مشاوره (`/admin/consultation-prices`)

**علت خالی:** `ConsultationType` بعد از wipe خالی است.

- [ ] empty state: «انواع مشاوره تعریف نشده — پس از wipe…»
- [ ] دکمه **«ایجاد انواع پیش‌فرض»** (بدون `db:seed:phase2` کامل)
- [ ] wizard افزودن نوع (id, label, emoji, priceNum)
- [ ] وقتی `types.length === 0` — جدول تعرفه پیام راهنما ندهد (ستون خالی گیج‌کننده)
- [ ] smoke: `/consultation` مبلغ درست

### ۲.۲ — ویزیتور (`/admin/visitors`)

**گزارش `06/02`:** «۵٪ پورسانت خودکار می‌اندازد» — در کد `useState("5")` و بعد از ثبت `setRate("5")`؛ جدول **read-only**.

**اسکرین:** ویزیتور `CD` / `09064684849` / `5%` / غیرفعال — فرم پایین با فیلد «۵».

- [ ] **حذف hardcode پیش‌فرض ۵٪** — فیلد خالی یا placeholder «مثلاً ۵»
- [ ] **FormLabel** واضح: «درصد پورسانت (٪)»
- [ ] **ویرایش inline** `commissionRate` (+ نام/تماس در صورت نیاز) در جدول
- [ ] دکمه **ذخیره** per-row یا «ذخیره همه»
- [ ] فرم افزودن **بالای** جدول (موبایل بدون اسکرول طولانی)
- [ ] پیام موفق: «ویزیتور X با پورسانت Y٪ ثبت شد»
- [ ] validation: نام + کد معرف اجباری؛ درصد ۰–۱۰۰
- [ ] smoke: کد در رزرو → `/admin/commissions`

**Done when:** ادمین درصد را آزادانه set/edit کند؛ ۵٪ فقط پیشنهاد نباشد مگر کاربر بخواهد.

---

# فاز ۳ — صفحه اصلی و empty state (P1)

**گزارش:** `06/01` بند ۴.

- [ ] `/` وقتی services خالی: کارت «از /admin/services اضافه کنید»
- [ ] ادمین services: emoji + image اجباری یا placeholder
- [ ] fallback تصویر شکسته (`/uploads/` 404)

**Done when:** سکشن سرویس خالی بی‌صدا نباشد.

---

# فاز ۴ — زحل، اعتبارسنجی، درخواست وام/اقساط (P1)

**گزارش:** `06/01` بند ۵ · **`06/03`** — «اعتبارسنجی بانکی در درخواست اقساط برای ادمین → بعد تأیید/رد وام»

### ۴.۰ — تشخیص: سه مسیر جدا در کد (مهم)

| مسیر ادمین | مدل DB | زحل اعتبار | تأیید/رد | یادداشت |
|------------|--------|------------|----------|---------|
| **`/admin/facilities`** | `FacilityRequest` | ✅ submit + خلاصه در جدول | ✅ dropdown | **الان کار می‌کند** — تسهیلات تجهیزات |
| **`/admin/installments`** | `InstallmentPlan` | ❌ | ❌ | فقط **لیست read-only** طرح‌های فعال (`GET` only) |
| **`/admin/memberships`** | `MembershipApplication` | ❌ | ❌ | فرم **`loanAmount`** — فقط نمایش، بدون workflow |

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
| `/admin/memberships` | ⬜ باید: زحل + تأیید/رد **وام** |
| `/admin/installments` | 🟨 گزارش اقساط جاری — نه inbox درخواست |

---

### ۴.۲ — UX بیمار (راهنما + زحل)

- [ ] `/account`: بلوک «اعتبارسنجی بانکی» + لینک `/shop/facility` (تسهیلات) و `/dental/membership` (وام درمانی)
- [ ] `/shop/facility`: توضیح «استعلام اعتبار از زحل»
- [ ] `/dental/membership`: بعد از submit — «درخواست ثبت شد؛ پس از بررسی اعتبار با شما تماس می‌گیریم»
- [ ] `/installments`: توضیح تفاوت «طرح فعال» vs «درخواست در انتظار»
- [ ] `ZOHAL_TOKEN` روی Runflare + restart

---

### ۴.۳ — درخواست وام عضویت: زحل + تأیید/رد (`06/03`) — **اولویت کد**

**گزارش:** «اعتبارسنجی بانکی در قسمت درخواست اقساط برای ادمین → بعد تأیید/رد درخواست وام»

**Gap:** `MembershipApplication` فیلد `status` دارد ولی **بدون** `zohalStatus` / workflow در UI.

#### ۴.۳.۱ — Schema (migration `012_membership_zohal`)

- [ ] `MembershipApplication`: `zohalStatus`, `zohalPayload` (Json), `shahkarMatched`, `zohalCheckedAt`
- [ ] `reviewedAt`, `reviewNote` (اختیاری)
- [ ] `status`: `pending` | `approved` | `rejected` (هماهنگ با facilities)

#### ۴.۳.۲ — API ادمین

- [ ] `GET /api/admin/commerce/membership-applications` — لیست با map زحل (یا گسترش `/api/admin/commerce/members`)
- [ ] `POST /api/admin/commerce/membership-applications/[id]/credit-check` — `zohalShahkar` + `zohalCreditInquiry` + `zohalNationalIdentity` + `zohalBouncedCheque` (reuse از `facilities/route.ts`)
- [ ] `PATCH /api/admin/commerce/membership-applications/[id]` — `status: approved|rejected` + یادداشت
- [ ] helper `mapMembershipApplication` — `zohalSummary` مثل `mapFacilityRequest`
- [ ] بعد از **approved**: (طبق تصمیم کسب‌وکار) ایجاد `InstallmentPlan` یا flag «وام تأیید» — **نه** auto بدون قانون

#### ۴.۳.۳ — UI `/admin/memberships`

- [ ] جدول «فرم‌های پیشنهاد» → ستون‌های **کد ملی**، **مبلغ وام** (`loanAmount`)، **زحل**، **خلاصه استعلام**
- [ ] دکمه **«استعلام اعتبار»** per-row
- [ ] dropdown یا دکمه **تأیید / رد / در بررسی** (الگو: `/admin/facilities`)
- [ ] پیام موفق/خطا؛ disable تأیید اگر شاهkar failed (با override دستی اختیاری)
- [ ] لینک راهنما: «تسهیلات تجهیزات → `/admin/facilities`»

#### ۴.۳.۴ — (اختیاری) `/admin/installments` inbox

- [ ] تب «درخواست‌های در انتظار» vs «طرح‌های فعال»
- [ ] یا redirect به memberships برای workflow وام

#### ۴.۳.۵ — تست smoke

- [ ] فرم عضویت با `loanAmount` → ادمین استعلام زحل → تأیید
- [ ] رد با شاهkar ناموفق
- [ ] `ZOHAL_TOKEN` خاموش → `zohalStatus=skipped` + manual flow

**Done when:** ادمین برای **درخواست وام عضویت** همان کنترل اعتبار + تأیید/رد مثل تسهیلات داشته باشد؛ `/admin/installments` گیج‌کننده نباشد (راهنما یا inbox).

---

# فاز ۵ — UX ادمین موبایل (P2)

**گزارش:** `06/01` اسکرین‌ها — chip افقی فقط بخش فعلی (عملیات یا رشد).

- [ ] drawer / آکاردئون موبایل (مثل دسکتاپ)
- [ ] دکمه «منو» به‌جای scroll بی‌نهایت chip
- [ ] touch target و فونت مناسب

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

- [ ] `README.md`: بعد از wipe — `db:wipe-production` نه `db:seed:phase2`
- [ ] `MANUAL-SMOKE-CHECKLIST.md`: لغو رزرو بیمار، قیمت مشاوره، ویزیتور، **تیکت پشتیبانی**
- [ ] `todo-v6` R4 وقتی محتوا از ادمین پر شد
- [ ] deploy آخرین commit (sidebar، wipe، dentist)

---

# فاز ۸ — پشتیبانی / تیکت (`06/04`) (P2 — feature جدید)

**گزارش:** «قسمت پشتیبانی برای تیکت گذاشتن — هم فرانت هم بک‌اند آماده شود.»

### ۸.۰ — تشخیص: سه مسیر جدا در کد (مهم)

| مسیر | مدل / ذخیره | بیمار | ادمین | thread / پاسخ | یادداشت |
|------|-------------|-------|-------|---------------|---------|
| **`/complaints`** | `Complaint` (Prisma) | ✅ `POST` فقط | 🟨 inbox | ❌ | یک پیام ثابت؛ بدون `GET` لیست بیمار |
| **`/help`** | `HelpItem` (localStorage) | ✅ محتوای آموزشی | ✅ CRUD | — | ویدیو/PDF — **≠** تیکت |
| **پشتیبانی تیکتی** | — | ❌ | ❌ | ❌ | **Gap اصلی `06/04`** |

**وضعیت `Complaint` فعلی:**
- API بیمار: فقط `POST /api/operations/complaints` — `ComplaintsPage.tsx`
- API ادمین: `GET` + `PATCH status` — بدون فیلد پاسخ / پیام follow-up
- UI ادمین: دکمه «بررسی» / «بستن» — بدون textarea پاسخ
- `/account`: لینک «ثبت شکایت» — نه «تیکت‌های من»

**Gap نسبت به `06/04`:**

| قابلیت | الان | درخواست |
|--------|------|---------|
| فرم ثبت | ✅ شکایت | ✅ تیکت |
| لیست تیکت‌های بیمار | ❌ | ✅ |
| وضعیت (باز/بسته/…) | 🟨 فقط ادمین | ✅ هر دو طرف |
| پاسخ ادمین | ❌ | ✅ |
| تاریخچه مکالمه | ❌ | ✅ |
| مسیر «پشتیبانی» | ❌ | ✅ |

**تصمیم پیاده‌سازی v8 (پیشنهاد):** مدل جدید **`SupportTicket` + `SupportMessage`** (migration `013`) — تفکیک از «شکایت formal».  
`/complaints` فعلاً بماند؛ لینک‌های جدید به `/support`. (اختیاری بعداً: migrate `Complaint` → ticket)

---

### ۸.۱ — Schema (migration `013_support_tickets`)

- [ ] enum `SupportTicketStatus`: `open` | `reviewing` | `closed`
- [ ] enum `SupportMessageSender`: `patient` | `admin`
- [ ] `SupportTicket`: id, userId?, patientPhone, patientName, subject, status, priority?, createdAt, updatedAt, closedAt?
- [ ] `SupportMessage`: id, ticketId, sender, body, createdAt
- [ ] index: `[patientPhone]`, `[userId]`, `[status]`, `[ticketId]`
- [ ] wipe/reset scripts: include `SupportMessage` + `SupportTicket`

---

### ۸.۲ — API بیمار

- [ ] `POST /api/operations/support/tickets` — subject + body (+ name/phone یا از session)
- [ ] `GET /api/operations/support/tickets` — لیست خود (filter `patientPhone` / `userId`)
- [ ] `GET /api/operations/support/tickets/[id]` — جزئیات + messages (ownership check)
- [ ] `POST /api/operations/support/tickets/[id]/messages` — follow-up (اگر status ≠ closed)
- [ ] mapper: `mapSupportTicket`, `mapSupportMessage`

---

### ۸.۳ — API ادمین

- [ ] `GET /api/admin/operations/support/tickets` — inbox + filter status
- [ ] `GET /api/admin/operations/support/tickets/[id]` — thread کامل
- [ ] `POST /api/admin/operations/support/tickets/[id]/messages` — پاسخ admin
- [ ] `PATCH /api/admin/operations/support/tickets/[id]` — status + priority + closedAt
- [ ] permission: reuse **`complaints`** یا permission جدید **`support`**
- [ ] dashboard: badge «تیکت باز» (مثل `newComplaints`)

---

### ۸.۴ — UI بیمار

- [ ] `/support` — لیست تیکت‌ها + فرم «تیکت جدید» + صفحه thread
- [ ] `/app/support` — parity اپ
- [ ] `/account`: لینک **«پشتیبانی / تیکت‌های من»** (کنار «ثبت شکایت» یا جایگزین تدریجی)
- [ ] وضعیت فارسی: باز / در حال بررسی / بسته
- [ ] empty state: «هنوز تیکتی ثبت نکرده‌اید»
- [ ] **نه** `/help` — help فقط آموزش بماند

---

### ۸.۵ — UI ادمین

- [ ] `/admin/support` — inbox + پنل مکالمه (الگو: chat ساده)
- [ ] یا گسترش `/admin/complaints` با تب «شکایت قدیمی» / «تیکت»
- [ ] sidebar: آیتم «پشتیبانی» با permission
- [ ] فیلتر: باز / در بررسی / بسته
- [ ] textarea پاسخ + دکمه «ارسال پاسخ» + «بستن تیکت»
- [ ] (اختیاری) SMS notify هنگام پاسخ admin

---

### ۸.۶ — تست smoke

- [ ] بیمار: تیکت جدید → در لیست «باز»
- [ ] ادمین: پاسخ → بیمار thread را می‌بیند
- [ ] بیمار: follow-up → ادمین notification/inbox
- [ ] بستن تیکت → follow-up مسدود
- [ ] `MANUAL-SMOKE-CHECKLIST.md` — بند جدید

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
| ۰ محتوا واقعی | ⬜ | ⬜ | |
| ۱ رزرو لغو/ویرایش | ⬜ deploy | ⬜ smoke | ✅ کد |
| ۲ قیمت + ویزیتور | ⬜ deploy | ⬜ smoke | ✅ کد |
| ۳ صفحه اصلی | ⬜ deploy | ⬜ smoke | ✅ کد |
| ۴ زحل + وام عضویت (`012`) | ⬜ | ⬜ | |
| ۵ ادمین موبایل | ⬜ deploy | ⬜ smoke | ✅ کد |
| ۶ go-live ops | ⬜ | ⬜ | |
| ۷ docs | ⬜ | ⬜ | |
| ۸ پشتیبانی / تیکت (`013`) | ⬜ deploy | ⬜ smoke | ✅ کد |
