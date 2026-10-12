"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import { fetchAdminOps, patchAdminOps, postAdminOps } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Item = {
  id: string;
  title?: string;
  patientName?: string;
  patientPhone?: string;
  followUpDate?: string;
  followUpNotes?: string;
  details?: string;
  updatedAt: string;
};

const emptyForm = {
  title: "",
  patientName: "",
  patientPhone: "",
  followUpDate: "",
  followUpNotes: "",
  details: "",
};

export default function AdminPasteurWorkReportsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
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
    try {
      if (editId) {
        await patchAdminOps("/api/admin/operations/pasteur-work-reports", { id: editId, ...form });
      } else {
        await postAdminOps("/api/admin/operations/pasteur-work-reports", form);
      }
      setForm(emptyForm);
      setEditId(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت ناموفق");
    }
  }

  function startEdit(row: Item) {
    setEditId(row.id);
    setForm({
      title: row.title || "",
      patientName: row.patientName || "",
      patientPhone: row.patientPhone || "",
      followUpDate: row.followUpDate || "",
      followUpNotes: row.followUpNotes || "",
      details: row.details || "",
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">گزارش کار پاستور پلاس</h1>

      <Card hover={false} className="p-5">
        <h2 className="mb-4 text-lg font-bold">{editId ? "ویرایش گزارش" : "ثبت گزارش جدید"}</h2>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <FormLabel>عنوان (اختیاری)</FormLabel>
            <FormInput
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <FormLabel>نام بیمار / طرف (اختیاری)</FormLabel>
            <FormInput
              value={form.patientName}
              onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
            />
          </div>
          <div>
            <FormLabel>تماس (اختیاری)</FormLabel>
            <FormInput
              value={form.patientPhone}
              onChange={(e) => setForm((f) => ({ ...f, patientPhone: e.target.value }))}
              dir="ltr"
              className="text-left"
            />
          </div>
          <div>
            <FormLabel>تاریخ پیگیری (اختیاری)</FormLabel>
            <JalaliBirthDateField
              value={form.followUpDate}
              onChange={(v) => setForm((f) => ({ ...f, followUpDate: v }))}
            />
          </div>
          <div className="md:col-span-2">
            <FormLabel>توضیحات پیگیری</FormLabel>
            <FormTextarea
              value={form.followUpNotes}
              onChange={(e) => setForm((f) => ({ ...f, followUpNotes: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="md:col-span-2">
            <FormLabel>جزئیات گزارش</FormLabel>
            <FormTextarea
              value={form.details}
              onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit">{editId ? "ذخیره تغییرات" : "ثبت"}</Button>
            {editId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditId(null);
                  setForm(emptyForm);
                }}
              >
                انصراف
              </Button>
            ) : null}
          </div>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>

      <AdminTable
        headers={["به‌روزرسانی", "عنوان", "بیمار", "تماس", "پیگیری", "عملیات"]}
        empty="گزارشی ثبت نشده."
      >
        {items.map((row) => (
          <tr key={row.id} className="border-t border-slate-100">
            <td className="px-4 py-3 text-xs">{formatJalaliDate(row.updatedAt)}</td>
            <td className="px-4 py-3">{row.title || "—"}</td>
            <td className="px-4 py-3">{row.patientName || "—"}</td>
            <td className="px-4 py-3 font-mono text-xs">{row.patientPhone || "—"}</td>
            <td className="px-4 py-3 text-xs">
              {row.followUpDate ? formatJalaliDate(row.followUpDate) : "—"}
              {row.followUpNotes ? (
                <p className="mt-1 text-slate-500">{row.followUpNotes}</p>
              ) : null}
            </td>
            <td className="px-4 py-3">
              <Button type="button" variant="outline" className="text-xs" onClick={() => startEdit(row)}>
                ویرایش
              </Button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
