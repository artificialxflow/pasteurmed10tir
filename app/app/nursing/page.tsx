import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

export default function AppNursingPage() {
  const phone = PASTEUR_DATA.institute.phoneDigits;

  return (
    <AppShell title="پرستاری" backHref={ROUTES.app.home} showNav>
      <p className="mb-4 text-sm leading-7 text-slate-600">
        خدمات پرستاری در منزل — شامل مراقبت ICU/CCU
      </p>
      <div className="space-y-3">
        {PASTEUR_DATA.nursingServices.map((s) => (
          <Card key={s.title} hover={false} className="p-4">
            <span className="text-2xl">{s.emoji}</span>
            <p className="mt-2 text-sm font-bold text-slate-900">{s.title}</p>
            {s.description ? (
              <p className="mt-1 text-xs leading-6 text-slate-500">{s.description}</p>
            ) : null}
            <p className="mt-2 text-sm font-semibold text-teal-700">{s.price}</p>
          </Card>
        ))}
      </div>
      <Button href={`tel:${phone}`} className="mt-4 w-full">
        تماس برای درخواست
      </Button>
      <Link
        href={`${ROUTES.app.consultation}?category=nursing&type=phone`}
        className="mt-3 block text-center text-sm font-bold text-cyan-700 underline-offset-4 hover:underline"
      >
        ثبت درخواست آنلاین
      </Link>
    </AppShell>
  );
}
