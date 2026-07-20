import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پرستاری",
  description: "خدمات پرستاری در منزل — پاستور پلاس",
};

export default function NursingPage() {
  const phone = PASTEUR_DATA.institute.phoneDigits;

  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          👩‍⚕️ خدمات پرستاری در منزل
        </h1>
        <p className="mb-8 text-slate-600">
          تزریقات، پانسمان، مراقبت ICU/CCU در منزل و اجاره تجهیزات پزشکی با هماهنگی پاستور پلاس
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {PASTEUR_DATA.nursingServices.map((s) => (
            <Card key={s.title} hover={false} className="overflow-hidden bg-white p-0">
              {"image" in s && s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt={s.title} className="h-40 w-full object-cover" loading="lazy" />
              ) : null}
              <div className="p-6">
                <span className="text-3xl">{s.emoji}</span>
                <h2 className="mt-3 text-lg font-bold">{s.title}</h2>
                {s.description ? (
                  <p className="mt-2 text-sm leading-7 text-slate-600">{s.description}</p>
                ) : null}
                <p className="mt-3 font-semibold text-teal-700">{s.price}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button href={`tel:${phone}`}>درخواست خدمات پرستاری</Button>
        </div>
      </div>
    </main>
  );
}
