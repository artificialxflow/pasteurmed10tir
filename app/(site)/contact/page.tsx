import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { WEB_PAGE_CONTAINER } from "@/lib/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "تماس با پاستور پلاس — تلفن، واتساپ و آدرس درمانگاه",
};

export default function ContactPage() {
  const { institute } = PASTEUR_DATA;
  const whatsappUrl = `https://wa.me/${institute.whatsappDigits}`;

  return (
    <main className="flex-1 py-10">
      <div className={WEB_PAGE_CONTAINER}>
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

        <Card hover={false} className="mb-8 bg-white p-6 sm:p-8">
          <h2 className="mb-2 text-lg font-extrabold text-slate-900">درباره کلینیک</h2>
          <p className="leading-8 text-slate-600">
            {institute.nameFa} ({institute.nameEn}) سامانه خدمات {institute.subtitle} است. مرکز در{" "}
            {institute.address} فعالیت می‌کند و محدوده خدمات {institute.serviceArea} است.{" "}
            {institute.welcome}
          </p>
        </Card>

        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {(institute.phoneGroups || []).map((group) => (
            <Card key={group.label} hover={false} className="h-full bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">{group.label}</h2>
              <ul className="mt-3 space-y-2">
                {group.numbers.map((num, i) => (
                  <li key={group.digits[i] || num}>
                    <a
                      href={`tel:${group.digits[i]}`}
                      className="text-xl font-extrabold text-teal-700 hover:underline"
                      dir="ltr"
                    >
                      {num}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ))}

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

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <iframe
              title="موقعیت درمانگاه پاستور پلاس روی نقشه"
              src={institute.mapEmbedUrl}
              className="h-56 w-full sm:h-72"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button href={`tel:${institute.phoneDigits}`}>تماس فوری</Button>
            <Button href={whatsappUrl} variant="accent">
              ارسال واتساپ
            </Button>
            <Button href={institute.mapUrl} variant="outline">
              مسیریابی در گوگل‌مپ
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
