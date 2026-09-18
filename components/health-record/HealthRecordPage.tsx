"use client";

import { HealthRecordAttachmentFormField } from "@/components/health-record/HealthRecordAttachmentFormField";
import { HealthRecordBodyMap } from "@/components/health-record/HealthRecordBodyMap";
import { HealthRecordEntryView } from "@/components/health-record/HealthRecordEntryView";
import { HealthRecordFormFields } from "@/components/health-record/HealthRecordFormFields";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import {
  HEALTH_SECTIONS,
  fieldsForSection,
  sectionIsAttachmentOnly,
  type HealthSectionField,
  type HealthSectionId,
} from "@/lib/health-record/sections";
import { WEB_PAGE_CONTAINER } from "@/lib/layout";
import { fetchPatientOps, postPatientOps } from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const [section, setSection] = useState<HealthSectionId>("general");
  const [items, setItems] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const fields = useMemo(() => fieldsForSection(section), [section]);
  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(fieldsForSection("general")));
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  function commitSection(id: HealthSectionId) {
    setSection(id);
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  useEffect(() => {
    setValues(emptyValues(fields));
    setPendingFile(null);
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
      .then(async (data) => {
        if (pendingFile && data.item?.id) {
          await uploadFor(data.item.id, pendingFile);
          setPendingFile(null);
          setMessage("در پرونده ثبت شد و فایل پیوست شد.");
        } else {
          setMessage(
            sectionIsAttachmentOnly(section)
              ? "تاریخ ثبت شد. از لیست پایین می‌توانید فایل گزارش را بارگذاری کنید."
              : "در پرونده این بخش ثبت شد.",
          );
        }
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
    <div className={`${WEB_PAGE_CONTAINER} space-y-6`} data-page="health-record">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">پرونده سلامت</h1>
          <p className="mt-1 text-xs text-slate-500">
            تاریخ شمسی است. ویزیت پزشک با نام پزشک در همان بخش تخصص دیده می‌شود.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={variant === "app" ? ROUTES.app.healthRecordReport : ROUTES.web.healthRecordReport}
            className="text-xs font-bold text-cyan-800"
          >
            گزارش کلی پرونده
          </Link>
          <Link href={accountHref} className="text-xs font-bold text-teal-700">
            بازگشت به حساب
          </Link>
        </div>
      </div>

      <HealthRecordBodyMap committedSection={section} onCommit={commitSection} />

      <div ref={formRef}>
        <Card hover={false} className="space-y-3 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">
          ثبت جدید — {HEALTH_SECTIONS.find((s) => s.id === section)?.label}
        </h2>
        <form onSubmit={submit} className="space-y-3">
          <JalaliBirthDateField label="تاریخ (شمسی)" value={date} onChange={setDate} />
          <HealthRecordAttachmentFormField
            section={section}
            file={pendingFile}
            onFileChange={setPendingFile}
          />
          {!sectionIsAttachmentOnly(section) ? (
            <HealthRecordFormFields
              fields={fields}
              values={values}
              onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
            />
          ) : null}
          <Button type="submit" className="text-sm">
            ذخیره در پرونده
          </Button>
        </form>
        </Card>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-teal-800">{message}</p> : null}

      <Card hover={false} className="p-4">
        <h2 className="mb-3 text-sm font-extrabold text-slate-900">سوابق این بخش</h2>
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">هنوز موردی ثبت نشده است.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <HealthRecordEntryView
                key={item.id}
                item={item}
                section={section}
                onUpload={uploadFor}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
