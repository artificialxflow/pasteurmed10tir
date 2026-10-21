"use client";

import {
  emptyPasteurWorkReportFormState,
  PasteurWorkReportFormFields,
  reportedAtIsoFromLocal,
  reportedAtLocalFromIso,
  type PasteurWorkReportFormState,
} from "@/components/admin/PasteurWorkReportForm";
import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchAdminOps, patchAdminOps, postAdminOps } from "@/lib/operations/client";
import { parsePasteurWorkPayload, type PasteurWorkPayload } from "@/lib/pasteur-work-report/payload";
import { formatJalaliDate } from "@/lib/patient";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Item = {
  id: string;
  title?: string;
  reportedAt?: string;
  payload?: PasteurWorkPayload;
  updatedAt: string;
};

export default function AdminPasteurWorkReportsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<PasteurWorkReportFormState>(emptyPasteurWorkReportFormState);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const data = await fetchAdminOps<{ items: Item[] }>(
      "/api/admin/operations/pasteur-work-reports",
    );
    setItems(data.items);
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const body = {
      title: form.title || undefined,
      reportedAt: reportedAtIsoFromLocal(form.reportedAtLocal),
      payload: form.payload,
    };
    try {
      if (editId) {
        await patchAdminOps("/api/admin/operations/pasteur-work-reports", { id: editId, ...body });
      } else {
        await postAdminOps("/api/admin/operations/pasteur-work-reports", body);
      }
      setForm(emptyPasteurWorkReportFormState());
      setEditId(null);
      setViewId(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت ناموفق");
    }
  }

  function startEdit(row: Item) {
    setEditId(row.id);
    setViewId(null);
    setForm({
      title: row.title || "",
      reportedAtLocal: reportedAtLocalFromIso(row.reportedAt),
      payload: parsePasteurWorkPayload(row.payload),
    });
  }

  function startView(row: Item) {
    setViewId(row.id);
    setEditId(null);
    setForm({
      title: row.title || "",
      reportedAtLocal: reportedAtLocalFromIso(row.reportedAt),
      payload: parsePasteurWorkPayload(row.payload),
    });
  }

  const readOnly = Boolean(viewId && !editId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">گزارش کار پاستور پلاس</h1>

      <Card hover={false} className="p-5">
        <h2 className="mb-4 text-lg font-bold">
          {readOnly ? "مشاهده گزارش" : editId ? "ویرایش گزارش" : "ثبت گزارش جدید"}
        </h2>
        {readOnly ? (
          <>
            <PasteurWorkReportFormFields state={form} onChange={setForm} readOnly />
            <div className="mt-4 space-y-4">
              {(["priorities", "kpis", "organizationalHealth", "strategicAlignment", "riskManagement", "emotionalAwareness"] as const).map(
                (key) => (
                  <div key={key} className="text-sm">
                    <p className="font-bold text-slate-800">{key}</p>
                    <ul className="mt-1 list-disc pr-5 text-slate-600">
                      {form.payload[key]
                        .filter((r) => r.title.trim())
                        .map((r, i) => (
                          <li key={i}>{r.title}</li>
                        ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
            <Button type="button" variant="outline" className="mt-4" onClick={() => setViewId(null)}>
              بستن
            </Button>
          </>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <PasteurWorkReportFormFields state={form} onChange={setForm} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{editId ? "ذخیره تغییرات" : "ثبت گزارش"}</Button>
              {editId || viewId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditId(null);
                    setViewId(null);
                    setForm(emptyPasteurWorkReportFormState());
                  }}
                >
                  انصراف
                </Button>
              ) : null}
            </div>
          </form>
        )}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>

      <AdminTable headers={["ثبت", "به‌روزرسانی", "عنوان", "عملیات"]} empty="گزارشی ثبت نشده.">
        {items.map((row) => (
          <tr key={row.id} className="border-t border-slate-100">
            <td className="px-4 py-3 text-xs">
              {row.reportedAt ? formatJalaliDate(row.reportedAt.slice(0, 10)) : "—"}
            </td>
            <td className="px-4 py-3 text-xs">{formatJalaliDate(row.updatedAt)}</td>
            <td className="px-4 py-3">{row.title || "—"}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="text-xs" onClick={() => startView(row)}>
                مشاهده
              </Button>
              <Button type="button" variant="outline" className="text-xs" onClick={() => startEdit(row)}>
                ویرایش
              </Button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
