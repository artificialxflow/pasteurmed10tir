"use client";

import { AppShell } from "@/components/app/AppShell";
import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import Link from "next/link";
import { useEffect } from "react";

const services = [
  { emoji: "🦷", title: "دندانپزشکی", desc: "رزرو نوبت", href: ROUTES.app.dental },
  { emoji: "🩺", title: "پزشکی", desc: "مشاوره و ویزیت", href: ROUTES.app.medical },
  { emoji: "👩‍⚕️", title: "پرستاری", desc: "خدمات در منزل", href: ROUTES.app.nursing },
  { emoji: "✨", title: "لیزر و زیبایی", desc: "لیزر و جوانسازی", href: ROUTES.app.laser },
  { emoji: "🛒", title: "تجهیزات", desc: "فروشگاه", href: ROUTES.app.shop },
  { emoji: "🎁", title: "باشگاه", desc: "امتیاز و پاداش", href: ROUTES.app.club },
  { emoji: "💳", title: "کیف اعتبار", desc: "سقف و بازپرداخت", href: ROUTES.app.wallet },
];

const quick = [
  { emoji: "💬", title: "مشاوره و ویزیت", href: ROUTES.app.consultation },
  { emoji: "🔔", title: "یادآور نوبت", href: ROUTES.app.reminders },
  { emoji: "🖼️", title: "گالری نتایج", href: ROUTES.app.gallery },
  { emoji: "📞", title: "تماس با ما", href: ROUTES.app.contact },
  { emoji: "🤝", title: "درخواست همکاری", href: ROUTES.app.partners },
];

function AppTile({
  emoji,
  title,
  desc,
  href,
}: {
  emoji: string;
  title: string;
  desc?: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full p-4">
        <span className="text-2xl">{emoji}</span>
        <p className="mt-2 text-sm font-bold text-slate-900">{title}</p>
        {desc ? <p className="mt-1 text-xs text-slate-500">{desc}</p> : null}
      </Card>
    </Link>
  );
}

export default function AppHomePage() {
  useEffect(() => {
    PasteurStorage.setAppView("app");
  }, []);

  return (
    <AppShell title="پاستور پلاس" showNav>
      <section className="mb-4 rounded-2xl border border-cyan-200 bg-gradient-to-bl from-cyan-50 to-amber-50 p-4">
        <p className="text-xs font-bold text-cyan-800">خوش آمدید</p>
        <p className="mt-1 text-lg font-extrabold text-slate-950">پاستور پلاس</p>
        <p className="mt-1 text-xs leading-6 text-slate-600">
          دندانپزشکی، پزشکی، پرستاری و تجهیزات در یک اپ
        </p>
      </section>

      <p className="mb-3 text-sm font-extrabold text-slate-900">خدمات اصلی</p>
      <div className="mb-5 grid grid-cols-2 gap-3">
        {services.map((s) => (
          <AppTile key={s.href} {...s} />
        ))}
      </div>

      <p className="mb-3 text-sm font-extrabold text-slate-900">دسترسی سریع</p>
      <div className="mb-4 grid grid-cols-1 gap-2">
        {quick.map((q) => (
          <AppTile key={q.href} {...q} />
        ))}
      </div>

      <Link
        href={ROUTES.web.home}
        className="mt-2 block text-center text-sm font-bold text-cyan-700 underline-offset-4 hover:underline"
        onClick={() => PasteurStorage.setAppView("web")}
      >
        بازگشت به نسخه وب
      </Link>
    </AppShell>
  );
}
