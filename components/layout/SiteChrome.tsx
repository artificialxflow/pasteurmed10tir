"use client";

import { Logo } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PASTEUR_DATA } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: ROUTES.web.home, label: "صفحه اصلی", id: "home" },
  { href: ROUTES.web.shop, label: "تجهیزات", id: "shop" },
  { href: ROUTES.web.gallery, label: "گالری", id: "gallery" },
  { href: ROUTES.web.club, label: "باشگاه", id: "club" },
  { href: ROUTES.web.dental, label: "دندانپزشکی", id: "dental" },
  { href: ROUTES.web.consultation, label: "مشاوره و ویزیت", id: "consultation" },
  { href: ROUTES.web.contact, label: "تماس با ما", id: "contact" },
  { href: ROUTES.web.partners, label: "همکاری", id: "partners" },
  { href: ROUTES.admin.login, label: "پنل ادمین", id: "admin" },
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
  if (pathname.startsWith("/gallery")) return "gallery";
  if (pathname.startsWith("/contact")) return "contact";
  if (pathname.startsWith("/partners")) return "partners";
  if (pathname.startsWith("/admin")) return "admin";
  return "";
}

export function SiteHeader() {
  const pathname = usePathname();
  const active = activeId(pathname);
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-cyan-100 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link href={ROUTES.web.home} className="flex min-w-0 items-center gap-3">
            <Logo />
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold leading-tight text-slate-900 sm:text-lg">
                {PASTEUR_DATA.institute.nameFa}
              </p>
              <p className="hidden truncate text-xs text-slate-500 sm:block">سامانه خدمات مرکز پاستور</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-slate-100 bg-slate-50/80 p-1 md:flex" aria-label="منوی اصلی">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-bold transition-colors lg:text-sm",
                  active === item.id
                    ? "border border-cyan-300 bg-cyan-100 text-cyan-800"
                    : "text-slate-600 hover:bg-white hover:text-cyan-700",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Button href={ROUTES.web.shopVip} variant="accent" className="hidden shrink-0 py-2 text-sm sm:inline-flex">
            💎 VIP تجهیزات
          </Button>

          <button
            type="button"
            className="rounded-xl border border-cyan-200 bg-white/80 p-2 text-slate-700 md:hidden"
            aria-label="باز کردن منو"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
        {open ? (
          <nav className="flex flex-col gap-1 border-t border-cyan-50 px-4 py-3 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-bold",
                  active === item.id ? "bg-cyan-50 text-cyan-800" : "text-slate-700",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

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
          <div className="mb-4 flex items-center gap-3">
            <Logo />
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
            <Link href={ROUTES.web.partners}>درخواست همکاری</Link>
          </div>
        </div>
        <div>
          <p className="mb-3 font-bold text-slate-900">تماس</p>
          <p className="text-sm leading-7 text-slate-600">{institute.address}</p>
          <p className="mt-2 text-sm font-bold text-primary-dark">
            <a href={`tel:${institute.phoneDigits}`}>{institute.phone}</a>
          </p>
          <Link href={ROUTES.web.privacy} className="mt-3 inline-block text-xs text-slate-500 underline">
            حریم خصوصی
          </Link>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
        © پاستور پلاس — pasteur.plus
      </div>
    </footer>
  );
}
