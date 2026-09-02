"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import {
  summarizePatientProfiles,
  type PatientReportStatusFilter,
} from "@/lib/admin/patient-report";
import { fetchPublic } from "@/lib/content/client";
import {
  patientStatusLabel,
  resolveFranchisePercent,
  type InsuranceCompany,
  type PatientProfile,
  type PatientStatus,
} from "@/lib/patient";
import {
  deleteAdminOps,
  downloadAdminOpsExport,
  fetchAdminOps,
  patchAdminOps,
} from "@/lib/operations/client";
import { zohalStatusLabel } from "@/lib/zohal/patient-verify";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const STATUS_ACTIONS: {
  status: PatientStatus;
  label: string;
  variant?: "primary" | "outline" | "danger";
}[] = [
  { status: "approved", label: "تأیید", variant: "primary" },
  { status: "rejected", label: "رد", variant: "danger" },
  { status: "pending", label: "در بررسی", variant: "outline" },
];

type StatusFilter = PatientReportStatusFilter;

const emptyEditForm = {
  name: "",
  nationalId: "",
  franchisePercent: "30",
  baseInsuranceId: "",
  complementaryInsuranceId: "",
};

function insuranceName(list: InsuranceCompany[], id?: string): string {
  if (!id) return "—";
  return list.find((i) => i.id === id)?.name || id;
}

export default function AdminPatientsPage() {
  const [items, setItems] = useState<PatientProfile[]>([]);
  const [baseList, setBaseList] = useState<InsuranceCompany[]>([]);
  const [compList, setCompList] = useState<InsuranceCompany[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyPhone, setBusyPhone] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [editPhone, setEditPhone] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [exportBusy, setExportBusy] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const data = await fetchAdminOps<{ items: PatientProfile[] }>(
      "/api/admin/operations/patients",
    );
    const sorted = data.items.sort((a, b) =>
      String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
    );
    setItems(sorted);
    setNotes((prev) => {
      const next = { ...prev };
      for (const p of sorted) {
        if (next[p.phone] === undefined) next[p.phone] = p.reviewNote || "";
      }
      return next;
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    void fetchPublic<{ base: InsuranceCompany[]; complementary: InsuranceCompany[] }>(
      "/api/content/insurances",
    )
      .then((data) => {
        setBaseList(data.base.filter((i) => i.active !== false));
        setCompList(data.complementary.filter((i) => i.active !== false));
      })
      .catch(() => {});

    void reload()
      .catch((e) => setError(e instanceof Error ? e.message : "خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, [reload]);

  const stats = useMemo(() => summarizePatientProfiles(items), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.phone.includes(q) ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.nationalId || "").includes(q)
      );
    });
  }, [items, search, statusFilter]);

  async function exportReport(format: "xlsx" | "pdf" | "csv") {
    setError("");
    setExportBusy(format);
    const stamp = new Date().toISOString().slice(0, 10);
    const q = new URLSearchParams({
      format,
      status: statusFilter,
    });
    if (search.trim()) q.set("q", search.trim());
    const path = `/api/admin/operations/patients/export?${q.toString()}`;
    try {
      if (format === "pdf") {
        window.open(path, "_blank", "noopener,noreferrer");
        setSuccess("صفحه گزارش PDF باز شد — از چاپ، «ذخیره به PDF» را انتخاب کنید.");
      } else {
        const ext = format === "xlsx" ? "xlsx" : "csv";
        await downloadAdminOpsExport(path, `patients-${statusFilter}-${stamp}.${ext}`);
        setSuccess(format === "xlsx" ? "فایل Excel دانلود شد." : "فایل CSV دانلود شد.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خروجی گزارش ناموفق");
    } finally {
      setExportBusy(null);
    }
  }

  async function setStatus(phone: string, status: PatientStatus) {
    if (busyPhone) return;
    setError("");
    setSuccess("");
    setBusyPhone(phone);
    try {
      await patchAdminOps("/api/admin/operations/patients", {
        phone,
        status,
        reviewNote: notes[phone]?.trim() || undefined,
      });
      await reload();
      setSuccess(`وضعیت «${patientStatusLabel(status)}» برای ${phone} ذخیره شد.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ذخیره ناموفق بود.");
    } finally {
      setBusyPhone(null);
    }
  }

  async function saveNote(phone: string, currentStatus: PatientStatus) {
    if (busyPhone) return;
    setError("");
    setSuccess("");
    setBusyPhone(phone);
    try {
      await patchAdminOps("/api/admin/operations/patients", {
        phone,
        status: currentStatus,
        reviewNote: notes[phone] ?? "",
      });
      await reload();
      setSuccess(`یادداشت برای ${phone} ذخیره شد.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ذخیره یادداشت ناموفق بود.");
    } finally {
      setBusyPhone(null);
    }
  }

  async function recheckZohal(phone: string) {
    if (busyPhone) return;
    setError("");
    setSuccess("");
    setBusyPhone(phone);
    try {
      await patchAdminOps("/api/admin/operations/patients", { phone, recheckZohal: true });
      await reload();
      setSuccess(`استعلام زحل برای ${phone} انجام شد.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "استعلام ناموفق بود.");
    } finally {
      setBusyPhone(null);
    }
  }

  function openEdit(p: PatientProfile) {
    setEditPhone(p.phone);
    setEditForm({
      name: p.name || "",
      nationalId: p.nationalId || "",
      franchisePercent: String(resolveFranchisePercent(p)),
      baseInsuranceId: p.baseInsuranceId || "",
      complementaryInsuranceId: p.complementaryInsuranceId || "",
    });
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editPhone || busyPhone) return;
    setError("");
    setSuccess("");
    setBusyPhone(editPhone);
    try {
      await patchAdminOps("/api/admin/operations/patients", {
        phone: editPhone,
        name: editForm.name.trim(),
        nationalId: editForm.nationalId.trim(),
        franchisePercent: Number(editForm.franchisePercent),
        baseInsuranceId: editForm.baseInsuranceId || null,
        complementaryInsuranceId: editForm.complementaryInsuranceId || null,
      });
      await reload();
      setSuccess(`مشخصات ${editPhone} به‌روز شد.`);
      setEditPhone(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره ناموفق بود.");
    } finally {
      setBusyPhone(null);
    }
  }

  async function removePatient(phone: string, name: string) {
    if (busyPhone) return;
    if (
      !window.confirm(
        `بیمار «${name || phone}» و تمام پروفایلش از دیتابیس حذف شود؟ این عمل برگشت‌پذیر نیست.`,
      )
    ) {
      return;
    }
    setError("");
    setSuccess("");
    setBusyPhone(phone);
    try {
      await deleteAdminOps(
        `/api/admin/operations/patients?phone=${encodeURIComponent(phone)}`,
      );
      await reload();
      setSuccess(`بیمار ${phone} حذف شد.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حذف ناموفق بود.");
    } finally {
      setBusyPhone(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {success}
        </p>
      ) : null}
      <p className="text-sm leading-7 text-slate-600">
        این صف معادل «پنل کاربری» بیماران است: پروفایل، کد ملی، بیمه تکمیلی و درصد فرانشیز.
        با استعلام زحل (شاهکار) تأیید خودکار انجام می‌شود؛ در غیر این صورت تأیید دستی ممکن است.{" "}
        <Link
          href="/admin/insurances"
          className="font-bold text-teal-700 underline-offset-2 hover:underline"
        >
          استعلام بیمه پرداخت →
        </Link>
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card hover={false} className="border-cyan-100 bg-cyan-50/50 p-4">
          <p className="text-xs text-slate-500">کل کاربران</p>
          <p className="mt-1 text-2xl font-extrabold text-cyan-900">
            {stats.total.toLocaleString("fa-IR")}
          </p>
        </Card>
        <Card hover={false} className="border-amber-100 bg-amber-50/50 p-4">
          <p className="text-xs text-slate-500">در بررسی</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-800">
            {stats.pending.toLocaleString("fa-IR")}
          </p>
        </Card>
        <Card hover={false} className="border-teal-100 bg-teal-50/50 p-4">
          <p className="text-xs text-slate-500">تأیید شده</p>
          <p className="mt-1 text-2xl font-extrabold text-teal-800">
            {stats.approved.toLocaleString("fa-IR")}
          </p>
        </Card>
        <Card hover={false} className="border-rose-100 bg-rose-50/50 p-4">
          <p className="text-xs text-slate-500">رد شده</p>
          <p className="mt-1 text-2xl font-extrabold text-rose-800">
            {stats.rejected.toLocaleString("fa-IR")}
          </p>
        </Card>
        <Card hover={false} className="border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">با کد ملی</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800">
            {stats.withNationalId.toLocaleString("fa-IR")}
          </p>
        </Card>
        <Card hover={false} className="border-violet-100 bg-violet-50/40 p-4">
          <p className="text-xs text-slate-500">تأیید زحل</p>
          <p className="mt-1 text-2xl font-extrabold text-violet-800">
            {stats.zohalPassed.toLocaleString("fa-IR")}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <FormLabel>جستجو (موبایل / نام / کد ملی)</FormLabel>
          <FormInput value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <FormLabel>فیلتر وضعیت</FormLabel>
          <FormSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">همه</option>
            <option value="pending">در بررسی</option>
            <option value="approved">تأیید شده</option>
            <option value="rejected">رد شده</option>
          </FormSelect>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          disabled={exportBusy !== null}
          onClick={() => void exportReport("xlsx")}
        >
          {exportBusy === "xlsx" ? "در حال آماده‌سازی..." : "خروجی Excel"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          disabled={exportBusy !== null}
          onClick={() => void exportReport("pdf")}
        >
          {exportBusy === "pdf" ? "در حال باز کردن..." : "خروجی PDF"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          disabled={exportBusy !== null}
          onClick={() => void exportReport("csv")}
        >
          {exportBusy === "csv" ? "در حال آماده‌سازی..." : "خروجی CSV"}
        </Button>
        <span className="text-xs text-slate-500">
          {filtered.length.toLocaleString("fa-IR")} کاربر در این فیلتر
        </span>
      </div>

      {loading ? <p className="text-sm text-slate-500">در حال بارگذاری…</p> : null}

      <AdminTable
        headers={[
          "نام",
          "موبایل",
          "کد ملی",
          "فرانشیز٪",
          "بیمه پایه",
          "بیمه تکمیلی",
          "زحل",
          "وضعیت",
          "یادداشت / عملیات",
        ]}
        empty={loading ? "…" : "هنوز پروفایل بیماری ثبت نشده است."}
      >
        {filtered.map((p) => {
          const busy = busyPhone === p.phone;
          return (
            <tr key={p.phone} className="border-t border-slate-100 align-top">
              <td className="px-4 py-3">{p.name || "—"}</td>
              <td className="px-4 py-3 font-mono text-xs">{p.phone}</td>
              <td className="px-4 py-3 font-mono text-xs">{p.nationalId || "—"}</td>
              <td className="px-4 py-3">
                {resolveFranchisePercent(p).toLocaleString("fa-IR")}٪
              </td>
              <td className="px-4 py-3 text-xs">
                {insuranceName(baseList, p.baseInsuranceId)}
              </td>
              <td className="px-4 py-3 text-xs">
                {insuranceName(compList, p.complementaryInsuranceId)}
              </td>
              <td className="px-4 py-3 text-xs font-medium">
                {zohalStatusLabel(p.zohalStatus, p.shahkarMatched)}
              </td>
              <td className="px-4 py-3">
                <AdminBadge
                  tone={
                    p.status === "approved"
                      ? "success"
                      : p.status === "rejected"
                        ? "danger"
                        : "warn"
                  }
                >
                  {patientStatusLabel(p.status)}
                </AdminBadge>
              </td>
              <td className="px-4 py-3">
                <div className="flex min-w-[16rem] flex-col gap-2">
                  <textarea
                    className="w-full resize-y rounded-lg border border-slate-200 px-2 py-1.5 text-xs leading-5 text-slate-700 outline-none focus:border-teal-500"
                    rows={2}
                    placeholder="یادداشت بررسی (اختیاری)"
                    value={notes[p.phone] ?? ""}
                    disabled={busy}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [p.phone]: e.target.value }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ACTIONS.map((action) => {
                      const isCurrent = p.status === action.status;
                      return (
                        <Button
                          key={action.status}
                          variant={isCurrent ? "primary" : action.variant || "outline"}
                          className="px-3 py-1.5 text-xs"
                          disabled={busy || isCurrent || Boolean(busyPhone)}
                          onClick={() => void setStatus(p.phone, action.status)}
                        >
                          {busy && !isCurrent ? "…" : action.label}
                          {isCurrent ? " ✓" : ""}
                        </Button>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                      disabled={busy || Boolean(busyPhone)}
                      onClick={() => void saveNote(p.phone, p.status)}
                    >
                      ذخیره یادداشت
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                      disabled={busy || Boolean(busyPhone)}
                      onClick={() => openEdit(p)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                      disabled={busy || Boolean(busyPhone) || !p.nationalId}
                      onClick={() => void recheckZohal(p.phone)}
                    >
                      استعلام زحل
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="px-3 py-1.5 text-xs"
                      disabled={busy || Boolean(busyPhone)}
                      onClick={() => void removePatient(p.phone, p.name)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {editPhone ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <Card hover={false} className="w-full max-w-lg space-y-4 p-5">
            <h3 className="font-extrabold text-slate-900">ویرایش بیمار — {editPhone}</h3>
            <form onSubmit={saveEdit} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormLabel>نام</FormLabel>
                <FormInput
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <FormLabel>کد ملی</FormLabel>
                <FormInput
                  value={editForm.nationalId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, nationalId: e.target.value }))
                  }
                  required
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
              <div>
                <FormLabel>فرانشیز (درصد)</FormLabel>
                <FormInput
                  type="number"
                  min={0}
                  max={100}
                  value={editForm.franchisePercent}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, franchisePercent: e.target.value }))
                  }
                />
              </div>
              <div>
                <FormLabel>بیمه پایه</FormLabel>
                <FormSelect
                  value={editForm.baseInsuranceId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, baseInsuranceId: e.target.value }))
                  }
                >
                  <option value="">—</option>
                  {baseList.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div>
                <FormLabel>بیمه تکمیلی</FormLabel>
                <FormSelect
                  value={editForm.complementaryInsuranceId}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      complementaryInsuranceId: e.target.value,
                    }))
                  }
                >
                  <option value="">—</option>
                  {compList.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit" disabled={Boolean(busyPhone)}>
                  ذخیره
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditPhone(null)}
                  disabled={Boolean(busyPhone)}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
