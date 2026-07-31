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
  purple: "border-cyan-300 hover:border-cyan-500 group-hover:bg-cyan-50",
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

  return (
    <main className="flex-1">
      {/* Hero — یک ترکیب: برند، یک تیتر، یک جمله، CTA، تصویر غالب */}
      <section className="relative min-h-[min(92vh,860px)] overflow-hidden border-b border-cyan-100">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 55% at 85% 40%, rgb(0 173 239 / 0.28), transparent), radial-gradient(ellipse 50% 45% at 10% 80%, rgb(233 30 140 / 0.12), transparent), linear-gradient(160deg, #f0fbfd 0%, #e8f7fc 45%, #f8fafc 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230891b2' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative mx-auto grid min-h-[min(92vh,860px)] max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-8">
          <div className="animate-[fadeUp_0.7s_ease-out_both]">
            <div className="mb-6 flex items-center gap-4">
              <Logo className="h-20 w-auto max-w-[14rem] sm:h-24 sm:max-w-[16rem]" />
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  پاستور پلاس
                </p>
                <p className="mt-1 text-sm font-bold text-cyan-800 sm:text-base">
                  سامانه خدمات مرکز پاستور
                </p>
              </div>
            </div>
            <h1 className="mb-4 max-w-xl text-xl font-bold leading-relaxed text-slate-800 sm:text-2xl lg:text-3xl">
              مراقبت، نوبت و تجهیزات پزشکی در یک مسیر ساده
            </h1>
            <p className="mb-8 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              رزرو دندانپزشکی، ویزیت آنلاین، پرستاری و فروشگاه تجهیزات — از موبایل تا وب.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href={ROUTES.web.dentalGeneral} className="px-7 text-base">
                رزرو نوبت دندانپزشکی
              </Button>
              <Button href={ROUTES.web.medical} variant="outline" className="border-cyan-700 px-7 text-base text-cyan-900">
                مشاوره و ویزیت پزشکی
              </Button>
              <Button
                href={ROUTES.app.home}
                variant="ghost"
                className="px-5 text-base text-slate-600"
                onClick={markAppView}
              >
                نسخه موبایل ←
              </Button>
            </div>
          </div>

          <div className="relative animate-[fadeUp_0.85s_ease-out_0.12s_both]">
            <div className="pointer-events-none absolute -inset-8 rounded-full bg-cyan-300/25 blur-3xl" />
            <Link
              href={ROUTES.app.home}
              onClick={markAppView}
              className="relative mx-auto block w-full max-w-[360px] transition duration-500 hover:-translate-y-1 lg:mr-0 lg:ml-auto"
              aria-label="ورود به نسخه موبایل اپ"
            >
              <div className="overflow-hidden rounded-[2rem] border border-slate-800/90 bg-white shadow-[0_40px_80px_-40px_rgb(8_145_178_/_0.55)]">
                <div className="flex h-8 items-center justify-center bg-slate-950">
                  <span className="h-1.5 w-20 rounded-full bg-slate-600" />
                </div>
                <div className="relative aspect-[9/14] bg-gradient-to-b from-cyan-100 via-white to-sky-50 p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=720&h=900&fit=crop"
                    alt="فضای درمانگاه پاستور پلاس"
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <p className="text-xs font-bold text-cyan-200">پاستور پلاس</p>
                    <p className="mt-1 text-xl font-extrabold">همراه شما در مسیر درمان</p>
                    <p className="mt-2 text-sm text-white/80">ورود به تجربه موبایل</p>
                  </div>
                </div>
              </div>
            </Link>
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
                className="group relative block overflow-hidden rounded-[1.25rem] border border-sky-200/80 bg-white shadow-[0_12px_36px_-28px_rgb(8_145_178_/_0.4)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-[0_20px_48px_-30px_rgb(8_145_178_/_0.55)]"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
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
                hover: "hover:border-cyan-500",
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
                hover: "hover:border-cyan-600",
              },
              {
                href: ROUTES.web.reminders,
                emoji: "🔔",
                title: "یادآور هوشمند",
                desc: "اعلان نوبت — ۲۴ ساعت و ۲ ساعت قبل",
                hover: "hover:border-sky-500",
              },
            ].map((f) => (
              <Link key={f.href} href={f.href}>
                <Card hover className={cn("block p-6 text-center", f.hover)}>
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
