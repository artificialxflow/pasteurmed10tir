"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import {
  HEALTH_SECTIONS,
  fieldsForSection,
  sectionAllowsUpload,
  type HealthSectionField,
  type HealthSectionId,
} from "@/lib/health-record/sections";
import { fetchPatientOps, postPatientOps } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Entry = {
  id: string;
  section: string;
  date: string;
  payload: Record<string, unknown>;
  attachments?: Array<{ id: string; path: string; originalName: string }>;
};

function emptyValues(fields: HealthSectionField[]): Record<string, string> {
  const next: Record<string, string> = {};
  for (const field of fields) next[field.key] = "";
  return next;
}

export function HealthRecordPage({ variant = "web" }: { variant?: "web" | "app" }) {
  const accountHref = variant === "app" ? ROUTES.app.account : ROUTES.web.account;
  const [section, setSection] = useState<HealthSectionId>("vitals");
  const [items, setItems] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const fields = useMemo(() => fieldsForSection(section), [section]);
  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(fieldsForSection("vitals")));

  useEffect(() => {
    setValues(emptyValues(fields));
  }, [fields]);

  const reload = useCallback(() => {
    void fetchPatientOps<{ items: Entry[] }>(
      `/api/operations/health-record/entries?section=${encodeURIComponent(section)}`,
    )
      .then((data) => setItems(data.items || []))
      .catch((e: Error) => setError(e.message));
  }, [section]);

  useEffect(() => {
    reload();
  }, [reload]);

  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = (values[field.key] || "").trim();
      if (!raw) continue;
      payload[field.key] = field.kind === "number" ? Number(raw) : raw;
    }
    void postPatientOps<{ item: Entry }>("/api/operations/health-record/entries", {
      section,
      date,
      ...payload,
    })
      .then((data) => {
        setMessage(`ثبت شد: ${data.item.id}`);
        setValues(emptyValues(fields));
        reload();
      })
      .catch((err: Error) => setError(err.message));
  }

  async function uploadFor(entryId: string, file: File | null) {
    if (!file) return;
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(
        `/api/operations/health-record/entries/${encodeURIComponent(entryId)}/attachments`,
        { method: "POST", body: fd, credentials: "include" },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "آپلود ناموفق");
      setMessage("فایل پیوست شد.");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "آپلود ناموفق");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6" data-page="health-record">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">پرونده سلامت</h1>
          <p className="mt-1 text-xs text-slate-500">تاریخ‌ها در فرم و سوابق شمسی نمایش داده می‌شوند.</p>
        </div>
        <Link href={accountHref} className="text-xs font-bold text-teal-700">
          بازگشت به حساب
        </Link>
      </div>

      <Card hover={false} className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4 md:grid-cols-6">
        {HEALTH_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`rounded-xl border px-2 py-3 text-center text-[0.7rem] font-bold transition ${
              section === s.id
                ? "border-teal-500 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-800 hover:border-teal-300"
            }`}
          >
            <span className="block text-lg">{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </Card>

      <Card hover={false} className="space-y-3 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">
          ثبت جدید — {HEALTH_SECTIONS.find((s) => s.id === section)?.label}
        </h2>
        <form onSubmit={submit} className="space-y-3">
          <JalaliBirthDateField label="تاریخ (شمسی)" value={date} onChange={setDate} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className={field.kind === "textarea" ? "sm:col-span-2" : ""}>
                <FormLabel>{field.label}</FormLabel>
                {field.kind === "textarea" ? (
                  <FormTextarea
                    rows={3}
                    value={values[field.key] || ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                ) : (
                  <FormInput
                    value={values[field.key] || ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <Button type="submit" className="text-sm">
            ذخیره در پرونده
          </Button>
        </form>
      </Card>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-teal-800">{message}</p> : null}

      <Card hover={false} className="p-4">
        <h2 className="mb-3 text-sm font-extrabold text-slate-900">سوابق این بخش</h2>
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">هنوز موردی ثبت نشده است.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                <p className="font-bold text-slate-900">{formatJalaliDate(item.date)}</p>
                <p className="mt-1 font-mono text-[0.65rem] text-slate-400">{item.id}</p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-2 text-[0.7rem] text-slate-700">
                  {JSON.stringify(item.payload, null, 2)}
                </pre>
                {(item.attachments || []).length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs">
                    {item.attachments!.map((a) => (
                      <li key={a.id}>
                        <a className="text-teal-700 underline" href={a.path} target="_blank" rel="noreferrer">
                          {a.originalName || a.path}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {sectionAllowsUpload(section) ? (
                  <label className="mt-2 block text-xs font-bold text-slate-600">
                    پیوست مدرک / تصویر
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="mt-1 block w-full text-xs"
                      onChange={(ev) => void uploadFor(item.id, ev.target.files?.[0] || null)}
                    />
                  </label>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
