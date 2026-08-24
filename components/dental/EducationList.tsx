"use client";

import { Card, EmptyState } from "@/components/ui/Card";
import { fetchPublic } from "@/lib/content/client";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DentalBasePath } from "./types";
import { isAppDental } from "./types";

type Clip = {
  id: string;
  title: string;
  level: string;
  description: string;
  videoUrl?: string;
  durationLabel?: string;
  duration?: string;
};

export function EducationList({ basePath }: { basePath: DentalBasePath }) {
  const app = isAppDental(basePath);
  const [items, setItems] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPublic<{ items: Clip[] }>("/api/content/dental-education")
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (app) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">آموزش‌های بعد از خدمات دندانپزشکی</p>
        {loading ? (
          <p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>
        ) : items.length === 0 ? (
          <EmptyState title="هنوز کلیپ آموزشی ثبت نشده" />
        ) : (
          items.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm"
            >
              <p className="font-bold text-slate-900">{c.title}</p>
              {c.level ? (
                <span className="mt-1 inline-flex items-center rounded-full border border-green-300 bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                  {c.level}
                </span>
              ) : null}
              <p className="mt-2 text-sm font-medium text-teal-700">
                ▶ {c.durationLabel || c.duration || "—"}
              </p>
              <p className="mt-2 text-sm text-slate-500">{c.description}</p>
              {c.videoUrl ? (
                <a
                  href={c.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-bold text-cyan-700 underline"
                >
                  مشاهده کلیپ ←
                </a>
              ) : null}
            </article>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href={ROUTES.web.dental} className="hover:text-teal-700">
          دندانپزشکی
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">آموزش‌ها و نکات دندانپزشکی</span>
      </nav>
      <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        📚 آموزش‌ها و نکات دندانپزشکی
      </h1>
      <p className="mb-8 text-slate-600">راهنمای مراقبت بعد از خدمات؛ کلیپ‌ها از پنل ادمین مدیریت می‌شوند.</p>
      <div className="space-y-5">
        {loading ? (
          <p className="py-8 text-center text-slate-500">در حال بارگذاری...</p>
        ) : items.length === 0 ? (
          <EmptyState title="هنوز کلیپ آموزشی ثبت نشده — از ادمین اضافه کنید." />
        ) : (
          items.map((c) => (
            <Card key={c.id} className="p-6" hover={false}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">{c.title}</h2>
                {c.level ? (
                  <span className="inline-flex items-center rounded-full border border-green-300 bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                    {c.level}
                  </span>
                ) : null}
              </div>
              <p className="mb-2 text-sm font-medium text-teal-700">
                ▶ {c.durationLabel || c.duration || "—"}
              </p>
              <p className="text-sm leading-relaxed text-slate-600">{c.description}</p>
              {c.videoUrl ? (
                <a
                  href={c.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-bold text-cyan-700 underline"
                >
                  مشاهده کلیپ ←
                </a>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
