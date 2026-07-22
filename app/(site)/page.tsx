"use client";

import { Button } from "@/components/ui/Button";
import { Card, Logo } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage, type ServiceItem } from "@/lib/storage";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

const colorBorder: Record<string, string> = {
  teal: "border-teal-300 hover:border-teal-500 group-hover:bg-teal-50",
  blue: "border-blue-300 hover:border-blue-500 group-hover:bg-blue-50",
  rose: "border-rose-300 hover:border-rose-500 group-hover:bg-rose-50",
  purple: "border-purple-300 hover:border-purple-500 group-hover:bg-purple-50",
  amber: "border-amber-300 hover:border-amber-500 group-hover:bg-amber-50",
};

function markAppView() {
  PasteurStorage.setAppView("app");
}

export default function HomePage() {
  const [services, setServices] = useState<ServiceItem[]>(
    PASTEUR_DATA.services.map((s) => ({ ...s, active: true })),
  );

  useEffect(() => {
    PasteurStorage.initServicesIfNeeded();
    setServices(PasteurStorage.getServices().filter((s) => s.active !== false));
  }, []);

  const quickIds = ["dental", "medical", "nursing", "shop"];
  const quickServices = quickIds
    .map((id) => services.find((s) => s.id === id))
    .filter(Boolean) as ServiceItem[];

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-cyan-100">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 30%, #a5f3fc 0%, transparent 26rem), radial-gradient(circle at 86% 10%, #fde68a 0%, transparent 22rem), linear-gradient(135deg, #f8fdff 0%, #ecfeff 48%, #fff7ed 100%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-bold text-cyan-800 shadow-sm">
                <Logo className="h-7 w-7" />
                پاستور پلاس — سامانه خدمات مرکز پاستور
              </span>
              <h1 className="mb-4 text-3xl font-extrabold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                دندانپزشکی، پزشکی، پرستاری و تجهیزات پزشکی در یک سامانه
              </h1>
              <p className="mb-8 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-xl">
                از اینجا مسیر مورد نیازتان را انتخاب کنید: رزرو دندانپزشکی، مشاوره و ویزیت
                آنلاین پزشکی، خدمات پرستاری، آموزش‌های دندانپزشکی و فروشگاه تجهیزات.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button href={ROUTES.web.dentalGeneral} className="px-6 text-base">
                  🦷 دندانپزشکی و رزرو نوبت
                </Button>
                <Button href={ROUTES.web.medical} variant="accent" className="px-6 text-base">
                  🩺 پزشکی و ویزیت آنلاین
                </Button>
                <Button
                  href={ROUTES.app.home}
                  variant="outline"
                  className="px-6 text-base"
                  onClick={markAppView}
                >
                  📱 ورود به نسخه موبایل
                </Button>
              </div>
              <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {quickServices.map((service) => (
                  <Link key={service.id} href={service.href}>
                    <Card className="p-3 text-center hover:border-teal-500">
                      <p className="text-xl font-extrabold text-cyan-700">{service.emoji || "•"}</p>
                      <p className="text-xs font-bold text-slate-600">{service.title}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden justify-center lg:flex">
              <Link
                href={ROUTES.app.home}
                onClick={markAppView}
                className="block transition-transform hover:scale-[1.02]"
                aria-label="ورود به نسخه موبایل اپ"
              >
                <div className="w-[330px] overflow-hidden rounded-[1.75rem] border border-slate-800 bg-white shadow-2xl">
                  <div className="flex h-7 items-center justify-center bg-slate-950">
                    <span className="h-1 w-16 rounded-full bg-slate-700" />
                  </div>
                  <div className="bg-gradient-to-b from-cyan-50 to-white p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500">خوش آمدید</p>
                        <p className="font-extrabold text-slate-900">پاستور پلاس</p>
                      </div>
                      <Logo className="h-12 w-12" />
                    </div>
                    <Card vip className="mb-4 rounded-2xl p-4">
                      <p className="text-sm font-bold text-cyan-800">مسیرهای خدمات مرکز</p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-900">انتخاب سریع خدمت</p>
                      <p className="mt-2 text-xs text-slate-500">
                        دندانپزشکی، پزشکی، پرستاری و تجهیزات
                      </p>
                    </Card>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { emoji: "🦷", label: "رزرو دندان" },
                        { emoji: "🛒", label: "تجهیزات" },
                        { emoji: "💬", label: "مشاوره" },
                        { emoji: "🎁", label: "باشگاه" },
                      ].map((tile) => (
                        <Card key={tile.label} className="p-4 text-center">
                          <span className="text-2xl">{tile.emoji}</span>
                          <p className="mt-2 text-xs font-bold">{tile.label}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-12 sm:py-16" aria-labelledby="services-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 id="services-heading" className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              مسیرهای اصلی پاستور پلاس
            </h2>
            <p className="mx-auto max-w-xl text-slate-600">
              خدمات اصلی با طراحی سریع، شفاف و مناسب موبایل
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {services.map((service, index) => (
              <Link
                key={service.id}
                href={service.href}
                className="group relative block overflow-hidden rounded-[1.25rem] border border-sky-300/45 bg-white shadow-[0_18px_45px_-28px_rgb(8_145_178_/_0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-32px_rgb(8_145_178_/_0.65)]"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="absolute top-3 left-3 z-10 rounded-full border border-white bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                  پاستور پلاس
                </div>
                <div className="relative h-40 overflow-hidden sm:h-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-3 right-3 text-3xl" aria-hidden>
                    {service.emoji}
                  </span>
                </div>
                <div
                  className={cn(
                    "border-t p-4 transition-colors sm:p-5",
                    colorBorder[service.color] || colorBorder.teal,
                  )}
                >
                  <h3 className="mb-1 text-lg font-bold text-slate-900">{service.title}</h3>
                  <p className="text-sm text-slate-600">{service.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-cyan-700 transition-all group-hover:gap-2">
                    مشاهده و رزرو
                    <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Stats */}
      <section className="border-y border-cyan-100 bg-white/70 py-12 sm:py-16" aria-labelledby="stats-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 id="stats-heading" className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                چرا پاستور پلاس؟
              </h2>
              <p className="mb-6 leading-relaxed text-slate-600">
                پاستور پلاس مسیر دسترسی به خدمات مرکز پاستور را ساده می‌کند: انتخاب دندانپزشک،
                مشاوره و ویزیت، خدمات پرستاری، فروشگاه تجهیزات و پیگیری باشگاه مشتریان در یک تجربه
                موبایل‌محور.
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                {[
                  "رزرو آنلاین ۲۴ ساعته",
                  "دندانپزشکان مجرب مرکز",
                  "عضویت عادی و VIP با شرایط شفاف",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-teal-300 bg-teal-100 text-xs font-bold text-teal-700">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {PASTEUR_DATA.stats.map((stat) => (
                <Card key={stat.label} className="p-4 text-center">
                  <p className="text-2xl font-bold text-teal-700 sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-cyan-100 bg-white/70 py-12 sm:py-16" aria-labelledby="features-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="features-heading" className="mb-2 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            خدمات هوشمند پاستور پلاس
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-slate-600">
            مشاوره، گالری، باشگاه وفاداری و یادآور — همه در یک سامانه
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: ROUTES.web.consultation,
                emoji: "💬",
                title: "مشاوره و ویزیت",
                desc: "پیش‌نمایش خدمت و تخمین هزینه",
                hover: "hover:border-teal-500",
              },
              {
                href: ROUTES.web.gallery,
                emoji: "🖼️",
                title: "گالری نتایج",
                desc: "قبل و بعد — دندان، لیزر، زیبایی",
                hover: "hover:border-purple-500",
              },
              {
                href: ROUTES.web.club,
                emoji: "🎁",
                title: "باشگاه مشتریان",
                desc: "امتیاز، پاداش و تخفیف وفاداری",
                hover: "hover:border-amber-500",
              },
              {
                href: ROUTES.web.wallet,
                emoji: "💳",
                title: "کیف اعتبار",
                desc: "سقف اعتبار و شرایط بازپرداخت",
                hover: "hover:border-emerald-500",
              },
              {
                href: ROUTES.web.reminders,
                emoji: "🔔",
                title: "یادآور هوشمند",
                desc: "اعلان نوبت — ۲۴ ساعت و ۲ ساعت قبل",
                hover: "hover:border-blue-500",
              },
            ].map((f) => (
              <Link key={f.href} href={f.href}>
                <Card className={cn("block p-6 text-center", f.hover)}>
                  <span className="text-4xl">{f.emoji}</span>
                  <h3 className="mt-3 font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Shop */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[1.25rem] border border-cyan-700 bg-gradient-to-bl from-cyan-700 via-cyan-800 to-slate-900 p-8 text-center text-white sm:p-12">
            <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-amber-300/20 blur-2xl" />
            <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-cyan-300/20 blur-2xl" />
            <h2 className="relative mb-3 text-2xl font-bold sm:text-3xl">
              فروشگاه تجهیزات پزشکی و دندانپزشکی
            </h2>
            <p className="relative mx-auto mb-6 max-w-lg text-cyan-100">
              مشاهده محصولات، ثبت سفارش، فعال‌سازی مشتری VIP تجهیزات و درخواست تسهیلات خرید
            </p>
            <Link
              href={ROUTES.web.shop}
              className="relative inline-flex items-center gap-2 rounded-full border border-white bg-white px-8 py-3 font-bold text-cyan-900 transition-colors hover:bg-cyan-50"
            >
              ورود به فروشگاه تجهیزات
              <svg className="h-5 w-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
