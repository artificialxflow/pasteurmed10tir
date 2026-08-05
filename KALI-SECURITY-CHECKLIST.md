# چک‌لیست تست امنیتی Kali — Pasteur Plus

هدف: تست امنیتی **سبک** روی staging لایو، بدون حمله سنگین و بدون نوشتن کد روی Kali.

سایت هدف (مرحله توسعه / staging):

```text
https://pasteur.plus
```

چک‌لیست smoke دستی UI: `MANUAL-SMOKE-CHECKLIST.md`  
قبل از لانچ عمومی: `backend-dev/GO-LIVE.md`  
راهنمای کلی فاز: `prompts.md` → بخش Phase +

---

## قوانین ایمنی (حتماً بخوانید)

1. فقط روی **همین دامنه/پروژه خودتان** تست کنید.
2. روی لایو: **Automated Scan نرم** — نه Full Active Scan سنگین، نه fuzz دیوانه‌وار، نه DoS.
3. دادهٔ واقعی بیمار را خراب نکنید؛ از اکانت‌های تست استفاده کنید.
4. `npm run reset-all` یا پاک کردن دیتابیس را از Kali اجرا **نکنید**.
5. روی Kali **کد ننویسید** — فقط تست و گرفتن گزارش.
6. خروجی ZAP/Burp را در پوشه `reports/` ذخیره کنید (در ریپو اگر لازم است؛ راز/کوکی داخل گزارش نگذارید).

---

## حساب‌های تست

| نقش | مسیر | داده |
|-----|------|------|
| بیمار | `/account` | `09126723365` / OTP `00000` |
| superadmin | `/admin/login` | `admin` + رمز از `ADMIN-CREDENTIALS.local.md` |
| ops | `/admin/login` | `ops` + رمز از همان فایل |
| content | `/admin/login` | `content` + رمز از همان فایل |
| finance | `/admin/login` | `finance` + رمز از همان فایل |

**بررسی افشای credential روی لاگین (واجب):**

```bash
curl -fsSL https://pasteur.plus/admin/login | \
  grep -Ei 'pasteur1403|ops1403|content1403|finance1403|حساب‌های نمونه'
```

انتظار: هیچ خروجی‌ای. اگر چیزی برگشت، بحرانی است.

> تا قبل از Go-Live عمومی، `DEV_OTP_*` روی Runflare باید بماند. حذف فقط طبق `GO-LIVE.md`.

---

## ابزارهای پیشنهادی روی Kali

| ابزار | کاربرد این چک‌لیست |
|--------|---------------------|
| OWASP ZAP (`zaproxy`) | اسکن خودکار سبک صفحات |
| browser معمولی / Firefox | تست نقش ops و لاگین |
| `curl` | API بدون لاگین → 401/403 |
| Burp Suite (اختیاری) | پروکسی لاگین و بررسی cookie/header |
| ffuf / nuclei (اختیاری خیلی سبک) | فقط مسیرهای شناخته‌شده — نه bruteforce کور |

---

## ترتیب پیشنهادی (~۴۵–۶۰ دقیقه)

```text
۱) آماده‌سازی Kali
۲) curl بدون لاگین (API ادمین)
۳) تست نقش ops در مرورگر
۴) ZAP Automated Scan نرم روی pasteur.plus
۵) (اختیاری) Burp — بررسی cookie و access
۶) (اختیاری) یک چک IDOR سبک اگر دو بیمار تست دارید
۷) پر کردن گزارش انتها
```

---

# بخش ۱ — آماده‌سازی

### ۱.۱ شبکه و زمان

- [ ] Kali به اینترنت وصل است
- [ ] `https://pasteur.plus` در مرورگر باز می‌شود

```bash
curl -I https://pasteur.plus
```

**انتظار:** پاسخ HTTP (مثلاً `200` یا `307`/`308`) — نه timeout دائمی.

- [ ] OK
- [ ] FAIL — توضیح: _______________

### ۱.۲ هدف اسکن را مشخص کنید

الان دو حالت دارید:

| حالت | هدف | توصیه |
|------|-----|--------|
| A — لایو Runflare | `https://pasteur.plus` | همین چک‌لیست — **اسکن نرم** |
| B — لوکال بعد `npm run start` | `http://localhost:3000` | طبق `prompts.md` — اسکن کامل‌تر مجازتر است |

برای این فایل پیش‌فرض = **حالت A (لایو نرم)**.

---

# بخش ۲ — API بدون لاگین (مهم‌ترین تست سریع)

در ترمینال Kali، این دستورها را یکی‌یکی بزنید.

### ۲.۱ `/api/admin/me` بدون کوکی

```bash
curl -s -o /tmp/pasteur_admin_me.txt -w "%{http_code}" \
  https://pasteur.plus/api/admin/me
echo
cat /tmp/pasteur_admin_me.txt
```

**انتظار:** `401` یا `403` — نه `200` با دادهٔ ادمین.

کد دریافتی: _______________

- [ ] OK
- [ ] FAIL — توضیح: _______________

### ۲.۲ لیست رزروهای ادمین بدون لاگین

```bash
curl -s -o /tmp/pasteur_bookings.txt -w "%{http_code}" \
  https://pasteur.plus/api/admin/operations/bookings
echo
cat /tmp/pasteur_bookings.txt
```

**انتظار:** `401` / `403` — نه لیست رزروها.

کد دریافتی: _______________

- [ ] OK
- [ ] FAIL — توضیح: _______________

### ۲.۳ بیماران / کیف / باشگاه ادمین بدون لاگین

```bash
curl -s -w "\nHTTP %{http_code}\n" \
  https://pasteur.plus/api/admin/operations/patients

curl -s -w "\nHTTP %{http_code}\n" \
  https://pasteur.plus/api/admin/commerce/wallets

curl -s -w "\nHTTP %{http_code}\n" \
  https://pasteur.plus/api/admin/commerce/club
```

**انتظار:** همه `401` یا `403`.

- [ ] OK
- [ ] FAIL — توضیح: _______________

### ۲.۴ آپلود ادمین بدون لاگین

```bash
curl -s -w "\nHTTP %{http_code}\n" \
  -X POST https://pasteur.plus/api/admin/upload
```

**انتظار:** `401` / `403` / `400` بدون آپلود موفق. نباید فایل جدید روی سرور ساخته شود.

- [ ] OK
- [ ] FAIL — توضیح: _______________

### ۲.۵ صفحات ادمین بدون لاگین (ریدایرکت)

```bash
curl -sI https://pasteur.plus/admin/bookings | head -n 20
curl -sI https://pasteur.plus/admin/access | head -n 20
```

**انتظار:** ریدایرکت به لاگین (`/admin/login`) یا عدم دسترسی — نه HTML کامل داشبورد.

- [ ] OK
- [ ] FAIL — توضیح: _______________

---

# بخش ۳ — تست نقش ops (Browser)

### ۳.۱ ورود ops

1. مرورگر: `https://pasteur.plus/admin/login`
2. ورود با: `ops` و رمز از `ADMIN-CREDENTIALS.local.md`
3. بروید به: `/admin/bookings` (**رزروها**)

**انتظار:** لیست رزروها دیده می‌شود.

- [ ] OK
- [ ] FAIL — توضیح: _______________

### ۳.۲ ممنوع بودن سطح دسترسی

1. مستقیم بروید به: `https://pasteur.plus/admin/access`

**انتظار:** ممنوع / خطای دسترسی / ریدایرکت — صفحه مدیریت نقش‌ها باز نشود.

- [ ] OK
- [ ] FAIL — توضیح: _______________

### ۳.۳ (اختیاری) نقش content

1. خروج → ورود با `content` و رمز از `ADMIN-CREDENTIALS.local.md`
2. سعی کنید `/admin/access` و ترجیحاً بخش‌های مالی حساس را باز کنید

**انتظار:** فقط منوهای مجاز content؛ `access` ممنوع.

- [ ] OK
- [ ] FAIL
- [ ] SKIP

---

# بخش ۴ — OWASP ZAP (اسکن نرم روی لایو)

### ۴.۱ باز کردن ZAP

```bash
zaproxy &
# یا از منوی Kali: OWASP ZAP
```

### ۴.۲ Automated Scan نرم

1. Quick Start → **Automated Scan**
2. URL: `https://pasteur.plus`
3. گزینه‌های تهاجمی کامل را روشن نکنید اگر زنگ خطر / بار سنگین می‌دهد
4. اسکن را اجرا کنید و صبر کنید تا تمام شود

**نکته لایو:** اگر سایت کند شد یا خطای زیاد دیدید، Stop کنید. هدف پیدا کردن باگ آشکار است، نه خراب کردن سرویس.

- [ ] اسکن شروع شد
- [ ] اسکن تمام شد / متوقف شد عمدی
- [ ] SKIP

### ۴.۳ ذخیره گزارش

1. Report → Generate HTML Report (یا معادل UI نسخه ZAP شما)
2. ذخیره در ماشین Kali، سپس کپی به پروژه اگر خواستید:

```text
reports/zap-pasteur-plus-YYYYMMDD.html
```

- [ ] گزارش ذخیره شد → مسیر: _______________
- [ ] SKIP

### ۴.۴ مرور یافته‌ها (دستی)

حداقل این‌ها را در گزارش چک کنید:

| موضوع | اولویت توجه |
|--------|-------------|
| Missing security headers | متوسط — یادداشت کنید |
| Cookie بدون HttpOnly/Secure (اگر هست) | بالا |
| XSS انعکاسی واضح روی فرم‌ها | بالا |
| Path/dir listing حساس | بالا |
| SQL injection با اطمینان بالا روی لایو | بسیار بالا — فوراً گزارش |
| هشدارهای informational صرف | پایین — لازم نیست همه را الان درست کنید |

یافته‌های مهم را پایین بنویسید:

1. _______________
2. _______________
3. _______________

---

# بخش ۵ — Burp Suite (اختیاری / پیشرفته‌تر)

فقط اگر با Burp راحت هستید.

### ۵.۱ Proxy لاگین ادمین

1. Burp → Proxy روی مرورگر
2. لاگین `admin` یا `ops`
3. درخواست `POST /api/admin/login` را ببینید
4. کوکی session را در پاسخ پیدا کنید

چک‌ها:

- [ ] پسورد در URL query نیست (باید در body باشد)
- [ ] بعد از لاگین، درخواست‌های `/api/admin/*` کوکی دارند
- [ ] درخواست `/api/admin/me` با کوکی معتبر `200` می‌دهد
- [ ] همان درخواست بعد از پاک کردن کوکی `401/403` می‌دهد

### ۵.۲ تلاش دسترسی ops به access از طریق Replay

1. با کوکی `ops` درخواست صفحه یا API مربوط به access را Replay کنید
2. **انتظار:** همچنان ممنوع

- [ ] OK
- [ ] FAIL
- [ ] SKIP

---

# بخش ۶ — IDOR سبک (اختیاری)

فقط اگر **دو حساب بیمار تست** دارید (نه استفاده از شماره واقعی دیگران).

مثال مفهومی از `TEST-MANUAL.md`:

1. با بیمار A لاگین کنید
2. یک consultation / booking از بیمار B را حدس نزنید کورکورانه؛ اگر ID واقعی B را از ادمین برای تست ساختید:
3. درخواست بیمار A به API مربوط به ID بیمار B باید `403` بدهد

نمونه‌های مسیر (بسته به وجود ID واقعی تست):

```text
GET /api/operations/consultations/{id-of-B}
GET /api/commerce/wallet?phone={phone-of-B}
```

**انتظار:** `403` — نه دادهٔ بیمار دیگر.

- [ ] OK
- [ ] FAIL
- [ ] SKIP (فقط یک بیمار تست دارید)

> اگر فقط `09126723365` دارید، این بخش را SKIP کنید. IDOR کامل را بعداً با دو شماره تست انجام دهید.

---

# بخش ۷ — چیزهایی که الان روی لایو انجام ندهید

- [ ] Full Active Scan بدون نظارت روی پروداکشن شلوغ
- [ ] Password spray / brute force روی `/admin/login`
- [ ] SQLMap سنگین روی همهٔ پارامترها
- [ ] آپلود بدافزار واقعی برای تست
- [ ] اجرای `reset-all` روی دیتابیس لایو
- [ ] حذف `DEV_OTP_*` قبل از اتمام Go-Live واقعی

---

# بخش ۸ — قبل از لانچ عمومی (یادآوری — نه همین دور)

وقتی خواستید سایت برای عموم باز شود:

1. `DEV_OTP_*` را از Runflare حذف کنید
2. `SESSION_SECRET` قوی تنظیم شود
3. SMS واقعی و درگاه پرداخت واقعی
4. یک دور دیگر ZAP + تست لاگین واقعی بدون کد `00000`
5. جزئیات: `backend-dev/GO-LIVE.md`

- [ ] هنوز نوبتش نیست (مرحله فعلی: staging)
- [ ] انجام شد

---

# قالب گزارش برای فرستادن به Cursor / تیم

```text
تاریخ/ساعت تست Kali: ……
هدف: https://pasteur.plus
نسخه/ابزار: ZAP …… | Burp …… | Kali ……

۲.۱ /api/admin/me بدون لاگین: HTTP … — OK/FAIL
۲.۲ admin bookings بدون لاگین: HTTP … — OK/FAIL
۲.۳ patients/wallets/club بدون لاگین: OK/FAIL
۲.۴ upload بدون لاگین: HTTP … — OK/FAIL
۲.۵ ریدایرکت /admin/*: OK/FAIL

۳.۱ ops → رزروها: OK/FAIL
۳.۲ ops → /admin/access ممنوع: OK/FAIL
۳.۳ content (اختیاری): OK/FAIL/SKIP

۴ ZAP: انجام شد / SKIP — مسیر گزارش: …
یافته‌های مهم ZAP:
1) …
2) …

۵ Burp: SKIP / خلاصه: …
۶ IDOR: SKIP / OK / FAIL — …

مشکلات بحرانی (اگر هست):
1) …
2) …
```

---

## مسیرهای مفید برای یادآوری

| مورد | URL |
|------|-----|
| سایت | `https://pasteur.plus` |
| لاگین بیمار | `/account` |
| لاگین ادمین | `/admin/login` |
| رزروها | `/admin/bookings` |
| سطح دسترسی | `/admin/access` |
| API منِ ادمین | `/api/admin/me` |
| API رزرو ادمین | `/api/admin/operations/bookings` |

---

## جمع‌بندی موفقیت این دور

اگر این‌ها سبز باشد، تست Kali سبک برای staging کافی است:

1. APIهای ادمین بدون لاگین باز نیستند  
2. `ops` به `/admin/access` راه ندارد  
3. ZAP باگ بحرانی واضح (XSS/SQLi مطمئن / نشت داده) گزارش نکرده یا موارد را ثبت کرده‌اید  

بعد از آن برگردید به تکمیل `MANUAL-SMOKE-CHECKLIST.md` اگر هنوز باز است، سپس برنامه‌ریزی Go-Live.
