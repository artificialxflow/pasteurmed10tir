# TODO v5 — فروشگاه کامل (Shop E-commerce)

سایت: `https://pasteur.plus`  
مرجع بازخورد: `updates/05/01/New Text Document.txt` + اسکرین‌شات‌های `01.jpg` / `02.jpg`  
آخرین به‌روزرسانی: ۲۰۲۶-۰۸-۱۷

> **هدف:** تبدیل بخش فروشگاه به یک **فروشگاه معمولی** — تصویر روی دیسک، چند تصویر، slug، توضیحات، ویرایش کامل، دسته‌بندی دلخواه، نمایش درست در فرانت.  
> **ارتباط:** go-live و real data در **`todo-v6.md`** (فاز R) — این سند فقط **فروشگاه** است.

---

## خلاصه مشکلات فعلی

| # | مشکل | وضعیت |
|---|------|--------|
| ۱ | محصول در `/shop` دیده نمی‌شود | ✅ preview + لینک catalog |
| ۲ | تصویر گاهی لود نمی‌شود | ✅ diskOnly + validation + migration placeholder |
| ۳ | فقط یک تصویر | ✅ `images[]` + MultiImageUploadField |
| ۴ | slug / توضیحات نیست | ✅ schema + API + ادمین |
| ۵ | ویرایش محصول نیست | ✅ فرم ویرایش |
| ۶ | دسته ثابت | ✅ ProductCategory + CRUD |
| ۷ | «۲ دسته محصول» روی بنر | ✅ از API categories |

**فایل‌های کلیدی:**  
`prisma/schema.prisma` · `app/admin/(panel)/shop/page.tsx` · `app/api/admin/content/products/route.ts` · `app/api/content/products/route.ts` · `components/shop/ShopHome.tsx` · `components/shop/ShopCatalog.tsx` · `components/admin/ImageUploadField.tsx` · `lib/shop.ts`

---

## وضعیت migrations

| Migration | موضوع | وضعیت |
|-----------|--------|--------|
| `009_shop_enhancements` | `ProductCategory` + slug/description/images/active | ✅ کد — deploy روی Runflare ⬜ |

---

# فاز ۰ — تشخیص و رفع سریع (بدون migration)

**هدف:** قبل از refactor بزرگ، مطمئن شویم محصولات واقعاً از API می‌آیند و UX گمراه‌کننده نیست.

- [x] کد: `/shop` → preview محصول + لینک `/shop/catalog`
- [x] کد: API عمومی فقط محصولات `active`
- [x] migration: URL خارجی → `/uploads/placeholder.svg`
- [x] مستند تست: `TEST-FULL-WALKTHROUGH-FA.md` به‌روز شد
- [ ] روی لایv بعد از deploy: `GET /api/content/products` → لیست غیرخالی
- [ ] روی لایv: `/shop/catalog` محصول را نشان می‌دهد

**Done when:** تستر با کلیک «مشتری عادی» یا رفتن مستقیم به `/shop/catalog` محصول را می‌بیند.

---

# فاز ۱ — UX فروشگاه (نمایش محصول بدون migration)

**هدف:** کاربر در `/shop` گم نشود؛ آمار و دسته از داده واقعی.

### ۱.۱ — صفحه landing (`/shop`)

- [x] پیش‌نمایش ۴–۸ محصول برتر / جدید روی `ShopHome` (fetch از `/api/content/products`)
- [x] دکمهٔ واضح «مشاهده همه محصولات» → `/shop/catalog`
- [x] جایگزینی عدد ثابت «۲ دسته محصول» با `count(categories)` از API
- [ ] (اختیاری v5.1) redirect یا تب «محصولات» در nav فروشگاه

### ۱.۲ — کاتالوگ (`/shop/catalog`)

- [x] empty-state واضح اگر API خطا داد (نه لیست ساکت خالی)
- [x] fallback تصویر: `/uploads/placeholder.svg` اگر `image` خالی یا URL خارجی
- [x] فیلتر دسته از API categories

### ۱.۳ — اپ (`/app/shop`)

- [x] parity با وب: preview محصول + مسیر catalog

**Done when:** اسکرین‌شات `/shop` محصول واقعی نشان می‌دهد؛ کارفرما تأیید UX.

---

# فاز ۲ — تصاویر: فقط دیسک + چند تصویر

**هدف:** تصویر فقط از `/uploads/`؛ امکان گالری برای هر محصول.

### ۲.۱ — آپلود اجباری (کد فعلی)

- [x] `ImageUploadField`: prop `diskOnly` — بدون placeholder `https://...` برای shop
- [x] validation سمت سرور در `PUT /api/admin/content/products`: رد کردن `http://` / `https://`
- [x] migration داده: URL خارجی → placeholder

### ۲.۲ — چند تصویر (نیاز migration فاز ۳)

- [x] فیلد `images String[]` در `Product` — تصویر اول = thumbnail
- [x] UI ادمین: `MultiImageUploadField` + ترتیب ↑↓
- [x] هر آپلود → `saveUploadedImage` → `/uploads/...`
- [x] فرانت: کارت = `images[0]`؛ صفحه جزئیات = گالری

**Done when:** هیچ محصولی در DB لینک خارجی ندارد؛ ادمین ≥۲ تصویر آپلود می‌کند.

---

# فاز ۳ — مدل داده: دسته، slug، توضیحات

**هدف:** schema شبیه فروشگاه معمولی.

### ۳.۱ — Prisma

- [x] مدل `ProductCategory`: `id`, `name`, `slug`, `sortOrder`, `active`
- [x] گسترش `Product`: `slug`, `description`, `images[]`, `categoryId`, `active`, `sortOrder`
- [x] migration `20260817120000_009_shop_enhancements`
- [x] seed: `seed-phase2.ts` دسته‌ها + فیلدهای جدید

### ۳.۲ — API

- [x] `GET/PUT /api/admin/content/product-categories` — CRUD دسته
- [x] `GET /api/content/product-categories` — عمومی (فقط active)
- [x] `GET /api/content/products` — فیلتر `active` + join category
- [x] `GET /api/content/products/[slug]` — جزئیات یک محصول
- [x] `PUT /api/admin/content/products` — upsert (نه delete-all خام)

### ۳.۳ — slug

- [x] تابع `slugifyFa(name)` — پیشنهاد خودکار از نام
- [x] ادمین: فیلد slug با پیش‌فرض قابل ویرایش
- [x] uniqueness check + پیام خطای فارسی (سرور)

**Done when:** migration روی لایv؛ API categories + products با slug برمی‌گردد.

---

# فاز ۴ — پنل ادمین فروشگاه (CRUD کامل)

**هدف:** `/admin/shop` مثل فروشگاه معمولی — نه فقط add/delete.

### ۴.۱ — مدیریت دسته‌ها

- [x] بخش «دسته‌بندی‌ها»: افزودن / ویرایش / حذف (با guard اگر محصول دارد)
- [x] dropdown دسته در فرم محصول از API

### ۴.۲ — مدیریت محصولات

- [x] دکمه «ویرایش» روی هر ردیف جدول
- [x] فیلدها: نام، slug، دسته، قیمت، موجودی، توضیحات، تصاویر
- [x] toggle فعال/غیرفعال
- [x] sortOrder در فرم
- [x] حذف با confirm

### ۴.۳ — سفارشات (موجود)

- [x] regression: revenue / low stock / pending orders (بدون تغییر اساسی)

**Done when:** کارفرما بدون SQL بتواند محصول را ویرایش کند و دسته جدید بسازد.

---

# فاز ۵ — فرانت فروشگاه (تجربه کامل)

**هدف:** مسیرهای کاربر نهایی.

### ۵.۱ — کاتالوگ

- [x] فیلتر دسته از `GET /api/content/product-categories`
- [x] کارت محصول: thumbnail، نام، قیمت، موجودی، badge VIP
- [x] لینک کارت → `/shop/product/[slug]`

### ۵.۲ — صفحه جزئیات محصول

- [x] `app/(site)/shop/product/[slug]/page.tsx`
- [x] گالری تصاویر، توضیحات، قیمت، افزودن به سبد
- [x] metadata از slug
- [x] نسخه `/app/shop-product/[slug]`

### ۵.۳ — سبد و VIP

- [x] `ShopCart` / cache API — regression حفظ شد
- [ ] regression لایv: تخفیف ۲٪ VIP، `/shop/facility`، `/shop/vip`

### ۵.۴ — SEO و nav

- [x] breadcrumb: فروشگاه → دسته → محصول
- [ ] sitemap (اختیاری v5.1): `/shop/product/*`

**Done when:** مسیر کامل browse → detail → cart → success روی لایv.

---

# فاز ۶ — QA، مستندات، deploy

### ۶.۱ — تست دستی

- [x] به‌روزرسانی `backend-dev/TEST-FULL-WALKTHROUGH-FA.md`
- [x] `npm run build` بدون خطا
- [x] seed فروشگاه: تصاویر localize به `/uploads/` (نه URL خارجی در DB بعد از seed)

### ۶.۲ — deploy Runflare

- [ ] push → redeploy
- [ ] `npx prisma migrate deploy` (migration `009`)
- [ ] smoke test روی `pasteur.plus`

### ۶.۳ — هم‌راستایی با todo-v6

- [ ] R4: محصولات فروشگاه از ادمین — بعد از deploy لایv
- [ ] R5: بدون Unsplash در DB — بعد از migrate/seed لایv
- [ ] تست end-to-end shop-vip + زیibal (بند H در v6)

**Done when:** کارفرما اسکرین‌شات `/shop` + `/admin/shop` تأیید کند.

---

## وضعیت پیشرفت (جدول)

| فاز | موضوع | وضعیت |
|-----|--------|--------|
| ۰ | تشخیص + تست API/catalog | 🟨 کد ✅ — لایv ⬜ |
| ۱ | UX landing + preview | ✅ |
| ۲ | تصویر دیسک + چند تصویر | ✅ |
| ۳ | DB + API (slug, desc, categories) | 🟨 migrate deploy ⬜ |
| ۴ | ادمین CRUD کامل | ✅ |
| ۵ | فرانت catalog + detail | 🟨 regression لایv ⬜ |
| ۶ | QA + deploy | 🟨 build ✅ — deploy ⬜ |

---

## ترتیب پیشنهادی اجرا

```text
✅ فاز ۰–۵ (کد)
⬜ deploy + npx prisma migrate deploy روی Runflare
⬜ smoke test pasteur.plus
```

---

## خارج از scope این سند (ارجاع)

| موضوع | سند |
|--------|-----|
| Go-live، OTP، CRON، زیibal | `todo-v6.md` بخش A |
| حذف mock / PasteurStorage | `todo-v6.md` فاز R3 |
| `admin/help` → DB | `todo-v6.md` R3 |
| pastour Android parity | `todo-v4.md` — فعلاً skip |

---

## ایمنی

- migration روی Runflare: قبل از deploy backup DB (`todo-v6` R0).
- `PUT /api/admin/content/products` اکنون **upsert** است (امن‌تر از delete-all).
- فایل تست با پسورد (`TEST-FULL-WALKTHROUGH-FA.md`) commit نشود (`.gitignore`).
