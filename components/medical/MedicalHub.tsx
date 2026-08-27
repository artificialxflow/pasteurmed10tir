import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type MedicalBasePath = "/medical" | "/app/medical";

function isAppMedical(basePath: MedicalBasePath): boolean {
  return basePath.startsWith("/app");
}

export function MedicalHub({ basePath }: { basePath: MedicalBasePath }) {
  const app = isAppMedical(basePath);
  const consultation = app ? ROUTES.app.consultation : ROUTES.web.consultation;
  const specialty = app ? ROUTES.app.medicalSpecialty : ROUTES.web.medicalSpecialty;
  const doctors = app ? ROUTES.app.medicalDoctors : ROUTES.web.medicalDoctors;

  const items = [
    {
      emoji: "👨‍⚕️",
      title: "پزشکی عمومی",
      desc: "پزشک عمومی را انتخاب کنید و روز و ساعت ویزیت (هر نوبت ۱۵ دقیقه) را رزرو کنید.",
      cta: "انتخاب پزشک و نوبت",
      href: `${doctors}?scope=general`,
      accent: false,
    },
    {
      emoji: "🔬",
      title: "تخصص‌ها",
      desc: "تخصص و پزشک را انتخاب کنید؛ سپس نوبت ویزیت ۱۵ دقیقه‌ای ثبت کنید.",
      cta: "درخواست ویزیت تخصصی",
      href: specialty,
      accent: true,
    },
    {
      emoji: "🏠",
      title: "ویزیت در منزل",
      desc: "هماهنگی ویزیت پزشک در منزل پس از تماس کارشناس.",
      cta: "درخواست ویزیت منزل",
      href: `${consultation}?category=medical-home&type=phone`,
      accent: false,
    },
  ];

  if (app) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">مسیر پزشکی مورد نیاز را انتخاب کنید</p>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-2xl border border-sky-200 bg-white p-4 transition hover:border-teal-500"
          >
            <span className="text-2xl">{item.emoji}</span>
            <p className="mt-2 text-sm font-bold text-slate-900">{item.title}</p>
            <p className="mt-1 text-xs text-slate-500">{item.cta}</p>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">🩺 بخش پزشکی</h1>
      <p className="mb-8 text-slate-600">
        ابتدا مسیر پزشکی مورد نیاز را انتخاب کنید؛ سپس نوع مشاوره یا ویزیت در مرحله بعدی مشخص
        می‌شود.
      </p>
      <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full p-6">
              <span className="text-4xl">{item.emoji}</span>
              <h2 className="mt-3 text-lg font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              <span
                className={cn(
                  "mt-5 inline-flex rounded-full px-4 py-2 text-sm font-bold text-white",
                  item.accent
                    ? "bg-gradient-to-br from-amber-400 to-amber-700"
                    : "bg-gradient-to-br from-cyan-500 to-cyan-900",
                )}
              >
                {item.cta}
              </span>
            </Card>
          </Link>
        ))}
      </section>
      <section>
        <Card hover={false} className="bg-white p-6">
          <h2 className="mb-3 text-lg font-bold text-slate-900">روش انجام مشاوره و ویزیت</h2>
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "۱. انتخاب عمومی، تخصصی یا ویزیت در منزل",
              "۲. انتخاب و معرفی پزشک (مثل دندانپزشکی)",
              "۳. انتخاب روز و نوبت ۱۵ دقیقه‌ای ویزیت",
              "۴. ثبت اطلاعات و پرداخت / هماهنگی نهایی",
            ].map((step) => (
              <div
                key={step}
                className="rounded-xl border border-cyan-100 bg-cyan-50 p-4"
              >
                {step}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
