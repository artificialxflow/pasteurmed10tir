import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import type { MedicalBasePath } from "./MedicalHub";

function isAppMedical(basePath: MedicalBasePath): boolean {
  return basePath.startsWith("/app");
}

export function MedicalSpecialtyList({ basePath }: { basePath: MedicalBasePath }) {
  const app = isAppMedical(basePath);
  const doctorsPage = app ? ROUTES.app.medicalDoctors : ROUTES.web.medicalDoctors;
  const medical = app ? ROUTES.app.medical : ROUTES.web.medical;

  if (app) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {PASTEUR_DATA.medicalSpecialties.map((s) => (
          <Link
            key={s.id}
            href={`${doctorsPage}?specialty=${s.id}`}
            className="rounded-2xl border border-sky-200 bg-white p-4 transition hover:border-amber-500"
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
        <Link href={medical} className="hover:text-teal-700">
          پزشکی
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">تخصص‌ها</span>
      </nav>
      <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        🔬 تخصص‌های پزشکی
      </h1>
      <p className="mb-8 text-slate-600">
        تخصص مورد نظر را انتخاب کنید؛ سپس پزشک و نوع مشاوره یا ویزیت را مشخص می‌کنید.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PASTEUR_DATA.medicalSpecialties.map((s) => (
          <Card key={s.id} className="p-6 hover:border-amber-500">
            <span className="text-3xl">{s.emoji}</span>
            <h2 className="mt-3 text-lg font-bold text-slate-900">{s.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{s.description}</p>
            <Button
              variant="accent"
              className="mt-4 text-sm"
              href={`${doctorsPage}?specialty=${s.id}`}
            >
              انتخاب و ادامه ←
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
