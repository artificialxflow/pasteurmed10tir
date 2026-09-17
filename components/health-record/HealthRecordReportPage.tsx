"use client";

import { HealthRecordEntryView } from "@/components/health-record/HealthRecordEntryView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HEALTH_SECTIONS, isKnownSection } from "@/lib/health-record/sections";
import { WEB_PAGE_CONTAINER } from "@/lib/layout";
import { fetchPatientOps } from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Entry = {
  id: string;
  section: string;
  date: string;
  payload: Record<string, unknown>;
  attachments?: Array<{ id: string; path: string; originalName: string }>;
};

export function HealthRecordReportPage({ variant = "web" }: { variant?: "web" | "app" }) {
  const healthHref = variant === "app" ? ROUTES.app.healthRecord : ROUTES.web.healthRecord;
  const accountHref = variant === "app" ? ROUTES.app.account : ROUTES.web.account;
  const [items, setItems] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    void fetchPatientOps<{ items: Entry[] }>("/api/operations/health-record/entries")
      .then((data) => setItems(data.items || []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const item of items) {
      const list = map.get(item.section) || [];
      list.push(item);
      map.set(item.section, list);
    }
    return map;
  }, [items]);

  const sectionsWithData = useMemo(
    () => HEALTH_SECTIONS.filter((s) => (grouped.get(s.id)?.length || 0) > 0),
    [grouped],
  );

  return (
    <div className={`${WEB_PAGE_CONTAINER} space-y-6`} data-page="health-record-report">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">گزارش کلی پرونده سلامت</h1>
          <p className="mt-1 text-xs text-slate-500">
            خلاصه همه بخش‌های ثبت‌شده — برای ذخیره PDF از «چاپ» مرورگر استفاده کنید.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="text-xs" onClick={() => window.print()}>
            چاپ / PDF
          </Button>
          <Link href={healthHref} className="text-xs font-bold text-teal-700">
            بازگشت به پرونده
          </Link>
          <Link href={accountHref} className="text-xs font-bold text-slate-600">
            حساب کاربری
          </Link>
        </div>
      </div>

      <div className="hidden print:block">
        <h1 className="text-lg font-extrabold text-slate-900">گزارش پرونده سلامت — پاستور پلاس</h1>
        <p className="text-xs text-slate-600">تاریخ تهیه: {new Date().toLocaleDateString("fa-IR")}</p>
      </div>

      {error ? <p className="text-sm text-rose-600 print:hidden">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-500 print:hidden">در حال بارگذاری…</p>
      ) : sectionsWithData.length === 0 ? (
        <Card hover={false} className="p-4 text-sm text-slate-600">
          هنوز موردی در پرونده ثبت نشده است. از{" "}
          <Link href={healthHref} className="font-bold text-teal-700">
            صفحه پرونده سلامت
          </Link>{" "}
          می‌توانید ثبت کنید.
        </Card>
      ) : (
        sectionsWithData.map((section) => (
          <Card key={section.id} hover={false} className="break-inside-avoid p-4 print:border-0 print:shadow-none">
            <h2 className="mb-3 text-sm font-extrabold text-slate-900">
              {section.emoji} {section.label}
            </h2>
            <ul className="space-y-3">
              {(grouped.get(section.id) || []).map((item) => (
                <HealthRecordEntryView
                  key={item.id}
                  item={item}
                  section={isKnownSection(item.section) ? item.section : section.id}
                />
              ))}
            </ul>
          </Card>
        ))
      )}
    </div>
  );
}
