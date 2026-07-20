import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import type { DentalBasePath } from "./types";
import { isAppDental } from "./types";

export function EducationList({ basePath }: { basePath: DentalBasePath }) {
  const app = isAppDental(basePath);

  if (app) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">آموزش‌های بعد از خدمات دندانپزشکی</p>
        {PASTEUR_DATA.educationCourses.map((c) => (
          <article
            key={c.title}
            className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm"
          >
            <p className="font-bold text-slate-900">{c.title}</p>
            <span className="mt-1 inline-flex items-center rounded-full border border-green-300 bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
              {c.level}
            </span>
            <p className="mt-2 text-sm font-medium text-teal-700">▶ {c.duration}</p>
            <p className="mt-2 text-sm text-slate-500">{c.description}</p>
          </article>
        ))}
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
      <p className="mb-8 text-slate-600">
        راهنمای مراقبت بعد از خدمات دندانپزشکی؛ کلیپ‌ها و نکات آموزشی این بخش قابل توسعه و ویرایش
        هستند.
      </p>
      <div className="space-y-5">
        {PASTEUR_DATA.educationCourses.map((c) => (
          <Card key={c.title} className="p-6" hover={false}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">{c.title}</h2>
              <span className="inline-flex items-center rounded-full border border-green-300 bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                {c.level}
              </span>
            </div>
            <p className="mb-2 text-sm font-medium text-teal-700">▶ {c.duration}</p>
            <p className="text-sm leading-relaxed text-slate-600">{c.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}