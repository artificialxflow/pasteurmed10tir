import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لیزر و زیبایی",
  description: "خدمات لیزر و زیبایی — پاستور پلاس",
};

export default function LaserPage() {
  const phone = PASTEUR_DATA.institute.phoneDigits;

  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">✨ لیزر و زیبایی</h1>
        <p className="mb-8 text-slate-600">خدمات لیزر و زیبایی با جدیدترین تجهیزات</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {PASTEUR_DATA.laserServices.map((s) => (
            <Card key={s.title} className="p-6 hover:border-purple-400">
              <span className="text-3xl">{s.emoji}</span>
              <h2 className="mt-3 text-lg font-bold">{s.title}</h2>
              <p className="mt-2 font-semibold text-purple-700">{s.price}</p>
            </Card>
          ))}
        </div>
        <Card
          hover={false}
          className="mt-8 border-purple-200 bg-purple-50 p-6 text-center"
        >
          <p className="mb-4 text-slate-700">برای مشاوره رایگان و رزرو نوبت تماس بگیرید</p>
          <Button href={`tel:${phone}`} variant="accent">
            رزرو مشاوره
          </Button>
        </Card>
      </div>
    </main>
  );
}
