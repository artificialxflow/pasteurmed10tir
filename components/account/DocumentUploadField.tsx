"use client";

import { deleteLoanDocumentApi, uploadLoanDocumentApi } from "@/lib/commerce/client";
import type { LoanDocKind } from "@/lib/loan-documents/constants";
import { useState, type ChangeEvent } from "react";

type Doc = {
  id?: string;
  kind?: string;
  filename?: string;
  mime?: string;
};

export function DocumentUploadField({
  kind,
  label,
  required,
  hint,
  items,
  onChange,
}: {
  kind: LoanDocKind;
  label: string;
  required?: boolean;
  hint?: string;
  items: Doc[];
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mine = items.filter((item) => item.kind === kind);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await uploadLoanDocumentApi(kind, file);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "آپلود ناموفق");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function remove(id?: string) {
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      await deleteLoanDocumentApi(id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف ناموفق");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-800">
          {label}
          {required ? <span className="text-rose-600"> *</span> : null}
        </p>
        <label className="cursor-pointer text-xs font-bold text-teal-700">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={onFile}
            disabled={busy}
          />
          <span className="rounded-lg border border-teal-200 bg-teal-50 px-2 py-1">
            {busy ? "…" : "انتخاب فایل"}
          </span>
        </label>
      </div>
      {hint ? <p className="mt-1 text-[11px] leading-5 text-slate-500">{hint}</p> : null}
      {mine.map((item) => (
        <div key={String(item.id)} className="mt-2 flex items-center justify-between gap-2 text-xs">
          <span className="truncate">
            {item.mime?.startsWith("image/") ? "🖼" : "📄"} {item.filename}
          </span>
          <button
            type="button"
            className="font-bold text-rose-700"
            disabled={busy}
            onClick={() => void remove(item.id)}
          >
            حذف
          </button>
        </div>
      ))}
      {error ? <p className="mt-1 text-xs font-bold text-rose-600">{error}</p> : null}
    </div>
  );
}
