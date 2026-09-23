"use client";

import { fetchPublic } from "@/lib/content/client";
import { DEFAULT_HERO_SLIDES, type HeroSlide } from "@/lib/content/hero-slides";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const INTERVAL_MS = 3000;

export function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    void fetchPublic<{ heroSlides?: HeroSlide[] }>("/api/content/settings")
      .then((data) => {
        if (Array.isArray(data.heroSlides) && data.heroSlides.length) {
          setSlides(data.heroSlides);
          setActive(0);
        }
      })
      .catch(() => {});
  }, []);

  const count = slides.length || 1;

  const goTo = useCallback(
    (index: number) => {
      setActive((index + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

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
          {slides.map((slide, index) => (
            <Link
              key={`${slide.src}-${index}`}
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

        {slides.length > 1 ? (
          <div
            className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-2 pb-4 pt-10"
            style={{
              background:
                "linear-gradient(to top, rgb(15 23 42 / 0.45), rgb(15 23 42 / 0.15) 40%, transparent)",
            }}
            role="tablist"
            aria-label="اسلایدهای پاستور پلاس"
          >
            {slides.map((slide, index) => (
              <button
                key={`${slide.src}-dot-${index}`}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={slide.alt}
                onClick={() => goTo(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === active ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
