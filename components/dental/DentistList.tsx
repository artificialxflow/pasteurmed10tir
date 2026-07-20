"use client";

import { Badge, Card, EmptyState, FormInput, FormLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PASTEUR_DATA, type Dentist } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { DentalBasePath } from "./types";
import { isAppDental } from "./types";

const DENTISTS = PASTEUR_DATA.dentists as unknown as Dentist[];

export function DentistList({ basePath }: { basePath: DentalBasePath }) {
  const [query, setQuery] = useState("");
  const app = isAppDental(basePath);
  const bookingBase = `${basePath}/booking`;

  const dentists = useMemo(() => {
    const q = query.trim();
    return DENTISTS.filter((d) => !q || d.name.includes(q));
  }, [query]);

  if (app) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-cyan-50 to-white p-4">
          <p className="text-sm font-extrabold text-slate-900">دندانپزشکان مرکز</p>
          <p className="mt-1 text-sm text-slate-600">دندانپزشک مورد نظر را انتخاب کنید</p>
        </section>
        <FormInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی نام پزشک..."
        />
        <div className="space-y-3">
          {dentists.length === 0 ? (
            <EmptyState title="پزشکی یافت نشد" />
          ) : (
            dentists.map((d) => {
              const inactive = d.status === "inactive";
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
                      <span>📅 {(d.days || []).join("، ")}</span>
                      <span>🕐 {d.hours || "—"}</span>
                    </div>
                  </div>
                </>
              );
              if (inactive) {
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 opacity-55"
                  >
                    {inner}
                  </div>
                );
              }
              return (
                <Link
                  key={d.id}
                  href={`${bookingBase}?doctor=${d.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-white p-3 transition hover:border-teal-500"
                >
                  {inner}
                </Link>
              );
            })
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
        <span className="font-medium text-slate-900">عمومی</span>
      </nav>
      <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">دندانپزشکان مرکز</h1>
      <p className="mb-6 text-slate-600">دندانپزشک مورد نظر را انتخاب کنید</p>

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
        {dentists.length === 0 ? (
          <EmptyState title="دندانپزشکی یافت نشد." />
        ) : (
          dentists.map((d) => {
            const inactive = d.status === "inactive";
            return (
              <Card
                key={d.id}
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
                      {d.days.join("، ")}
                    </span>
                    <span className="flex items-center gap-1">
                      <span aria-hidden="true">🕐</span>
                      {d.hours}
                    </span>
                  </div>
                </div>
                {inactive ? (
                  <Button className="w-full shrink-0 text-sm sm:w-auto" disabled>
                    غیرفعال
                  </Button>
                ) : (
                  <Button href={`${bookingBase}?doctor=${d.id}`} className="w-full shrink-0 text-sm sm:w-auto">
                    انتخاب و رزرو
                  </Button>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
