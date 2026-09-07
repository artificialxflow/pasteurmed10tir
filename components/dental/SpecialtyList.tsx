import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import type { DentalBasePath } from "./types";
import { isAppDental } from "./types";

export function SpecialtyList({ basePath }: { basePath: DentalBasePath }) {
  const app = isAppDental(basePath);
  const generalHref = `${basePath}/general`;

  if (app) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {PASTEUR_DATA.dentalSpecialties.map((s) => (
          <Link
            key={s.id}
            href={`${generalHref}?specialty=${s.id}`}
            className="rounded-2xl border border-sky-200 bg-white p-4 transition hover:border-teal-500"
          >
            <span className="text-2xl">{s.emoji}</span>
            <p className="mt-2 text-sm font-bold text-slate-900">{s.name}</p>
            <p className="mt-1 text-xs text-slate-500">{s.description}</p>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href={ROUTES.web.dental} className="hover:text-teal-700">
          دندانپزشکی
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">تخصصی</span>
      </nav>
      <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        🔬 خدمات تخصصی دندانپزشکی
      </h1>
      <p className="mb-8 text-slate-600">تخصص مورد نظر را انتخاب کنید و نوبت رزرو کنید</p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PASTEUR_DATA.dentalSpecialties.map((s) => (
          <Card key={s.id} className="p-6 hover:border-teal-500">
            <span className="text-3xl">{s.emoji}</span>
            <h2 className="mt-3 text-lg font-bold">{s.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{s.description}</p>
            <Link
              href={`${generalHref}?specialty=${s.id}`}
              className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:underline"
            >
              رزرو نوبت ←
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
