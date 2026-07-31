"use client";

import { Logo } from "@/components/ui/Card";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const nav = [
  { href: ROUTES.app.home, label: "خانه", icon: "🏠", match: (p: string) => p === "/app" || p === "/app/" },
  { href: ROUTES.app.dentalGeneral, label: "رزرو", icon: "🦷", match: (p: string) => p.includes("/dental") },
  { href: ROUTES.app.shop, label: "تجهیزات", icon: "🛒", match: (p: string) => p.includes("/shop") },
  { href: ROUTES.app.consultation, label: "مشاوره", icon: "💬", match: (p: string) => p.includes("/consultation") },
  {
    href: ROUTES.app.account,
    label: "کاربری",
    icon: "👤",
    match: (p: string) =>
      p.includes("/account") || p.includes("/installments") || p.includes("/complaints") || p.includes("/help"),
  },
];

export function AppShell({
  title,
  backHref,
  showNav = true,
  children,
}: {
  title: string;
  backHref?: string | null;
  showNav?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.add("app-body");
    return () => document.body.classList.remove("app-body");
  }, []);

  return (
    <div className="app-device app-page-enter">
      <div className="flex items-center justify-between bg-slate-950 px-4 py-1.5 text-[0.65rem] text-slate-300">
        <span>پاستور پلاس</span>
        <span>●●●</span>
      </div>
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
        {backHref ? (
          <Link href={backHref} className="rounded-lg border border-slate-200 px-2 py-1 text-sm font-bold text-slate-700">
            ←
          </Link>
        ) : (
          <Logo className="h-8 w-8" />
        )}
        <h1 className="flex-1 text-center text-sm font-extrabold text-slate-900">{title}</h1>
        <Logo className="h-8 w-8" />
      </header>
      <main className={cn("flex-1 overflow-y-auto px-4 py-4", showNav ? "pb-24" : "pb-4")}>{children}</main>
      {showNav ? (
        <nav className="absolute inset-x-3 bottom-3 z-40 grid h-[var(--app-nav-height)] grid-cols-5 gap-1 rounded-[1.35rem] border border-slate-200 bg-white/97 p-1.5 shadow-lg">
          {nav.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl text-[0.62rem] font-bold",
                  active ? "bg-cyan-50 text-primary-dark" : "text-slate-500",
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
