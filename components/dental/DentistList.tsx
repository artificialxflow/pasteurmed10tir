"use client";

import { Badge, Card, EmptyState, FormInput, FormLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatHoursRange, dayHoursFromDentist } from "@/lib/content/doctor-mappers";
import { fetchPublic } from "@/lib/content/client";
import { PASTEUR_DATA, type Dentist } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { DentalBasePath } from "./types";
import { isAppDental } from "./types";

type DentistDayCard = {
  key: string;
  dentist: Dentist;
  day: string;
  hoursLabel: string;
};

function buildDayCards(dentists: Dentist[]): DentistDayCard[] {
  const cards: DentistDayCard[] = [];
  for (const dentist of dentists) {
    const dayHours = dayHoursFromDentist(dentist);
    const days =
      dentist.days?.length > 0
        ? dentist.days
        : Object.keys(dentist.schedule || {}).filter((day) => dayHours[day]);
    for (const day of days) {
      const range = dayHours[day];
      cards.push({
        key: `${dentist.id}-${day}`,
        dentist,
        day,
        hoursLabel: range
          ? formatHoursRange(range.start, range.end)
          : dentist.hours || "—",
      });
    }
  }
  return cards;
}

export function DentistList({ basePath }: { basePath: DentalBasePath }) {
  const searchParams = useSearchParams();
  const specialtyFilter = searchParams.get("specialty");
  const [query, setQuery] = useState("");
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(true);
  const app = isAppDental(basePath);
  const bookingBase = `${basePath}/booking`;
  const specialtyPage = `${basePath}/specialty`;

  useEffect(() => {
    void fetchPublic<{ items: Dentist[] }>("/api/content/dentists")
      .then((data) => setDentists(data.items))
      .catch(() => setDentists([]))
      .finally(() => setLoading(false));
  }, []);

  const specialtyMeta = useMemo(() => {
    if (!specialtyFilter) return null;
    if (specialtyFilter === "general") {
      return { id: "general", name: "دندانپزشکی عمومی", emoji: "🦷" };
    }
    const fromCatalog = PASTEUR_DATA.dentalSpecialties.find(
      (s) => String(s.id) === specialtyFilter,
    );
    if (fromCatalog) {
      return { id: String(fromCatalog.id), name: fromCatalog.name, emoji: fromCatalog.emoji };
    }
    const fromDoctor = dentists.find(
      (d) => d.specialtyId === specialtyFilter || String(d.specialtyId) === specialtyFilter,
    );
    if (fromDoctor) {
      return { id: specialtyFilter, name: fromDoctor.specialty, emoji: "🔬" };
    }
    return { id: specialtyFilter, name: specialtyFilter, emoji: "🔬" };
  }, [dentists, specialtyFilter]);

  const filteredDentists = useMemo(() => {
    const q = query.trim();
    return dentists.filter((d) => {
      if (specialtyFilter) {
        const matchId =
          d.specialtyId === specialtyFilter || String(d.specialtyId) === specialtyFilter;
        if (!matchId) return false;
      }
      return !q || d.name.includes(q);
    });
  }, [dentists, query, specialtyFilter]);

  const dayCards = useMemo(() => buildDayCards(filteredDentists), [filteredDentists]);

  const title = specialtyMeta ? `پزشکان ${specialtyMeta.name}` : "دندانپزشکان مرکز";
  const subtitle = specialtyMeta
    ? `نوبت‌های تخصص ${specialtyMeta.name} — هر روز جدا`
    : "هر روز حضور به‌صورت کارت جدا نمایش داده می‌شود";
  const emptyTitle = specialtyFilter ? "پزشک این تخصص ثبت نشده" : "دندانپزشکی یافت نشد.";

  function renderCard(card: DentistDayCard) {
    const { dentist: d, day, hoursLabel } = card;
    const inactive = d.status === "inactive";
    const href = `${bookingBase}?doctor=${d.id}&day=${encodeURIComponent(day)}`;

    if (app) {
      const inner = (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={d.image}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl border-2 border-slate-200 object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="m-0 text-sm font-bold text-slate-900">{d.name}</p>
              <Badge status={d.status} />
            </div>
            <p className="text-xs text-teal-700">{d.specialty}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-[0.7rem] text-slate-500">
              <span>📅 {day}</span>
              <span>🕐 {hoursLabel}</span>
            </div>
          </div>
        </>
      );
      if (inactive) {
        return (
          <div
            key={card.key}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 opacity-55"
          >
            {inner}
          </div>
        );
      }
      return (
        <Link
          key={card.key}
          href={href}
          className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-white p-3 transition hover:border-teal-500"
        >
          {inner}
        </Link>
      );
    }

    return (
      <Card
        key={card.key}
        hover={!inactive}
        className={cn(
          "flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:p-5",
          inactive && "opacity-50",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={d.image}
          alt={d.name}
          className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white object-cover shadow-sm sm:h-24 sm:w-24"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">{d.name}</h3>
            <Badge status={d.status} />
          </div>
          <p className="mb-2 text-sm font-medium text-teal-700">{d.specialty}</p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <span aria-hidden="true">📅</span>
              {day}
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true">🕐</span>
              {hoursLabel}
            </span>
          </div>
        </div>
        {inactive ? (
          <Button className="w-full shrink-0 text-sm sm:w-auto" disabled>
            غیرفعال
          </Button>
        ) : (
          <Button href={href} className="w-full shrink-0 text-sm sm:w-auto">
            انتخاب و رزرو
          </Button>
        )}
      </Card>
    );
  }

  if (app) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-cyan-50 to-white p-4">
          <p className="text-sm font-extrabold text-slate-900">
            {specialtyMeta ? `${specialtyMeta.emoji} ${title}` : title}
          </p>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          {specialtyFilter ? (
            <Link href={specialtyPage} className="mt-2 inline-block text-xs font-bold text-teal-700 underline">
              تغییر تخصص
            </Link>
          ) : null}
        </section>
        <FormInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی نام پزشک..."
        />
        <div className="space-y-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">در حال بارگذاری...</p>
          ) : dayCards.length === 0 ? (
            <EmptyState title={emptyTitle} />
          ) : (
            dayCards.map(renderCard)
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href={ROUTES.web.home} className="hover:text-teal-700">
          صفحه اصلی
        </Link>
        <span className="mx-2">/</span>
        <Link href={ROUTES.web.dental} className="hover:text-teal-700">
          دندانپزشکی
        </Link>
        <span className="mx-2">/</span>
        {specialtyFilter ? (
          <>
            <Link href={ROUTES.web.dentalSpecialty} className="hover:text-teal-700">
              تخصصی
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-900">{specialtyMeta?.name || "فیلتر"}</span>
          </>
        ) : (
          <span className="font-medium text-slate-900">عمومی</span>
        )}
      </nav>
      <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
      <p className="mb-6 text-slate-600">{subtitle}</p>

      <div className="mb-6">
        <FormLabel>جستجو بر اساس نام</FormLabel>
        <FormInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="نام پزشک را وارد کنید..."
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="py-12 text-center text-slate-500">در حال بارگذاری...</p>
        ) : dayCards.length === 0 ? (
          <EmptyState title={emptyTitle} />
        ) : (
          dayCards.map(renderCard)
        )}
      </div>
    </div>
  );
}
