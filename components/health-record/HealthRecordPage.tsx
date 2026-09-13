"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { HEALTH_SECTIONS, type HealthSectionId } from "@/lib/health-record/sections";
import { fetchPatientOps, postPatientOps } from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Entry = {
  id: string;
  section: string;
  date: string;
  payload: Record<string, unknown>;
  attachments?: Array<{ id: string; path: string; originalName: string }>;
};

export function HealthRecordPage({ variant = "web" }: { variant?: "web" | "app" }) {
  const accountHref = variant === "app" ? ROUTES.app.account : ROUTES.web.account;
  const [section, setSection] = useState<HealthSectionId>("vitals");
  const [items, setItems] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bpSys, setBpSys] = useState("120");
  const [bpDia, setBpDia] = useState("80");
  const [hr, setHr] = useState("72");
  const [glucose, setGlucose] = useState("");
  const [notes, setNotes] = useState("");
  const [complaint, setComplaint] = useState("");
  const [dentalNote, setDentalNote] = useState("");

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
    const payload: Record<string, unknown> = { notes: notes.trim() || undefined };
    if (section === "vitals") {
      payload.bpSystolic = Number(bpSys) || undefined;
      payload.bpDiastolic = Number(bpDia) || undefined;
      payload.hr = Number(hr) || undefined;
      if (glucose.trim()) payload.glucose = Number(glucose);
    } else if (section === "general") {
      payload.complaint = complaint.trim();
    } else if (section === "dental") {
      payload.note = dentalNote.trim();
    }
    void postPatientOps<{ item: Entry }>("/api/operations/health-record/entries", {
      section,
      date,
      ...payload,
    })
      .then((data) => {
        setMessage(`ثبت شد: ${data.item.id}`);
        setNotes("");
        setComplaint("");
        setDentalNote("");
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
          <p className="mt-1 text-xs text-slate-500">تاریخ‌ها در سامانه به‌صورت میلادی ذخیره و در UI شمسی نمایش داده می‌شوند.</p>
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
            disabled={!s.mvp}
            onClick={() => s.mvp && setSection(s.id)}
            className={`rounded-xl border px-2 py-3 text-center text-[0.7rem] font-bold transition ${
              section === s.id
                ? "border-teal-500 bg-teal-50 text-teal-900"
                : s.mvp
                  ? "border-slate-200 bg-white text-slate-800 hover:border-teal-300"
                  : "cursor-not-allowed border-dashed border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            <span className="block text-lg">{s.emoji}</span>
            {s.label}
            {!s.mvp ? <span className="mt-1 block text-[0.6rem]">به‌زودی</span> : null}
          </button>
        ))}
      </Card>

      <Card hover={false} className="space-y-3 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">
          ثبت جدید — {HEALTH_SECTIONS.find((s) => s.id === section)?.label}
        </h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <FormLabel>تاریخ (ISO)</FormLabel>
            <FormInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          {section === "vitals" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <FormLabel>فشار سیستول</FormLabel>
                <FormInput value={bpSys} onChange={(e) => setBpSys(e.target.value)} />
              </div>
              <div>
                <FormLabel>دیاستول</FormLabel>
                <FormInput value={bpDia} onChange={(e) => setBpDia(e.target.value)} />
              </div>
              <div>
                <FormLabel>ضربان</FormLabel>
                <FormInput value={hr} onChange={(e) => setHr(e.target.value)} />
              </div>
              <div>
                <FormLabel>قند</FormLabel>
                <FormInput value={glucose} onChange={(e) => setGlucose(e.target.value)} />
              </div>
            </div>
          ) : null}
          {section === "general" ? (
            <div>
              <FormLabel>شکایت / شرح</FormLabel>
              <FormTextarea value={complaint} onChange={(e) => setComplaint(e.target.value)} rows={3} />
            </div>
          ) : null}
          {section === "dental" ? (
            <div>
              <FormLabel>یادداشت دندانپزشکی</FormLabel>
              <FormTextarea value={dentalNote} onChange={(e) => setDentalNote(e.target.value)} rows={3} />
            </div>
          ) : null}
          <div>
            <FormLabel>یادداشت</FormLabel>
            <FormInput value={notes} onChange={(e) => setNotes(e.target.value)} />
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
                <p className="font-bold text-slate-900">{item.date}</p>
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
                {(section === "vitals" || section === "dental") && (
                  <label className="mt-2 block text-xs font-bold text-slate-600">
                    پیوست تصویر (نوار / عکس)
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-xs"
                      onChange={(ev) => void uploadFor(item.id, ev.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
