"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { fetchAdminOps, patchAdminOps, postAdminOps } from "@/lib/operations/client";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type ListItem = {
  id: string;
  clinicName: string;
  city?: string | null;
  region?: string | null;
  updatedAt: string;
};

type Detail = ListItem & {
  prices?: Array<{
    id: string;
    priceNum: number | null;
    dentalTariffItem: { id: string; title: string; priceNum: number };
  }>;
};

const emptyForm = {
  clinicName: "",
  managementName: "",
  city: "",
  region: "",
  notes: "",
};

export default function AdminCompetitorAnalysisPage() {
  const [tab, setTab] = useState<"new" | "centers">("new");
  const [items, setItems] = useState<ListItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reload = useCallback(async () => {
    const data = await fetchAdminOps<{ items: ListItem[] }>(
      "/api/admin/operations/competitor-clinics",
    );
    setItems(data.items);
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  async function loadDetail(id: string) {
    const data = await fetchAdminOps<{ item: Detail }>(
      `/api/admin/operations/competitor-clinics/${encodeURIComponent(id)}`,
    );
    setDetail(data.item);
    setSelectedId(id);
    setTab("centers");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const data = await postAdminOps<{ item: { id: string } }>(
        "/api/admin/operations/competitor-clinics",
        form,
      );
      setSuccess("مرکز ثبت شد.");
      setForm(emptyForm);
      await reload();
      await loadDetail(data.item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت ناموفق");
    }
  }

  async function savePrices() {
    if (!detail) return;
    setError("");
    try {
      await patchAdminOps(`/api/admin/operations/competitor-clinics/${detail.id}`, {
        prices: (detail.prices || []).map((p) => ({
          dentalTariffItemId: p.dentalTariffItem.id,
          priceNum: p.priceNum,
        })),
      });
      setSuccess("قیمت‌ها ذخیره شد.");
      await loadDetail(detail.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره ناموفق");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">تحلیل رقبا</h1>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tab === "new" ? "primary" : "outline"} onClick={() => setTab("new")}>
          جدید
        </Button>
        <Button
          type="button"
          variant={tab === "centers" ? "primary" : "outline"}
          onClick={() => setTab("centers")}
        >
          مراکز
        </Button>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-teal-700">{success}</p> : null}

      {tab === "new" ? (
        <Card hover={false} className="p-5">
          <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-2">
            <div>
              <FormLabel>نام کلینیک</FormLabel>
              <FormInput
                value={form.clinicName}
                onChange={(e) => setForm((f) => ({ ...f, clinicName: e.target.value }))}
                required
              />
            </div>
            <div>
              <FormLabel>نام مدیریت</FormLabel>
              <FormInput
                value={form.managementName}
                onChange={(e) => setForm((f) => ({ ...f, managementName: e.target.value }))}
              />
            </div>
            <div>
              <FormLabel>شهر</FormLabel>
              <FormInput value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <FormLabel>منطقه</FormLabel>
              <FormInput
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <FormLabel>یادداشت</FormLabel>
              <FormTextarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">ثبت مرکز</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {tab === "centers" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <AdminTable headers={["کلینیک", "شهر", "بروزرسانی", ""]} empty="مرکزی ثبت نشده.">
            {items.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-bold">{row.clinicName}</td>
                <td className="px-4 py-3">{row.city || "—"}</td>
                <td className="px-4 py-3 text-xs">{new Date(row.updatedAt).toLocaleDateString("fa-IR")}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-xs font-bold text-teal-700"
                    onClick={() => void loadDetail(row.id)}
                  >
                    ویرایش
                  </button>
                </td>
              </tr>
            ))}
          </AdminTable>

          {detail ? (
            <Card hover={false} className="p-5">
              <h2 className="mb-3 text-lg font-bold">{detail.clinicName}</h2>
              <p className="mb-4 text-xs text-slate-500">لیست قیمت — تعرفه دندان</p>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {(detail.prices || []).map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{p.dentalTariffItem.title}</span>
                    <FormInput
                      type="number"
                      className="w-28"
                      value={p.priceNum ?? ""}
                      onChange={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value);
                        setDetail((d) =>
                          d
                            ? {
                                ...d,
                                prices: d.prices?.map((row) =>
                                  row.id === p.id ? { ...row, priceNum: v } : row,
                                ),
                              }
                            : d,
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
              <Button type="button" className="mt-4" onClick={() => void savePrices()}>
                ذخیره قیمت‌ها
              </Button>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
