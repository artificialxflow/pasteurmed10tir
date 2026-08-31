import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import type { DentalBasePath } from "./types";
import { isAppDental } from "./types";

type HubItem = {
  emoji: string;
  title: string;
  appTitle: string;
  desc: string;
  appDesc: string;
  href: (base: DentalBasePath) => string;
  vip?: boolean;
  amber?: boolean;
};

const HUB_ITEMS: HubItem[] = [
  {
    emoji: "👨‍⚕️",
    title: "عمومی",
    appTitle: "عمومی",
    desc: "لیست دندانپزشکان و رزرو نوبت",
    appDesc: "لیست دندانپزشکان و رزرو نوبت",
    href: (base) => `${base}/general`,
  },
  {
    emoji: "🔬",
    title: "تخصصی",
    appTitle: "تخصصی",
    desc: "خدمات تخصصی دندانپزشکی",
    appDesc: "خدمات تخصصی دندانپزشکی",
    href: (base) => `${base}/specialty`,
  },
  {
    emoji: "📚",
    title: "آموزش‌ها و نکات دندانپزشکی",
    appTitle: "آموزش‌ها",
    desc: "آموزش‌های بعد از خدمات دندانپزشکی برای بیماران",
    appDesc: "نکات بعد از درمان",
    href: (base) => `${base}/education`,
  },
  {
    emoji: "💎",
    title: "طرح‌های عضویتی",
    appTitle: "طرح‌های عضویت",
    desc: "عضویت عادی و VIP با مزایای ویژه",
    appDesc: "عادی و VIP",
    href: (base) => `${base}/membership`,
    vip: true,
  },
  {
    emoji: "🏢",
    title: "اعزام به مجموعه‌های طرف قرارداد",
    appTitle: "اعزام مجموعه",
    desc: "هماهنگی خدمات دندانپزشکی برای مجموعه‌ها و سازمان‌های طرف قرارداد",
    appDesc: "سازمان‌های طرف قرارداد",
    href: (base) =>
      isAppDental(base)
        ? `${ROUTES.app.consultation}?category=dental-corporate`
        : `${ROUTES.web.consultation}?category=dental-corporate`,
    amber: true,
  },
];

export function DentalHub({ basePath }: { basePath: DentalBasePath }) {
  const app = isAppDental(basePath);

  if (app) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-cyan-50 to-white p-4">
          <p className="text-xs font-bold text-teal-700">بخش تخصصی</p>
          <p className="mt-1 text-base font-extrabold text-slate-900">🦷 بخش دندانپزشکی</p>
          <p className="mt-1 text-sm text-slate-600">
            یکی از بخش‌های زیر را انتخاب کنید — رزرو، تخصص و عضویت
          </p>
        </section>
        <div className="grid grid-cols-2 gap-3">
          {HUB_ITEMS.map((item) => (
            <Link
              key={item.href(basePath)}
              href={item.href(basePath)}
              className="rounded-2xl border border-sky-200 bg-white p-3 shadow-sm transition hover:border-teal-500"
              style={
                item.vip
                  ? { background: "linear-gradient(145deg,#fff7ed,#fff)" }
                  : undefined
              }
            >
              <span className="text-2xl">{item.emoji}</span>
              <p className="mt-2 text-sm font-bold text-slate-900">{item.appTitle}</p>
              <p className="mt-1 text-xs text-slate-500">{item.appDesc}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500" aria-label="مسیر">
        <Link href={ROUTES.web.home} className="hover:text-teal-700">
          صفحه اصلی
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">دندانپزشکی</span>
      </nav>
      <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">🦷 بخش دندانپزشکی</h1>
      <p className="mb-8 text-slate-600">یکی از بخش‌های زیر را انتخاب کنید</p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {HUB_ITEMS.map((item) => (
          <Link key={item.href(basePath)} href={item.href(basePath)}>
            <Card
              className={
                item.amber
                  ? "h-full p-6 hover:border-amber-500"
                  : "h-full p-6 hover:border-teal-500"
              }
            >
              <span className="text-3xl">{item.emoji}</span>
              <h2 className="mt-3 text-lg font-bold">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
