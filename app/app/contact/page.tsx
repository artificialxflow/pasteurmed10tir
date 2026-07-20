import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

export default function AppContactPage() {
  const i = PASTEUR_DATA.institute;
  const whatsappUrl = `https://wa.me/${i.whatsappDigits}`;

  return (
    <AppShell title="تماس با ما" backHref={ROUTES.app.home} showNav>
      <section className="mb-3 rounded-2xl border border-cyan-200 bg-gradient-to-bl from-cyan-50 to-amber-50 p-4">
        <p className="text-xs font-bold text-cyan-800">کانال‌های ارتباطی</p>
        <p className="mt-1 text-base font-extrabold text-slate-950">تماس با ما</p>
        <p className="mt-1 text-xs text-slate-600">هماهنگی نوبت، پرستاری، فروشگاه، مشاوره و عضویت</p>
      </section>

      <div className="mb-4 space-y-2">
        <a href={`tel:${i.phoneDigits}`}>
          <Card className="p-4">
            <p className="font-bold text-slate-900">📞 {i.phone}</p>
            <p className="mt-1 text-xs text-slate-500">تماس اصلی — درمانگاه</p>
          </Card>
        </a>
        <a href={`tel:${i.phoneAltDigits}`}>
          <Card className="p-4">
            <p className="font-bold text-slate-900">☎️ {i.phoneAlt}</p>
            <p className="mt-1 text-xs text-slate-500">تماس دوم — پیگیری خدمات</p>
          </Card>
        </a>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Card className="p-4">
            <p className="font-bold text-slate-900">💬 واتساپ</p>
            <p className="mt-1 text-xs text-slate-500">{i.whatsapp}</p>
          </Card>
        </a>
      </div>

      <Card hover={false} className="mb-4 p-4">
        <p className="mb-2 font-bold">🕐 ساعات پاسخگویی</p>
        <p className="text-sm text-slate-500">{i.contactHours}</p>
      </Card>

      <Card hover={false} className="mb-4 p-4">
        <p className="mb-2 font-bold">📍 آدرس درمانگاه</p>
        <p className="text-sm text-slate-500">{i.address}</p>
        <p className="mt-2 text-xs text-slate-500">محدوده خدمات: {i.serviceArea}</p>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button href={`tel:${i.phoneDigits}`} className="px-3 py-2.5 text-sm">
          تماس فوری
        </Button>
        <Button href={whatsappUrl} variant="accent" className="px-3 py-2.5 text-sm">
          واتساپ
        </Button>
      </div>

      <Link
        href={ROUTES.app.partners}
        className="mt-3 block text-center text-sm font-bold text-cyan-700 underline-offset-4 hover:underline"
      >
        درخواست همکاری
      </Link>
    </AppShell>
  );
}
