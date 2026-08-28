"use client";

import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const INTERVAL_MS = 3000;

const SLIDES = [
  {
    src: "/hero/slide-1-heritage.jpg",
    alt: "کلینیک پاستور — از ۱۳۶۶ تا امروز",
    href: ROUTES.web.contact,
  },
  {
    src: "/hero/slide-2-equipment-loan.jpg",
    alt: "وام خرید تجهیزات دندانپزشکی — تسهیلات VIP",
    href: ROUTES.web.shopFacility,
  },
  {
    src: "/hero/slide-3-implant.jpg",
    alt: "ایمپلنت دیجیتال — تحویل دندان در یک روز",
    href: ROUTES.web.dentalBooking,
  },
  {
    src: "/hero/slide-4-medical-loan.jpg",
    alt: "وام درمانی ۳۰۰ میلیونی",
    href: ROUTES.web.account,
  },
  {
    src: "/hero/slide-5-online-visit.jpg",
    alt: "ویزیت آنلاین و تصویری با متخصصین پاستور پلاس",
    href: ROUTES.web.consultation,
  },
] as const;

export function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive((index + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div
      className="relative mx-auto w-full max-w-md lg:mr-0 lg:ml-auto lg:max-w-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute -inset-8 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.5rem] border border-cyan-200/80 bg-slate-100 shadow-[0_40px_80px_-40px_rgb(8_145_178_/_0.55)]">
        <div className="relative aspect-[4/5] w-full">
          {SLIDES.map((slide, index) => (
            <Link
              key={slide.src}
              href={slide.href}
              className={cn(
                "absolute inset-0 block transition-opacity duration-700 ease-in-out",
                index === active ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none",
                index === active && "pointer-events-auto",
              )}
              aria-hidden={index !== active}
              tabIndex={index === active ? 0 : -1}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.src}
                alt={slide.alt}
                className="h-full w-full object-cover object-center"
                draggable={false}
              />
            </Link>
          ))}
        </div>

        <div
          className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-2 pb-4 pt-10"
          style={{
            background:
              "linear-gradient(to top, rgb(15 23 42 / 0.45), rgb(15 23 42 / 0.15) 40%, transparent)",
          }}
          role="tablist"
          aria-label="اسلایدهای پاستور پلاس"
        >
          {SLIDES.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={slide.alt}
              onClick={() => goTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === active
                  ? "w-6 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/80",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
