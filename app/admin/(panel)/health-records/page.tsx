"use client";

import { HealthRecordEntryView } from "@/components/health-record/HealthRecordEntryView";
import { HealthRecordFormFields } from "@/components/health-record/HealthRecordFormFields";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel } from "@/components/ui/Card";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import {
  HEALTH_SECTIONS,
  fieldsForSection,
  isKnownSection,
  type HealthSectionField,
  type HealthSectionId,
} from "@/lib/health-record/sections";
import { fetchAdminOps, postAdminOps } from "@/lib/operations/client";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Entry = {
  id: string;
  section: string;
  date: string;
  payload: Record<string, unknown>;
  attachments?: Array<{ id: string; path: string; originalName: string }>;
};

type Match = { id: string; name: string; phone: string };

function emptyValues(fields: HealthSectionField[]): Record<string, string> {
  const next: Record<string, string> = {};
  for (const field of fields) next[field.key] = "";
  return next;
}

export default function AdminHealthRecordsPage() {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [section, setSection] = useState<HealthSectionId | "all">("all");
  const [user, setUser] = useState<{ id: string; phone: string; name: string } | null>(null);
  const [items, setItems] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [writeSection, setWriteSection] = useState<HealthSectionId>("vitals");
  const fields = useMemo(() => fieldsForSection(writeSection), [writeSection]);
  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(fieldsForSection("vitals")));

  useEffect(() => {
    setValues(emptyValues(fields));
  }, [fields]);

  async function searchMatches(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    setMessage("");
    setUser(null);
    setItems([]);
    if (query.trim().length < 2) {
      setError("حداقل دو حرف از نام یا بخشی از موبایل را وارد کنید.");
      setMatches([]);
      return;
    }
    try {
      const data = await fetchAdminOps<{ matches: Match[] }>(
        `/api/admin/operations/health-records?q=${encodeURIComponent(query.trim())}`,
      );
      const list = data.matches || [];
      setMatches(list);
      if (list.length === 0) setError("بیماری با این نام یا موبایل یافت نشد.");
      if (list.length === 1) await loadUser(list[0].id);
    } catch (err) {
      setMatches([]);
      setError(err instanceof Error ? err.message : "جستجو ناموفق");
    }
  }

  async function loadUser(userId: string) {
    setError("");
    const qs = new URLSearchParams({ userId });
    if (section !== "all") qs.set("section", section);
    const data = await fetchAdminOps<{
      user: { id: string; phone: string; name: string };
      items: Entry[];
    }>(`/api/admin/operations/health-records?${qs.toString()}`);
    setUser(data.user);
    setItems(data.items || []);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("ابتدا بیمار را از لیست انتخاب کنید.");
      return;
    }
    setError("");
    setMessage("");
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = (values[field.key] || "").trim();
      if (!raw) continue;
      payload[field.key] = field.kind === "number" ? Number(raw) : raw;
    }
    void postAdminOps<{ item: Entry }>("/api/admin/operations/health-records/entries", {
      patientPhone: user.phone,
      section: writeSection,
      date,
      ...payload,
    })
      .then(() => {
        setMessage("ثبت شد.");
        setValues(emptyValues(fields));
        return loadUser(user.id);
      })
      .catch((err: Error) => setError(err.message));
  }

  async function uploadFor(entryId: string, file: File | null) {
    if (!file || !user) return;
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(
        `/api/admin/operations/health-records/entries/${encodeURIComponent(entryId)}/attachments`,
        { method: "POST", body: fd, credentials: "include" },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "آپلود ناموفق");
      setMessage("عکس به همان تاریخ پیوست شد.");
      await loadUser(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "آپلود ناموفق");
    }
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-teal-800">{message}</p> : null}

      <Card hover={false} className="space-y-3 p-4">
        <p className="font-extrabold text-slate-900">جستجوی پرونده بیمار</p>
        <p className="text-xs text-slate-500">نام یا موبایل را بنویسید، از لیست انتخاب کنید.</p>
        <form onSubmit={(e) => void searchMatches(e)} className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <FormLabel>نام یا موبایل</FormLabel>
            <FormInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثلاً مجتبی یا 0912"
              required
            />
          </div>
          <div>
            <FormLabel>بخش سوابق</FormLabel>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              value={section}
              onChange={(e) => setSection(e.target.value as HealthSectionId | "all")}
            >
              <option value="all">همه</option>
              {HEALTH_SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" className="text-sm">
              جستجو
            </Button>
          </div>
        </form>
        {matches.length > 0 ? (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
            {matches.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between px-3 py-2 text-right text-sm ${
                    user?.id === item.id ? "bg-teal-50 font-bold text-teal-900" : "bg-white hover:bg-slate-50"
                  }`}
                  onClick={() => void loadUser(item.id).catch((err: Error) => setError(err.message))}
                >
                  <span>{item.name}</span>
                  <span dir="ltr" className="font-mono text-xs text-slate-500">
                    {item.phone}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {user ? (
          <p className="text-sm text-slate-600">
            انتخاب‌شده: {user.name} · <span dir="ltr">{user.phone}</span>
          </p>
        ) : null}
      </Card>

      <Card hover={false} className="space-y-3 p-4">
        <p className="font-extrabold text-slate-900">ثبت مورد جدید</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <FormLabel>بخش ثبت</FormLabel>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              value={writeSection}
              onChange={(e) => setWriteSection(e.target.value as HealthSectionId)}
            >
              {HEALTH_SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <JalaliBirthDateField label="تاریخ (شمسی)" value={date} onChange={setDate} />
          <HealthRecordFormFields
            fields={fields}
            values={values}
            onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
          />
          <Button type="submit" className="text-sm" disabled={!user}>
            ذخیره در پرونده
          </Button>
        </form>
      </Card>

      <Card hover={false} className="p-4">
        <p className="mb-3 font-extrabold text-slate-900">سوابق</p>
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">موردی نیست.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <HealthRecordEntryView
                key={item.id}
                item={item}
                section={isKnownSection(item.section) ? item.section : writeSection}
                title={HEALTH_SECTIONS.find((s) => s.id === item.section)?.label}
                onUpload={uploadFor}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
