"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { fetchAdminOps, postAdminOps, downloadAdminOpsExport } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type ReferralItem = {
  id: string;
  referrerName: string;
  patientName: string;
  patientPhone: string;
  specialistName: string;
  note?: string;
  createdAt: string;
};

export default function AdminSpecialistReferralsPage() {
  const [items, setItems] = useState<ReferralItem[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    referrerName: "",
    patientName: "",
    patientPhone: "",
    specialistName: "",
    note: "",
  });

  const reload = useCallback(async () => {
    const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
    const data = await fetchAdminOps<{ items: ReferralItem[] }>(
      `/api/admin/operations/specialist-referrals${q}`,
    );
    setItems(data.items);
  }, [search]);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await postAdminOps("/api/admin/operations/specialist-referrals", form);
      setForm({
        referrerName: "",
        patientName: "",
        patientPhone: "",
        specialistName: "",
        note: "",
      });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت ناموفق");
    }
  }

  function exportFile(format: "xlsx" | "csv") {
    const stamp = new Date().toISOString().slice(0, 10);
    void downloadAdminOpsExport(
      `/api/admin/operations/specialist-referrals/export?format=${format}`,
      `specialist-referrals-${stamp}.${format}`,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-900">ارجاع به پزشک متخصص</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => exportFile("xlsx")}>
            Excel
          </Button>
          <Button type="button" variant="outline" onClick={() => exportFile("csv")}>
            CSV
          </Button>
        </div>
      </div>

      <Card hover={false} className="p-5">
        <h2 className="mb-4 text-lg font-bold">ثبت ارجاع جدید</h2>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <FormLabel>نام ارجاع‌دهنده</FormLabel>
            <FormInput
              value={form.referrerName}
              onChange={(e) => setForm((f) => ({ ...f, referrerName: e.target.value }))}
              required
            />
          </div>
          <div>
            <FormLabel>نام بیمار</FormLabel>
            <FormInput
              value={form.patientName}
              onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
              required
            />
          </div>
          <div>
            <FormLabel>شماره تماس بیمار</FormLabel>
            <FormInput
              value={form.patientPhone}
              onChange={(e) => setForm((f) => ({ ...f, patientPhone: e.target.value }))}
              required
              dir="ltr"
              className="text-left"
            />
          </div>
          <div>
            <FormLabel>متخصص ارجاع‌شده</FormLabel>
            <FormInput
              value={form.specialistName}
              onChange={(e) => setForm((f) => ({ ...f, specialistName: e.target.value }))}
              required
            />
          </div>
          <div className="md:col-span-2">
            <FormLabel>توضیح (اختیاری)</FormLabel>
            <FormTextarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">ثبت</Button>
          </div>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>

      <div className="flex gap-2">
        <FormInput
          placeholder="جستجو نام / تماس / متخصص…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Button type="button" variant="outline" onClick={() => void reload()}>
          اعمال
        </Button>
      </div>

      <AdminTable
        headers={["تاریخ", "ارجاع‌دهنده", "بیمار", "تماس", "متخصص", "توضیح"]}
        empty="ارجاعی ثبت نشده."
      >
        {items.map((row) => (
          <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
            <td className="px-4 py-3 text-xs">{formatJalaliDate(row.createdAt)}</td>
            <td className="px-4 py-3">{row.referrerName}</td>
            <td className="px-4 py-3">{row.patientName}</td>
            <td className="px-4 py-3 font-mono text-xs">{row.patientPhone}</td>
            <td className="px-4 py-3">{row.specialistName}</td>
            <td className="max-w-xs px-4 py-3 text-xs text-slate-600">{row.note || "—"}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
