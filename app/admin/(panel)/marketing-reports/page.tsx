"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormLabel } from "@/components/ui/Card";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import type { MarketingReportPublic } from "@/lib/marketing/mappers";
import { MARKETING_KIND_OPTIONS } from "@/lib/marketing/types";
import { fetchAdminOps, downloadAdminOpsExport } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type StatsRow = {
  visitorId: number;
  visitorName: string;
  visitorPhone: string;
  visitorCode: string;
  status: string;
  totalActivity: number;
  successCount: number;
  unsuccessfulCount: number;
  followUpCount: number;
  blockedCount: number;
  successRate: number | null;
};

export default function AdminMarketingReportsPage() {
  const [stats, setStats] = useState<StatsRow[]>([]);
  const [overallRate, setOverallRate] = useState<number | null>(null);
  const [detail, setDetail] = useState<MarketingReportPublic | null>(null);
  const [reports, setReports] = useState<MarketingReportPublic[]>([]);
  const [visitorFilter, setVisitorFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [error, setError] = useState("");

  const loadStats = useCallback(() => {
    void fetchAdminOps<{ items: StatsRow[]; overallSuccessRate: number | null }>(
      "/api/admin/operations/marketing/reports?mode=stats",
    )
      .then((data) => {
        setStats(data.items);
        setOverallRate(data.overallSuccessRate);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const loadReports = useCallback(() => {
    const q = new URLSearchParams();
    if (visitorFilter) q.set("visitorId", visitorFilter);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (blockedOnly) q.set("blocked", "1");
    void fetchAdminOps<{ items: MarketingReportPublic[] }>(
      `/api/admin/operations/marketing/reports?${q.toString()}`,
    )
      .then((data) => setReports(data.items))
      .catch((e: Error) => setError(e.message));
  }, [visitorFilter, from, to, blockedOnly]);

  useEffect(() => {
    loadStats();
    loadReports();
  }, [loadStats, loadReports]);

  function openDetail(id: string) {
    void fetchAdminOps<{ item: MarketingReportPublic }>(
      `/api/admin/operations/marketing/reports/${encodeURIComponent(id)}`,
    )
      .then((data) => setDetail(data.item))
      .catch((e: Error) => setError(e.message));
  }

  async function exportReports(format: "xlsx" | "csv") {
    const q = new URLSearchParams();
    if (visitorFilter) q.set("visitorId", visitorFilter);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (blockedOnly) q.set("blocked", "1");
    q.set("format", format);
    const ext = format === "csv" ? "csv" : "xlsx";
    await downloadAdminOpsExport(
      `/api/admin/operations/marketing/export?${q.toString()}`,
      `marketing-reports.${ext}`,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">گزارش بازاریابی ویزیتورها</h1>
          <p className="mt-1 text-sm text-slate-600">
            نرخ موفقیت کلی:{" "}
            {overallRate != null ? `${overallRate.toLocaleString("fa-IR")}٪` : "—"}
          </p>
        </div>
        <Link href={ROUTES.admin.visitors} className="text-sm font-bold text-teal-800 hover:underline">
          مدیریت ویزیتورها
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void exportReports("xlsx")}>
            Excel
          </Button>
          <Button type="button" variant="outline" onClick={() => void exportReports("csv")}>
            CSV
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>
      ) : null}

      <AdminTable
        headers={[
          "ویزیتور",
          "موبایل",
          "فعالیت",
          "موفق",
          "ناموفق",
          "پیگیری",
          "مسدود",
          "نرخ موفقیت",
          "گزارش",
        ]}
        empty="ویزیتوری ثبت نشده."
      >
        {stats.map((row) => (
          <tr key={row.visitorId} className="border-t border-slate-100">
            <td className="px-4 py-3 font-bold">{row.visitorName}</td>
            <td className="px-4 py-3 font-mono text-xs">{row.visitorPhone}</td>
            <td className="px-4 py-3">{row.totalActivity.toLocaleString("fa-IR")}</td>
            <td className="px-4 py-3">{row.successCount.toLocaleString("fa-IR")}</td>
            <td className="px-4 py-3">{row.unsuccessfulCount.toLocaleString("fa-IR")}</td>
            <td className="px-4 py-3">{row.followUpCount.toLocaleString("fa-IR")}</td>
            <td className="px-4 py-3">{row.blockedCount.toLocaleString("fa-IR")}</td>
            <td className="px-4 py-3">
              {row.successRate != null ? `${row.successRate.toLocaleString("fa-IR")}٪` : "—"}
            </td>
            <td className="px-4 py-3">
              <Button
                type="button"
                variant="outline"
                className="text-xs"
                onClick={() => setVisitorFilter(String(row.visitorId))}
              >
                فیلتر
              </Button>
            </td>
          </tr>
        ))}
      </AdminTable>

      <Card hover={false} className="grid gap-3 p-4 sm:grid-cols-3">
        <div>
          <FormLabel>فیلتر ویزیتور (ID)</FormLabel>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={visitorFilter}
            onChange={(e) => setVisitorFilter(e.target.value)}
            placeholder="مثلاً 1"
          />
        </div>
        <div>
          <FormLabel>از تاریخ</FormLabel>
          <JalaliBirthDateField value={from} onChange={(iso) => setFrom(iso || "")} />
        </div>
        <div>
          <FormLabel>تا تاریخ</FormLabel>
          <JalaliBirthDateField value={to} onChange={(iso) => setTo(iso || "")} />
        </div>
        <div className="sm:col-span-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={blockedOnly}
              onChange={(e) => setBlockedOnly(e.target.checked)}
            />
            فقط لیست مسدود / مسدودشده
          </label>
          <Button type="button" onClick={() => loadReports()}>
            اعمال فیلتر
          </Button>
        </div>
      </Card>

      <AdminTable headers={["تاریخ", "ویزیتور", "شرکت", "نوع", "جزئیات"]} empty="گزارشی نیست.">
        {reports.map((row) => (
          <tr key={row.id} className="border-t border-slate-100">
            <td className="px-4 py-3 text-xs">{formatJalaliDate(row.createdAt.slice(0, 10))}</td>
            <td className="px-4 py-3 text-xs">{row.visitorId}</td>
            <td className="px-4 py-3">{row.companyName || "—"}</td>
            <td className="px-4 py-3 text-xs">{row.kindLabel}</td>
            <td className="px-4 py-3">
              <button
                type="button"
                className="text-xs font-bold text-cyan-800"
                onClick={() => openDetail(row.id)}
              >
                تفصیلی
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      {detail ? (
        <Card hover={false} className="space-y-2 p-4">
          <div className="flex justify-between">
            <p className="font-extrabold">گزارش تفصیلی</p>
            <button type="button" className="text-sm text-slate-500" onClick={() => setDetail(null)}>
              بستن
            </button>
          </div>
          <p className="text-sm">{detail.companyName || detail.kindLabel}</p>
          <p className="text-xs text-slate-600">
            {detail.kindLabel}
            {detail.unsuccessfulReasonLabel !== "—" ? ` · ${detail.unsuccessfulReasonLabel}` : ""}
            {detail.followUpKindLabel !== "—" ? ` · ${detail.followUpKindLabel}` : ""}
          </p>
          {detail.successNotes ? (
            <p className="rounded-lg border border-teal-100 bg-teal-50/50 p-3 text-sm text-slate-800">
              <span className="font-bold">توضیحات موفق: </span>
              {detail.successNotes}
            </p>
          ) : null}
          {detail.unsuccessfulNotes ? (
            <p className="text-sm text-slate-700">{detail.unsuccessfulNotes}</p>
          ) : null}
          {detail.followUpSlots.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs">
              {detail.followUpSlots.map((s) => (
                <li key={s.id}>
                  پیگیری {s.slotIndex.toLocaleString("fa-IR")}:{" "}
                  {s.doneAt ? formatJalaliDate(s.doneAt) : "انجام نشده"}
                  {s.note ? ` — ${s.note}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}

      <p className="text-xs text-slate-500">
        انواع: {MARKETING_KIND_OPTIONS.map((o) => o.label).join(" · ")}
      </p>
    </div>
  );
}
