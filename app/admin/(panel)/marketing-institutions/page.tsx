"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Card";
import { downloadAdminOpsExport, fetchAdminOps } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { useCallback, useEffect, useState } from "react";

type Row = {
  companyName: string;
  visitorName: string;
  lastReportAt: string;
  reportCount: number;
  contacts: Array<{ name: string; phone: string; role: string }>;
};

export default function AdminMarketingInstitutionsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
    const data = await fetchAdminOps<{ items: Row[] }>(
      `/api/admin/operations/marketing/institutions${q}`,
    );
    setItems(data.items);
  }, [search]);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-900">مؤسسات / شرکت‌های بازاریابی</h1>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void downloadAdminOpsExport(
              `/api/admin/operations/marketing/institutions?format=csv`,
              `marketing-institutions-${new Date().toISOString().slice(0, 10)}.csv`,
            )
          }
        >
          Export CSV
        </Button>
      </div>

      <div className="flex gap-2">
        <FormInput
          placeholder="جستجو نام شرکت…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Button type="button" variant="outline" onClick={() => void reload()}>
          اعمال
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <AdminTable
        headers={["شرکت", "ویزیتور", "آخرین گزارش", "تعداد", "مسئول ۱", "مسئول ۲", "مسئول ۳"]}
        empty="مؤسسه‌ای یافت نشد."
      >
        {items.map((row) => (
          <tr key={`${row.companyName}-${row.visitorName}`} className="border-t border-slate-100">
            <td className="px-4 py-3 font-bold">{row.companyName}</td>
            <td className="px-4 py-3">{row.visitorName}</td>
            <td className="px-4 py-3 text-xs">{formatJalaliDate(row.lastReportAt)}</td>
            <td className="px-4 py-3">{row.reportCount.toLocaleString("fa-IR")}</td>
            {[0, 1, 2].map((i) => {
              const c = row.contacts[i];
              return (
                <td key={i} className="px-4 py-3 text-xs text-slate-600">
                  {c ? (
                    <>
                      {c.name}
                      {c.role ? ` · ${c.role}` : ""}
                      {c.phone ? (
                        <span className="block font-mono text-[0.65rem]" dir="ltr">
                          {c.phone}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
