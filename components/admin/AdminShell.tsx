"use client";

import { Logo } from "@/components/ui/Card";
import {
  firstAllowedAdminPath,
  hasPermission,
  permissionForPath,
  type AdminPermission,
  type AdminSession,
} from "@/lib/adminAccess";
import { PasteurStorage } from "@/lib/storage";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type NavItem = { href: string; label: string; permission: AdminPermission };

type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    title: "عملیات",
    items: [
      { href: ROUTES.admin.dashboard, label: "داشبورد", permission: "dashboard" },
      { href: ROUTES.admin.bookings, label: "رزروها", permission: "bookings" },
      { href: ROUTES.admin.consultations, label: "مشاوره‌ها", permission: "consultations" },
      { href: ROUTES.admin.patients, label: "تأیید کاربری", permission: "patients" },
      { href: ROUTES.admin.reminders, label: "یادآورها", permission: "reminders" },
    ],
  },
  {
    title: "محتوا و خدمات",
    items: [
      { href: ROUTES.admin.services, label: "سرویس‌ها", permission: "services" },
      { href: ROUTES.admin.laserServices, label: "لیزر", permission: "laserServices" },
      { href: ROUTES.admin.nursingServices, label: "پرستاری", permission: "nursingServices" },
      { href: ROUTES.admin.doctors, label: "پزشکان", permission: "doctors" },
      { href: ROUTES.admin.consultationPrices, label: "قیمت مشاوره", permission: "consultationPrices" },
      { href: ROUTES.admin.gallery, label: "گالری", permission: "gallery" },
    ],
  },
  {
    title: "مالی",
    items: [
      { href: ROUTES.admin.memberships, label: "عضویت‌ها", permission: "memberships" },
      { href: ROUTES.admin.wallets, label: "کیف اعتبار", permission: "wallets" },
      { href: ROUTES.admin.shop, label: "فروشگاه", permission: "shop" },
      { href: ROUTES.admin.commissions, label: "پورسانت‌ها", permission: "commissions" },
      { href: ROUTES.admin.facilities, label: "تسهیلات", permission: "facilities" },
      { href: ROUTES.admin.insurances, label: "بیمه‌ها و استعلام", permission: "insurances" },
      { href: ROUTES.admin.installments, label: "اقساط", permission: "installments" },
    ],
  },
  {
    title: "رشد و همکاری",
    items: [
      { href: ROUTES.admin.club, label: "باشگاه", permission: "club" },
      { href: ROUTES.admin.visitors, label: "ویزیتورها", permission: "visitors" },
      { href: ROUTES.admin.partners, label: "همکاری‌ها", permission: "partners" },
      { href: ROUTES.admin.reviews, label: "نظرات", permission: "reviews" },
      { href: ROUTES.admin.complaints, label: "شکایات", permission: "complaints" },
      { href: ROUTES.admin.help, label: "آموزش", permission: "help" },
    ],
  },
  {
    title: "امنیت",
    items: [{ href: ROUTES.admin.access, label: "سطح دسترسی", permission: "access" }],
  },
];

const titles: Record<string, string> = {
  [ROUTES.admin.dashboard]: "داشبورد آمار",
  [ROUTES.admin.bookings]: "مدیریت رزروها",
  [ROUTES.admin.consultations]: "درخواست‌های مشاوره و ویزیت",
  [ROUTES.admin.reminders]: "یادآورهای هوشمند",
  [ROUTES.admin.services]: "مدیریت سرویس‌ها",
  [ROUTES.admin.laserServices]: "مدیریت خدمات لیزر",
  [ROUTES.admin.nursingServices]: "مدیریت خدمات پرستاری",
  [ROUTES.admin.club]: "باشگاه مشتریان",
  [ROUTES.admin.gallery]: "مدیریت گالری نتایج",
  [ROUTES.admin.visitors]: "مدیریت ویزیتورها و کد معرف",
  [ROUTES.admin.commissions]: "گزارش پورسانت ویزیتورها",
  [ROUTES.admin.facilities]: "درخواست‌های تسهیلات تجهیزات",
  [ROUTES.admin.partners]: "درخواست‌های همکاری",
  [ROUTES.admin.doctors]: "مدیریت پزشکان",
  [ROUTES.admin.memberships]: "مدیریت عضویت",
  [ROUTES.admin.consultationPrices]: "قیمت مشاوره و تعرفه تخصصی",
  [ROUTES.admin.wallets]: "مدیریت کیف اعتبار",
  [ROUTES.admin.shop]: "مدیریت فروشگاه",
  [ROUTES.admin.access]: "مدیریت سطح دسترسی",
  [ROUTES.admin.insurances]: "بیمه‌ها و استعلام",
  [ROUTES.admin.reviews]: "نظرات پزشکان",
  [ROUTES.admin.complaints]: "شکایات بیماران",
  [ROUTES.admin.help]: "آموزش سامانه",
  [ROUTES.admin.installments]: "اقساط کاربران",
  [ROUTES.admin.patients]: "تأیید کاربری و فرانشیز",
};

function titleFromPath(pathname: string) {
  return titles[pathname] || "پنل ادمین";
}

function NavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const active = pathname === item.href;
  return (
    <Link
      href={item.href}
      className={cn(
        "block rounded-xl px-3 py-2 text-sm font-bold transition-colors",
        active
          ? "bg-cyan-600 text-white shadow-sm shadow-cyan-900/15"
          : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-900",
      )}
    >
      {item.label}
    </Link>
  );
}

export function AdminShell({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);
  const heading = title || titleFromPath(pathname);

  const visibleGroups = useMemo(() => {
    const permissions = session?.permissions || [];
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => hasPermission(permissions, item.permission)),
      }))
      .filter((group) => group.items.length > 0);
  }, [session]);

  const flatLinks = useMemo(
    () => visibleGroups.flatMap((group) => group.items),
    [visibleGroups],
  );

  useEffect(() => {
    PasteurStorage.initAdminAccessIfNeeded();
    const current = PasteurStorage.getAdminSession();
    if (!current) {
      router.replace(ROUTES.admin.login);
      return;
    }

    const needed = permissionForPath(pathname);
    if (needed && !hasPermission(current.permissions, needed)) {
      router.replace(firstAllowedAdminPath(current.permissions));
      return;
    }

    setSession(current);
    setReady(true);
  }, [router, pathname]);

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        در حال بررسی ورود...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,#f0f9fb_0%,#f1f5f9_40%,#f8fafc_100%)]">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-l border-cyan-100/80 bg-white/95 shadow-[_-8px_0_40px_-28px_rgb(8_145_178_/_0.35)] backdrop-blur lg:flex">
        <div className="border-b border-cyan-50 px-5 py-5">
          <div className="flex items-center gap-3">
            <Logo className="h-12 w-auto max-w-[9rem]" />
            <div>
              <p className="text-base font-extrabold text-slate-900">پاستور پلاس</p>
              <p className="text-xs font-bold text-cyan-800">پنل مدیریت</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/70 px-3 py-2">
            <p className="text-sm font-extrabold text-slate-900">{session.displayName}</p>
            <p className="text-xs font-bold text-cyan-800">{session.roleName}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 px-3 text-[11px] font-extrabold tracking-wide text-slate-400">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-cyan-50 p-4">
          <Link
            href={ROUTES.web.home}
            className="mb-2 block rounded-xl px-3 py-2 text-center text-xs font-bold text-cyan-800 hover:bg-cyan-50"
          >
            مشاهده سایت
          </Link>
          <button
            type="button"
            className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50"
            onClick={() => {
              PasteurStorage.adminLogout();
              router.push(ROUTES.admin.login);
            }}
          >
            خروج
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-cyan-100/80 bg-white/90 px-4 py-4 backdrop-blur-md sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-cyan-700 lg:hidden">
                {session.displayName} · {session.roleName}
              </p>
              <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{heading}</h1>
            </div>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800">
              دسترسی بر اساس نقش (mock)
            </span>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {flatLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                  pathname === l.href
                    ? "border-cyan-600 bg-cyan-600 text-white"
                    : "border-slate-200 bg-white text-slate-600",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
