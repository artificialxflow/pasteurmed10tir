"use client";

import { HealthRecordEntryView } from "@/components/health-record/HealthRecordEntryView";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Card";
import { usePatientProfile } from "@/lib/auth/use-patient-profile";
import { PASTEUR_DATA } from "@/lib/data";
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
  const { profile } = usePatientProfile();
  const { institute } = PASTEUR_DATA;
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

  useEffect(() => {
    document.body.dataset.printPage = "health-record-report";
    return () => {
      delete document.body.dataset.printPage;
    };
  }, []);

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

  const preparedAt = new Date().toLocaleDateString("fa-IR");

  const letterhead = (
    <header className="health-report-letterhead">
      <div className="flex items-start justify-between gap-4 border-b-2 border-cyan-800 pb-3">
        <Logo className="h-16 w-auto max-w-[8.5rem] print:h-[18mm] print:max-w-[32mm]" />
        <div className="min-w-0 flex-1 text-right">
          <p className="text-lg font-extrabold text-cyan-950">{institute.nameFa}</p>
          <p className="text-[11px] font-bold text-slate-600">{institute.nameEn}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-600">{institute.address}</p>
          <p className="text-[11px] font-bold text-cyan-900" dir="ltr">
            {institute.phone}
            {institute.phoneAlt ? ` · ${institute.phoneAlt}` : ""}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-base font-extrabold text-slate-900">گزارش پرونده سلامت</h1>
          <p className="text-[11px] text-slate-500">تاریخ تهیه: {preparedAt}</p>
        </div>
        {profile ? (
          <div className="rounded-md border border-cyan-200 bg-cyan-50/80 px-3 py-1.5 text-[11px] leading-5">
            <p>
              <span className="text-slate-500">بیمار: </span>
              <span className="font-extrabold text-slate-900">{profile.name}</span>
            </p>
            <p dir="ltr" className="font-bold text-slate-700">
              {profile.phone}
            </p>
            {profile.nationalId ? (
              <p>
                <span className="text-slate-500">کد ملی: </span>
                {profile.nationalId}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );

  return (
    <div
      className={`${WEB_PAGE_CONTAINER} space-y-6 print:max-w-none print:px-0 print:py-0`}
      data-page="health-record-report"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">گزارش کلی پرونده سلامت</h1>
          <p className="mt-1 text-xs text-slate-500">
            برای ذخیره PDF از «چاپ / PDF» استفاده کنید — خروجی با سربرگ درمانگاه ذخیره می‌شود.
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

      <div className="health-report-sheet rounded-xl border-2 border-cyan-800 bg-white p-5 sm:p-6 print:rounded-none">
        {letterhead}

        {error ? <p className="mt-4 text-sm text-rose-600 print:hidden">{error}</p> : null}
        {loading ? (
          <p className="mt-4 text-sm text-slate-500 print:hidden">در حال بارگذاری…</p>
        ) : sectionsWithData.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">هنوز موردی در پرونده ثبت نشده است.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {sectionsWithData.map((section) => (
              <section
                key={section.id}
                className="health-report-section break-inside-avoid"
              >
                <h2 className="mb-2 border-b border-cyan-200 pb-1 text-sm font-extrabold text-cyan-950">
                  {section.label}
                </h2>
                <ul className="space-y-2">
                  {(grouped.get(section.id) || []).map((item) => (
                    <HealthRecordEntryView
                      key={item.id}
                      item={item}
                      section={isKnownSection(item.section) ? item.section : section.id}
                      className="health-report-entry rounded-lg border-slate-200 p-2.5 print:rounded-none"
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <footer className="health-report-footer mt-6 border-t-2 border-cyan-800 pt-2 text-[10px] leading-5 text-slate-500">
          این گزارش از سامانه {institute.nameFa} تهیه شده است. {institute.address}
        </footer>
      </div>
    </div>
  );
}
