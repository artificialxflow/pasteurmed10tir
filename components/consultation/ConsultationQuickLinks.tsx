import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

const QUICK_SERVICES = [
  { id: "psychology", emoji: "🧠", label: "روانشناسی" },
  { id: "nutrition", emoji: "🥗", label: "مشاور تغذیه" },
  { id: "midwifery", emoji: "🤱", label: "مامایی" },
] as const;

export function ConsultationQuickLinks({ variant = "web" }: { variant?: "web" | "app" }) {
  const base = variant === "app" ? ROUTES.app.consultation : ROUTES.web.consultation;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-slate-900">خدمات تخصصی — تماس کارشناس</h2>
      <p className="mb-4 text-sm text-slate-600">
        برای این خدمات، درخواست ثبت می‌شود و کارشناس با شما تماس می‌گیرد.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {QUICK_SERVICES.map((service) => (
          <Link key={service.id} href={`${base}?category=${service.id}`}>
            <Card className="h-full p-4 text-center hover:border-teal-500">
              <span className="text-3xl">{service.emoji}</span>
              <p className="mt-2 font-bold text-slate-900">{service.label}</p>
              <p className="mt-1 text-xs text-teal-700">ثبت درخواست</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
