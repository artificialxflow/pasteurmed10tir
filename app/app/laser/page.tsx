import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

export default function AppLaserPage() {
  const phone = PASTEUR_DATA.institute.phoneDigits;

  return (
    <AppShell title="لیزر و زیبایی" backHref={ROUTES.app.home} showNav>
      <p className="mb-4 text-sm leading-7 text-slate-600">خدمات لیزر و زیبایی</p>
      <div className="space-y-3">
        {PASTEUR_DATA.laserServices.map((s) => (
          <Card key={s.title} className="p-4 hover:border-purple-400">
            <span className="text-2xl">{s.emoji}</span>
            <p className="mt-2 text-sm font-bold text-slate-900">{s.title}</p>
            <p className="mt-1 text-sm font-semibold text-purple-700">{s.price}</p>
          </Card>
        ))}
      </div>
      <Card hover={false} className="mt-4 border-purple-200 bg-purple-50 p-4 text-center">
        <p className="mb-3 text-sm text-slate-700">برای مشاوره و رزرو تماس بگیرید</p>
        <Button href={`tel:${phone}`} variant="accent" className="w-full">
          تماس برای رزرو
        </Button>
        <Link
          href={`${ROUTES.app.consultation}?category=laser&type=video`}
          className="mt-3 block text-center text-sm font-bold text-cyan-700 underline-offset-4 hover:underline"
        >
          ثبت درخواست مشاوره آنلاین
        </Link>
      </Card>
    </AppShell>
  );
}
