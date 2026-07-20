import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "تماس با پاستور پلاس — تلفن، واتساپ و آدرس درمانگاه",
};

export default function ContactPage() {
  const { institute } = PASTEUR_DATA;
  const whatsappUrl = `https://wa.me/${institute.whatsappDigits}`;

  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Card
          hover={false}
          className="mb-8 border-cyan-200 bg-gradient-to-bl from-cyan-50 to-amber-50 p-6 sm:p-8"
        >
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-bold text-cyan-800">
            کانال‌های ارتباطی پاستور پلاس
          </span>
          <h1 className="mb-3 text-2xl font-extrabold text-slate-950 sm:text-4xl">تماس با ما</h1>
          <p className="max-w-3xl leading-7 text-slate-600">
            برای هماهنگی نوبت، خدمات پرستاری، فروشگاه تجهیزات، مشاوره و پیگیری عضویت می‌توانید از
            شماره‌های تماس یا واتساپ استفاده کنید.
          </p>
        </Card>

        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <a href={`tel:${institute.phoneDigits}`}>
            <Card className="h-full bg-white p-6 hover:border-teal-500">
              <span className="text-3xl">📞</span>
              <h2 className="mt-3 text-lg font-bold">شماره تماس اصلی</h2>
              <p className="mt-2 text-2xl font-extrabold text-teal-700">{institute.phone}</p>
              <p className="mt-2 text-sm text-slate-500">برای تماس مستقیم با درمانگاه</p>
            </Card>
          </a>

          <a href={`tel:${institute.phoneAltDigits}`}>
            <Card className="h-full bg-white p-6 hover:border-cyan-500">
              <span className="text-3xl">☎️</span>
              <h2 className="mt-3 text-lg font-bold">شماره تماس دوم</h2>
              <p className="mt-2 text-2xl font-extrabold text-cyan-700">{institute.phoneAlt}</p>
              <p className="mt-2 text-sm text-slate-500">برای پیگیری و هماهنگی خدمات</p>
            </Card>
          </a>

          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Card className="h-full bg-white p-6 hover:border-green-500">
              <span className="text-3xl">💬</span>
              <h2 className="mt-3 text-lg font-bold">واتساپ</h2>
              <p className="mt-2 text-2xl font-extrabold text-green-700">{institute.whatsapp}</p>
              <p className="mt-2 text-sm text-slate-500">ارسال پیام برای هماهنگی سریع‌تر</p>
            </Card>
          </a>

          <Card hover={false} className="bg-white p-6">
            <span className="text-3xl">🕐</span>
            <h2 className="mt-3 text-lg font-bold">ساعات پاسخگویی</h2>
            <p className="mt-2 leading-7 text-slate-700">{institute.contactHours}</p>
          </Card>
        </section>

        <Card hover={false} className="bg-white p-6 sm:p-8">
          <div className="mb-4 flex items-start gap-3">
            <span className="text-3xl">📍</span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">آدرس درمانگاه</h2>
              <p className="mt-2 leading-8 text-slate-600">{institute.address}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button href={`tel:${institute.phoneDigits}`}>تماس فوری</Button>
            <Button href={whatsappUrl} variant="accent">
              ارسال واتساپ
            </Button>
            <Link
              href={ROUTES.web.partners}
              className="inline-flex items-center justify-center rounded-full border-2 border-amber-200 bg-white px-6 py-3 font-bold text-amber-800 transition-colors hover:bg-amber-50"
            >
              درخواست همکاری
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
