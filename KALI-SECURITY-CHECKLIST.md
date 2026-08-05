# چک‌لیست تست امنیتی Kali — Pasteur Plus

**آخرین به‌روزرسانی وضعیت:** ۲۰۲۶-۰۸-۰۵  
سایت هدف: `https://pasteur.plus`  
Smoke دستی UI: `MANUAL-SMOKE-CHECKLIST.md` → **همه موارد سبز گزارش شده**  
قبل از لانچ عمومی: `backend-dev/GO-LIVE.md`  
رمزهای ادمین: فقط در `ADMIN-CREDENTIALS.local.md` و فایل‌های local/gitignored — روی UI نیست.

---

## وضعیت کلی این دور

| وضعیت | معنی |
|--------|------|
| ✅ انجام شد + نتیجه OK | دیگر لازم نیست تکرار شود مگر بعد از تغییر بزرگ / قبل از Go-Live |
| 🟡 انجام‌شده با نکته / نیازمند تأیید بعد از deploy اصلاحات | مشکل بحرانی فعلی نیست |
| ⬜ باقی مانده — روی Kali یا مرورگر انجام شود | اولویت جلسه بعد |
| ⛔ عمداً نکنید / مربوط به Go-Live بعدی | SMS واقعی، حذف DEV_OTP، اسکن سنگین و… |

**حکم فعلی امنیت staging:** قبول مشروط سبز.

- یافتهٔ High قبلی (افشای credential در `/admin/login`) رفع و تأیید شده است.
- APIهای ادمین بدون نشست همگی `401` بودند.
- `POST /api/admin/upload` بدون نشست `401` بود و آپلود انجام نشد.
- صفحات `/admin/bookings` و `/admin/access` بدون نشست دادهٔ حساس نشان ندادند، ولی سابقاً با `HTTP 200` و prerender/cache برگشتند.
- در کد پروژه اصلاحات بعدی اعمال شده (نیاز به **deploy** و تأیید مجدد روی لایو): `proxy.ts` برای ریدایرکت بدون session، `force-dynamic` روی ادمین، `poweredByHeader: false`، security headers پایه.
- تست نقش `ops`، بررسی cookie/session و ZAP سبک هنوز باقی است.

---

# الف) انجام‌شده — با نتیجه

## الف-۰ — پیش‌نیاز محصول / اصلاح کد

| کار | نتیجه | توضیح |
|-----|--------|--------|
| `MANUAL-SMOKE-CHECKLIST.md` کامل دستی | ✅ OK | همه موارد سبز گزارش شده‌اند |
| حذف باکس «حساب‌های نمونه» از `/admin/login` | ✅ OK | کد: `app/admin/login/page.tsx` |
| خالی کردن پیش‌فرض username/password در فرم | ✅ OK | فیلدها `value=""` |
| Rotate رمز admin/ops/content/finance | ✅ OK | Seed + فایل local |
| پاک‌سازی رمز قدیمی از docs عمومی | ✅ OK | رمز فقط در local/gitignored |
| تأیید عدم رمز قدیمی در HTML عمومی | ✅ OK | grep خروجی خالی |

---

## الف-۱ — افشای credential در HTML عمومی

**دستور تأیید (انجام‌شده روی Kali):**

```bash
curl -fsSL https://pasteur.plus/admin/login | \
  grep -Ei 'pasteur1403|ops1403|content1403|finance1403'
```

| نتیجه | ارزیابی |
|--------|----------|
| خروجی خالی | ✅ OK — رمزهای قدیمی در HTML عمومی نیستند |

**نکته:** grep گسترده‌تر روی `admin` / `رمز` / `password` ممکن است کل HTML لاگین را برگرداند. این یافتهٔ امنیتی نیست (برچسب فرم و مسیر `/admin/login`). معیار: وجود **مقدار واقعی password**.

یافتهٔ قبلی «نمایش حساب‌های نمونه روی لاگین» → **بسته / رفع‌شده**.

---

## الف-۲ — API ادمین بدون نشست

**دستور تأیید (با مسیر کامل ابزارها در صورت خرابی PATH):**

```bash
for path in \
  /api/admin/me \
  /api/admin/operations/bookings \
  /api/admin/operations/patients \
  /api/admin/commerce/wallets \
  /api/admin/commerce/club
do
  echo
  echo "===== $path ====="
  /usr/bin/curl -sS -D - -o /tmp/pasteur_api_body.txt \
    -w '\nHTTP %{http_code}\n' \
    "https://pasteur.plus$path"
  echo "--- BODY ---"
  /usr/bin/cat /tmp/pasteur_api_body.txt
  echo
done
```

| Endpoint | HTTP | Body خلاصه | ارزیابی |
|----------|------|-------------|----------|
| `/api/admin/me` | `401` | `{"session":null}` | ✅ OK |
| `/api/admin/operations/bookings` | `401` | خطای ورود نشده | ✅ OK |
| `/api/admin/operations/patients` | `401` | خطای ورود نشده | ✅ OK |
| `/api/admin/commerce/wallets` | `401` | خطای ورود نشده | ✅ OK |
| `/api/admin/commerce/club` | `401` | خطای ورود نشده | ✅ OK |

**یادداشت cosmetic:** اگر در response املای «وارد نشدهاید» بدون نیم‌فاصله دیدید، در سورس فعلی پروژه متن صحیح `وارد نشده‌اید.` است — پس از redeploy بررسی شود. شدت: Low.

---

## الف-۳ — آپلود ادمین بدون نشست

```bash
/usr/bin/curl -sS -D - -o /tmp/pasteur_upload_body.txt \
  -w '\nHTTP %{http_code}\n' \
  -X POST \
  https://pasteur.plus/api/admin/upload

/usr/bin/cat /tmp/pasteur_upload_body.txt
```

| Endpoint | HTTP | ارزیابی |
|----------|------|----------|
| `POST /api/admin/upload` | `401` | ✅ OK — بدون نشست آپلود نشد |

---

## الف-۴ — صفحات ادمین بدون نشست (قبل از اصلاح proxy/cache)

**مشاهدهٔ پیش از اصلاح کد روی لایو:**

```text
HTTP/2 200
x-nextjs-cache: HIT
x-nextjs-prerender: 1
cache-control: s-maxage=31536000
x-powered-by: Next.js
```

بررسی HTML با markerهای حساس (شماره موبایل، نام بیمار، کیف، wallet، مدیریت نقش، …) → **چیزی پیدا نشد**.

| صفحه | HTTP (قبلی) | داده حساس | ارزیابی |
|------|-------------|-----------|----------|
| `/admin/bookings` | `200` | دیده نشد | 🟡 OK مشروط (قبل از deploy اصلاحات) |
| `/admin/access` | `200` | دیده نشد | 🟡 OK مشروط (قبل از deploy اصلاحات) |

**اصلاحات کد اعمال‌شده در ریپو (نیازمند deploy + تأیید مجدد):**

- `proxy.ts`: بدون cookie معتبر `pasteur_admin_session` → ریدایرکت به `/admin/login`
- `app/admin/layout.tsx`: `dynamic = "force-dynamic"`, `revalidate = 0`
- `next.config.ts`: `poweredByHeader: false` + security headers پایه
- هدر `Cache-Control: no-store…` روی پاسخ‌های `/admin/*` در proxy

**بعد از deploy این را روی Kali تکرار کنید:**

```bash
/usr/bin/curl -sSI https://pasteur.plus/admin/bookings | /usr/bin/head -n 25
/usr/bin/curl -sSI https://pasteur.plus/admin/access | /usr/bin/head -n 25
```

انتظار مطلوب پس از deploy: `302`/`307` به `/admin/login` (نه HTML داشبورد با cache طولانی).

| تأیید بعد از deploy | نتیجه |
|---------------------|--------|
| `/admin/bookings` بدون نشست → ریدایرکت لاگین | ⬜ |
| `/admin/access` بدون نشست → ریدایرکت لاگین | ⬜ |
| نبود `x-powered-by: Next.js` (یا کاهش fingerprint) | ⬜ |

---

## الف-۵ — نکتهٔ محیط Kali (باگ سایت نیست)

در چند اجرای اولیه `curl`/`cat`/`grep` به‌خاطر خراب شدن `PATH` پیدا نمی‌شدند. ابزارها در `/usr/bin/` بودند. تست‌های API نهایتاً با مسیر کامل انجام و **تمام** شدند (دیگر «حلقه ناتمام» نیست).

```bash
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
hash -r
# یا مستقیم:
/usr/bin/curl …
```

Paste کردن متن فارسی گزارش داخل shell → `command not found` بی‌ربط به سایت است.

---

# ب) باقی‌مانده — برای انجام روی Kali / مرورگر

> بخش API و upload بدون لاگین انجام و OK شد.  
> بعد از **deploy** اصلاحات ادمین، ابتدا تأیید کوتاه الف-۴ را بزنید، سپس موارد زیر.

> **دستور به AI روی Kali:** فقط بخش ب (+ تأیید الف-۴ بعد از deploy). رمز و مقدار cookie را در گزارش عمومی ننویس.

---

## ب-۱) تست نقش ops در مرورگر — ⬜ باقی / اولویت بالا

رمز از `ADMIN-CREDENTIALS.local.md` (نه در چت/گزارش commit‌شده).

1. مرورگر ناشناس → `https://pasteur.plus/admin/login`
2. ورود با `ops` + رمز فایل local
3. `https://pasteur.plus/admin/bookings`
4. `https://pasteur.plus/admin/access`

| # | کار | انتظار | نتیجه |
|---|-----|--------|--------|
| ب-۱-a | ops → `/admin/bookings` | لیست رزروها دیده شود | ⬜ |
| ب-۱-b | ops → `/admin/access` | ممنوع / بدون مدیریت نقش | ⬜ |
| ب-۱-c | content → `/admin/access` (اختیاری) | ممنوع | ⬜ / SKIP |

---

## ب-۲) بررسی cookie / session — ⬜ باقی

بعد از لاگین `ops` یا `admin`: DevTools → Cookies → `pasteur.plus`

نام مورد انتظار cookie ادمین: `pasteur_admin_session` (فقط نام؛ مقدار را ننویسید).

| فلگ | بهتر است | مشاهده |
|-----|----------|---------|
| HttpOnly | ✅ روشن | ⬜ |
| Secure | ✅ روشن (HTTPS) | ⬜ |
| SameSite | حداقل `Lax` | ⬜ |

| مورد | انتظار |
|------|--------|
| پسورد در URL | نباشد |
| لاگین | POST + body |

---

## ب-۳) OWASP ZAP — اسکن سبک — ⬜ باقی

```bash
zaproxy &
```

1. Automated Scan روی `https://pasteur.plus` — فقط سبک  
2. Full Active / SQLMap / brute force ممنوع  
3. اگر سایت کند شد → Stop  
4. گزارش: `~/reports/zap-pasteur-plus-YYYYMMDD.html`  
5. قبل از اشتراک: cookie/token/بیمار/رمز را mask کنید  

| موضوع | اولویت |
|--------|---------|
| افشای credential / داده حساس | Critical/High |
| دسترسی بدون مجوز به API | High |
| Cookie ناامن | High |
| CORS خطرناک | High |
| debug / stack / dir listing | High |
| XSS/SQLi با confidence بالا | High/Critical |
| نبود header | Low/Medium |

| # | کار | نتیجه |
|---|-----|--------|
| ب-۳-a | اسکن تمام / Stop عمدی | ⬜ |
| ب-۳-b | مسیر گزارش | ⬜ |
| ب-۳-c | خلاصه High/Critical | ⬜ |

---

## ب-۴) اختیاری — Burp / IDOR — ⬜ SKIP مگر وقت اضافه

- Burp: Replay با ops روی access باید ممنوع بماند  
- IDOR: فقط با دو بیمار تست؛ یک شماره → SKIP  

---

## ب-۵) ممنوع همین الان — ⛔

- اسکن سنگین بدون نظارت روی لایو  
- brute force لاگین  
- `reset-all` روی DB لایو  
- حذف `DEV_OTP_*` (هنوز staging)  
- اکانت SMS واقعی الزام این دور نیست → `GO-LIVE.md`

---

# ج) قالب گزارش برای فرستادن به Cursor

```text
تاریخ/ساعت Kali: ۲۰۲۶-۰۸-۰۵ (+ ادامه: …)
هدف: https://pasteur.plus
ابزار: Kali + /usr/bin/curl | مرورگر | ZAP: هنوز / انجام شد
PATH issue: وجود داشت؛ با مسیر کامل ابزارها دور زده شد (باگ سایت نیست).

۱) Credential exposure:
  grep رمزهای قدیمی روی /admin/login → خروجی خالی.
  نتیجه: OK — یافته High بسته شد.

۲) API بدون لاگین:
  /api/admin/me: 401 — OK — {"session":null}
  /api/admin/operations/bookings: 401 — OK
  /api/admin/operations/patients: 401 — OK
  /api/admin/commerce/wallets: 401 — OK
  /api/admin/commerce/club: 401 — OK

۳) Upload بدون لاگین:
  POST /api/admin/upload: 401 — OK

۴) صفحات ادمین بدون لاگین:
  قبل از اصلاح: HTTP 200 + prerender/cache، داده حساس نبود — OK مشروط
  بعد از deploy اصلاحات (تأیید شود):
    /admin/bookings headers: …
    /admin/access headers: …
    redirect به login؟ بله/خیر

۵) باقی‌مانده این جلسه / جلسه بعد:
  - ops مرورگر: bookings … | access …
  - cookie flags: HttpOnly … Secure … SameSite …
  - ZAP: … | High/Critical: …

۶) مشکلات بحرانی جدید (اگر هست):
  1) …
```

---

# د) مسیر کلی پروژه

```text
✅ Smoke دستی UI
✅ رفع credential + rotate + deploy + تأیید HTML
✅ API ادمین + upload بدون لاگین → 401
🟡 صفحات ادمین بدون session — داده نشت نکرد؛ اصلاح proxy/cache در کد (نیاز deploy+verify)
⬜ ب-۱ ops مرورگر
⬜ ب-۲ cookie/session
⬜ ب-۳ ZAP سبک
⬜ رفع هر High/Critical جدید
⬜ بعداً: SMS + درگاه + GO-LIVE.md + حذف DEV_OTP
```

---

## قوانین ایمنی

1. فقط دامنه `pasteur.plus`  
2. اسکن لایو = نرم  
3. داده بیمار واقعی را خراب نکنید  
4. روی Kali کد اپ ننویسید — فقط تست  
5. گزارش ZAP را از secret تمیز کنید  

---

## مسیرهای مفید

| مورد | URL |
|------|-----|
| سایت | `https://pasteur.plus` |
| لاگین بیمار | `/account` |
| لاگین ادمین | `/admin/login` |
| رزروها | `/admin/bookings` |
| سطح دسترسی | `/admin/access` |
| API منِ ادمین | `/api/admin/me` |
| Cookie ادمین (نام) | `pasteur_admin_session` |

## حساب‌های تست (بدون رمز در این فایل)

| نقش | شناسه | رمز |
|-----|--------|-----|
| بیمار | `09126723365` | OTP `00000` تا وقتی DEV_OTP فعال است |
| admin / ops / content / finance | همان usernameها | `ADMIN-CREDENTIALS.local.md` |
