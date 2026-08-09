"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import {
  patientStatusLabel,
  resolveFranchisePercent,
  type PatientProfile,
  type PatientStatus,
} from "@/lib/patient";
import { fetchAdminOps, patchAdminOps } from "@/lib/operations/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STATUS_ACTIONS: { status: PatientStatus; label: string; variant?: "primary" | "outline" | "danger" }[] =
  [
    { status: "approved", label: "تأیید", variant: "primary" },
    { status: "rejected", label: "رد", variant: "danger" },
    { status: "pending", label: "در بررسی", variant: "outline" },
  ];

export default function AdminPatientsPage() {
  const [items, setItems] = useState<PatientProfile[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyPhone, setBusyPhone] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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
    void reload()
      .catch((e) => setError(e instanceof Error ? e.message : "خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, [reload]);

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
        پس از تأیید، همان درصد روی هزینه ویزیت (وب و اپ) اعمال می‌شود.{" "}
        <Link
          href="/admin/insurances"
          className="font-bold text-teal-700 underline-offset-2 hover:underline"
        >
          استعلام بیمه پرداخت →
        </Link>
      </p>

      {loading ? <p className="text-sm text-slate-500">در حال بارگذاری…</p> : null}

      <AdminTable
        headers={[
          "نام",
          "موبایل",
          "کد ملی",
          "فرانشیز٪",
          "بیمه تکمیلی",
          "وضعیت",
          "یادداشت / عملیات",
        ]}
        empty={loading ? "…" : "هنوز پروفایل بیماری ثبت نشده است."}
      >
        {items.map((p) => {
          const busy = busyPhone === p.phone;
          return (
            <tr key={p.phone} className="border-t border-slate-100 align-top">
              <td className="px-4 py-3">{p.name || "—"}</td>
              <td className="px-4 py-3 font-mono text-xs">{p.phone}</td>
              <td className="px-4 py-3 font-mono text-xs">{p.nationalId || "—"}</td>
              <td className="px-4 py-3">
                {resolveFranchisePercent(p).toLocaleString("fa-IR")}٪
              </td>
              <td className="px-4 py-3">{p.complementaryInsuranceId || "—"}</td>
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
                          type="button"
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
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </div>
  );
}
