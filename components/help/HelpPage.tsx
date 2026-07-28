"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PasteurStorage } from "@/lib/storage";
import type { HelpItem } from "@/lib/patient";
import { useEffect, useState } from "react";

export function HelpPage({ variant = "web" }: { variant?: "web" | "app" }) {
  const [items, setItems] = useState<HelpItem[]>([]);

  useEffect(() => {
    PasteurStorage.initPatientDomainIfNeeded();
    setItems(PasteurStorage.getHelpItems().filter((i) => i.active !== false));
  }, []);

  return (
    <div className={variant === "app" ? "space-y-4" : "mx-auto max-w-3xl space-y-6 px-4 py-10"}>
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">آموزش سامانه</h1>
        <p className="mt-2 text-sm text-slate-600">
          کلیپ‌ها و فایل‌های PDF برای کار با اپ و سایت پاستور پلاس
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} hover={false} className="p-5">
            <p className="text-xs font-bold text-cyan-800">
              {item.type === "video" ? "ویدیو" : "PDF"}
            </p>
            <h2 className="mt-1 font-extrabold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
            <Button href={item.url} variant="outline" className="mt-4 text-sm">
              {item.type === "video" ? "مشاهده کلیپ" : "باز کردن فایل"}
            </Button>
          </Card>
        ))}
      </div>
      {!items.length ? (
        <p className="text-center text-sm text-slate-500">هنوز محتوای آموزشی ثبت نشده است.</p>
      ) : null}
    </div>
  );
}
