"use client";

import { HealthRecordFormFields } from "@/components/health-record/HealthRecordFormFields";
import { Button } from "@/components/ui/Button";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import {
  fieldsForSection,
  sectionIsAttachmentOnly,
  type HealthSectionField,
  type HealthSectionId,
} from "@/lib/health-record/sections";
import { patchAdminOps } from "@/lib/operations/client";
import { FormEvent, useMemo, useState } from "react";

type Entry = {
  id: string;
  section: string;
  date: string;
  payload: Record<string, unknown>;
};

function valuesFromPayload(
  fields: HealthSectionField[],
  payload: Record<string, unknown>,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const field of fields) {
    const raw = payload[field.key];
    if (raw === undefined || raw === null) {
      next[field.key] = "";
      continue;
    }
    next[field.key] = String(raw);
  }
  return next;
}

export function HealthRecordEntryEditor({
  item,
  section,
  registrarOptions,
  onSaved,
  onCancel,
}: {
  item: Entry;
  section: HealthSectionId;
  registrarOptions: Array<{ id: string; name: string }>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const fields = useMemo(() => fieldsForSection(section), [section]);
  const attachmentOnly = sectionIsAttachmentOnly(section);
  const [date, setDate] = useState(item.date.slice(0, 10));
  const [values, setValues] = useState(() => valuesFromPayload(fields, item.payload));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (attachmentOnly) {
      setError("این بخش فقط پیوست است؛ تاریخ را می‌توانید تغییر دهید.");
    }
    setSaving(true);
    setError("");
    const payload: Record<string, unknown> = { ...item.payload };
    if (!attachmentOnly) {
      for (const field of fields) {
        const raw = (values[field.key] || "").trim();
        if (!raw) {
          delete payload[field.key];
          continue;
        }
        payload[field.key] = field.kind === "number" ? Number(raw) : raw;
      }
    }
    const body: { date: string; payload?: Record<string, unknown> } = { date };
    if (!attachmentOnly) body.payload = payload;

    void patchAdminOps<{ item: Entry }>(
      `/api/admin/operations/health-records/entries/${encodeURIComponent(item.id)}`,
      body,
    )
      .then(() => onSaved())
      .catch((err: Error) => setError(err.message))
      .finally(() => setSaving(false));
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-sm"
    >
      <p className="mb-2 text-xs font-bold text-amber-900">ویرایش ردیف پرونده</p>
      {error ? <p className="mb-2 text-xs text-rose-600">{error}</p> : null}
      <JalaliBirthDateField label="تاریخ (شمسی)" value={date} onChange={setDate} />
      {!attachmentOnly ? (
        <div className="mt-3">
          <HealthRecordFormFields
            fields={fields}
            values={values}
            onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
            registrarOptions={registrarOptions}
          />
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-600">فقط تاریخ قابل ویرایش است.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2 print:hidden">
        <Button type="submit" className="text-xs" disabled={saving}>
          {saving ? "در حال ذخیره…" : "ذخیره ویرایش"}
        </Button>
        <button
          type="button"
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
          onClick={onCancel}
        >
          انصراف
        </button>
      </div>
    </form>
  );
}