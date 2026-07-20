"use client";

import { PasteurStorage } from "@/lib/storage";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const links = [
  { href: ROUTES.admin.dashboard, label: "داشبورد" },
  { href: ROUTES.admin.bookings, label: "رزروها" },
  { href: ROUTES.admin.consultations, label: "مشاوره‌ها" },
  { href: ROUTES.admin.reminders, label: "یادآورها" },
  { href: ROUTES.admin.services, label: "سرویس‌ها" },
  { href: ROUTES.admin.club, label: "باشگاه" },
  { href: ROUTES.admin.gallery, label: "گالری" },
  { href: ROUTES.admin.visitors, label: "ویزیتورها" },
  { href: ROUTES.admin.commissions, label: "پورسانت‌ها" },
  { href: ROUTES.admin.facilities, label: "تسهیلات" },
  { href: ROUTES.admin.partners, label: "همکاری‌ها" },
  { href: ROUTES.admin.doctors, label: "پزشکان" },
  { href: ROUTES.admin.memberships, label: "عضویت‌ها" },
  { href: ROUTES.admin.shop, label: "فروشگاه" },
];

function titleFromPath(pathname: string) {
  const match = links.find((l) => l.href === pathname);
  if (match) {
    const map: Record<string, string> = {
      [ROUTES.admin.dashboard]: "داشبورد آمار",
      [ROUTES.admin.bookings]: "مدیریت رزروها",
      [ROUTES.admin.consultations]: "درخواست‌های مشاوره و ویزیت",
      [ROUTES.admin.reminders]: "یادآورهای هوشمند",
      [ROUTES.admin.services]: "مدیریت سرویس‌ها",
      [ROUTES.admin.club]: "باشگاه مشتریان",
      [ROUTES.admin.gallery]: "مدیریت گالری نتایج",
      [ROUTES.admin.visitors]: "مدیریت ویزیتورها و کد معرف",
      [ROUTES.admin.commissions]: "گزارش پورسانت ویزیتورها",
      [ROUTES.admin.facilities]: "درخواست‌های تسهیلات تجهیزات",
      [ROUTES.admin.partners]: "درخواست‌های همکاری",
      [ROUTES.admin.doctors]: "مدیریت پزشکان",
      [ROUTES.admin.memberships]: "مدیریت عضویت",
      [ROUTES.admin.shop]: "مدیریت فروشگاه",
    };
    return map[match.href] || match.label;
  }
  return "پنل ادمین";
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
  const [ready, setReady] = useState(false);
  const heading = title || titleFromPath(pathname);

  useEffect(() => {
    if (!PasteurStorage.isAdminLoggedIn()) {
      router.replace(ROUTES.admin.login);
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        در حال بررسی ورود...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 border-l border-slate-200 bg-white p-4 lg:block">
        <p className="mb-4 text-lg font-extrabold text-primary-dark">پنل ادمین</p>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-xl px-3 py-2 text-sm font-bold ${
                pathname === l.href
                  ? "bg-cyan-50 text-cyan-800"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="mt-6 w-full rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-700"
          onClick={() => {
            PasteurStorage.adminLogout();
            router.push(ROUTES.admin.login);
          }}
        >
          خروج
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-4">
          <h1 className="text-xl font-extrabold text-slate-900">{heading}</h1>
          <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="shrink-0 rounded-full border bg-slate-50 px-3 py-1 text-xs font-bold"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
