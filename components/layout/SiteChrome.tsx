"use client";

import { Logo } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

const navItems = [
  { href: ROUTES.web.home, label: "خانه", id: "home" },
  { href: ROUTES.web.shop, label: "تجهیزات", id: "shop" },
  { href: ROUTES.web.gallery, label: "گالری", id: "gallery" },
  { href: ROUTES.web.club, label: "باشگاه", id: "club" },
  { href: ROUTES.web.dental, label: "دندانپزشکی", id: "dental" },
  { href: ROUTES.web.consultation, label: "مشاوره", id: "consultation" },
  { href: ROUTES.web.account, label: "کاربری", id: "account" },
  { href: ROUTES.web.help, label: "آموزش", id: "help" },
  { href: ROUTES.web.contact, label: "تماس", id: "contact" },
  { href: ROUTES.web.partners, label: "همکاری", id: "partners" },
];

const bottomNav = [
  { href: ROUTES.web.home, label: "خانه", icon: "🏠", id: "home" },
  { href: ROUTES.web.dentalGeneral, label: "رزرو", icon: "🦷", id: "dental" },
  { href: ROUTES.web.shop, label: "تجهیزات", icon: "🛒", id: "shop" },
  { href: ROUTES.web.club, label: "باشگاه", icon: "🎁", id: "club" },
  { href: ROUTES.web.consultation, label: "مشاوره", icon: "💬", id: "consultation" },
];

function activeId(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/dental")) return "dental";
  if (pathname.startsWith("/shop")) return "shop";
  if (pathname.startsWith("/club")) return "club";
  if (pathname.startsWith("/consultation")) return "consultation";
  if (pathname.startsWith("/account")) return "account";
  if (pathname.startsWith("/help")) return "help";
  if (pathname.startsWith("/gallery")) return "gallery";
  if (pathname.startsWith("/contact")) return "contact";
  if (pathname.startsWith("/partners")) return "partners";
  return "";
}

export function SiteHeader() {
  const pathname = usePathname();
  const active = activeId(pathname);
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-[70] border-b border-cyan-100 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-3 sm:h-24 sm:gap-4 sm:px-6 lg:px-8">
          <Link href={ROUTES.web.home} className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Logo className="h-11 w-auto max-w-[7.5rem] sm:h-14 sm:max-w-[11rem]" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-base font-extrabold leading-tight text-slate-900 sm:text-lg">
                {PASTEUR_DATA.institute.nameFa}
              </p>
              <p className="hidden truncate text-xs text-slate-500 md:block">سامانه خدمات مرکز پاستور</p>
            </div>
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center justify-end lg:flex"
            aria-label="منوی اصلی"
          >
            <div className="flex max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto rounded-full border border-cyan-100/80 bg-gradient-to-l from-slate-50 to-cyan-50/50 p-1 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.8)]">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "shrink-0 rounded-full px-2 py-1.5 text-[0.7rem] font-bold tracking-tight transition-all xl:px-2.5 xl:text-xs 2xl:px-3 2xl:text-sm",
                    active === item.id
                      ? "border border-cyan-300 bg-white text-cyan-900 shadow-sm shadow-cyan-900/10"
                      : "text-slate-600 hover:bg-white/90 hover:text-cyan-800",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <button
            type="button"
            className="shrink-0 rounded-xl border border-cyan-200 bg-white/90 px-3 py-2 text-base font-bold text-slate-700 lg:hidden"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* Mobile overlay menu — only below lg; does not push page content */}
      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
            aria-label="بستن منو"
            onClick={() => setOpen(false)}
          />
          <nav
            id={menuId}
            aria-label="منوی موبایل"
            className="absolute inset-x-0 top-[4.25rem] max-h-[min(calc(85dvh-4.25rem),32rem)] overflow-y-auto border-b border-cyan-100 bg-white px-3 py-3 shadow-xl sm:top-24 sm:max-h-[min(calc(85dvh-6rem),34rem)] animate-[appEnter_0.18s_ease]"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-3 text-sm font-bold transition-colors",
                    active === item.id
                      ? "bg-cyan-50 text-cyan-800"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      ) : null}

      <nav className="mobile-bottom-nav" aria-label="ناوبری موبایل">
        {bottomNav.map((item) => (
          <Link key={item.id} href={item.href} className={active === item.id ? "active" : ""}>
            <span className="text-lg" aria-hidden>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

export function SiteFooter() {
  const { institute } = PASTEUR_DATA;
  return (
    <footer className="mt-auto border-t-2 border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-3 sm:gap-4">
            <Logo className="h-12 w-auto max-w-[10rem]" />
            <div>
              <p className="font-bold text-slate-900">{institute.nameFa}</p>
              <p className="text-xs text-slate-500">{institute.nameEn}</p>
            </div>
          </div>
          <p className="text-sm leading-7 text-slate-600">{institute.subtitle}</p>
        </div>
        <div>
          <p className="mb-3 font-bold text-slate-900">دسترسی سریع</p>
          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <Link href={ROUTES.web.dental}>دندانپزشکی</Link>
            <Link href={ROUTES.web.medical}>پزشکی</Link>
            <Link href={ROUTES.web.shop}>فروشگاه</Link>
            <Link href={ROUTES.web.club}>باشگاه</Link>
            <Link href={ROUTES.web.account}>پنل کاربری</Link>
            <Link href={ROUTES.web.help}>آموزش سامانه</Link>
            <Link href={ROUTES.web.complaints}>شکایات</Link>
            <Link href={ROUTES.web.partners}>درخواست همکاری</Link>
          </div>
        </div>
        <div>
          <p className="mb-3 font-bold text-slate-900">تماس</p>
          <p className="text-sm leading-7 text-slate-600">{institute.address}</p>
          <a
            href={institute.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs font-bold text-cyan-800 underline-offset-4 hover:underline"
          >
            موقعیت روی گوگل‌مپ
          </a>
          <p className="mt-2 text-sm font-bold text-primary-dark">
            <a href={`tel:${institute.phoneDigits}`}>{institute.phone}</a>
          </p>
          <Link href={ROUTES.web.privacy} className="mt-3 inline-block text-xs text-slate-500 underline">
            حریم خصوصی
          </Link>
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6">
          <p className="order-2 text-center text-xs text-slate-500 sm:order-1 sm:text-right">
            © پاستور پلاس — pasteur.plus
          </p>
          {/* اینماد: بدون rel=noopener/noreferrer طبق راهنمای enamad */}
          <a
            referrerPolicy="origin"
            target="_blank"
            href="https://trustseal.enamad.ir/?id=770078&Code=xt2h10Wh3qSFB90zBOrIUnSfOJ5MhY3l"
            className="order-1 inline-flex shrink-0 items-center justify-center sm:order-2"
            title="نماد اعتماد الکترونیکی"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- اینماد الزام به img رسمی خود دارد */}
            <img
              referrerPolicy="origin"
              src="https://trustseal.enamad.ir/logo.aspx?id=770078&Code=xt2h10Wh3qSFB90zBOrIUnSfOJ5MhY3l"
              alt="نماد اعتماد الکترونیکی"
              className="h-14 w-auto cursor-pointer sm:h-16"
              style={{ cursor: "pointer" }}
              {...{ code: "xt2h10Wh3qSFB90zBOrIUnSfOJ5MhY3l" }}
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
