"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Card";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import {
  FOLLOW_UP_ATTENDED_ACTION_OPTIONS,
  FOLLOW_UP_DISSATISFACTION_OPTIONS,
  FOLLOW_UP_OUTCOME_OPTIONS,
  FOLLOW_UP_SERVICE_OPTIONS,
} from "@/lib/follow-up/types";
import {
  downloadAdminOpsExport,
  fetchAdminOps,
  patchAdminOps,
  postAdminOps,
} from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import { formatJalaliDate } from "@/lib/patient";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

type FollowUpTab = "new" | "appointment" | "followup" | "completed" | "satisfaction";

type CaseItem = {
  id: string;
  workDate: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  serviceCategory: string;
  serviceCategoryLabel: string;
  satisfactionDoctor: number | null;
  satisfactionAssistants: number | null;
  satisfactionReception: number | null;
  outcome: string;
  outcomeLabel: string;
  attendedAction?: string;
  dissatisfactionTarget?: string;
  followUpDate?: string;
  appointmentGiven: boolean;
  followUpDone: boolean;
  notes?: string;
};

type SatisfactionStats = {
  average: number | null;
  count: number;
  dissatisfied: Array<{
    id: string;
    patientName: string;
    patientPhone: string;
    dissatisfactionLabel: string;
    doctorName: string;
  }>;
};

const TABS: Array<{ id: FollowUpTab; label: string }> = [
  { id: "new", label: "جدید" },
  { id: "appointment", label: "نیاز به ارائه نوبت" },
  { id: "followup", label: "نیاز به پیگیری" },
  { id: "completed", label: "فالوآپ‌شده‌ها" },
  { id: "satisfaction", label: "میزان رضایتمندی" },
];

const BOOKING_LINKS = [
  { href: ROUTES.web.dentalBooking, label: "رزرو دندان" },
  { href: ROUTES.web.laser, label: "لیزر" },
  { href: ROUTES.web.nursing, label: "پرستاری" },
  { href: ROUTES.web.medicalSpecialty, label: "پزشکی" },
];

function RatingSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <FormLabel>{label} (۱–۵)</FormLabel>
      <FormSelect value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={String(n)}>
            {n.toLocaleString("fa-IR")}
          </option>
        ))}
      </FormSelect>
    </div>
  );
}

export default function AdminFollowUpPage() {
  const [tab, setTab] = useState<FollowUpTab>("new");
  const [items, setItems] = useState<CaseItem[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [followUpFilterDate, setFollowUpFilterDate] = useState("");
  const [satisfactionCategory, setSatisfactionCategory] = useState("all");
  const [satisfactionRole, setSatisfactionRole] = useState("doctor");
  const [stats, setStats] = useState<SatisfactionStats | null>(null);

  const [form, setForm] = useState({
    patientName: "",
    patientPhone: "",
    doctorName: "",
    serviceCategory: "dental",
    satisfactionDoctor: "",
    satisfactionAssistants: "",
    satisfactionReception: "",
    outcome: "attended",
    attendedAction: "appointment_needed",
    dissatisfactionTarget: "doctor",
    followUpDate: "",
    notes: "",
  });

  const todayLabel = useMemo(() => formatJalaliDate(new Date().toISOString()), []);

  const loadCases = useCallback(async () => {
    const params = new URLSearchParams({ tab });
    if (tab === "followup" && followUpFilterDate) {
      params.set("followUpDate", followUpFilterDate);
    }
    const data = await fetchAdminOps<{ items: CaseItem[] }>(
      `/api/admin/operations/follow-up/cases?${params}`,
    );
    setItems(data.items);
  }, [tab, followUpFilterDate]);

  const loadSatisfaction = useCallback(async () => {
    const params = new URLSearchParams({
      serviceCategory: satisfactionCategory,
      role: satisfactionRole,
    });
    const data = await fetchAdminOps<SatisfactionStats>(
      `/api/admin/operations/follow-up/satisfaction?${params}`,
    );
    setStats(data);
  }, [satisfactionCategory, satisfactionRole]);

  useEffect(() => {
    if (tab === "satisfaction") {
      void loadSatisfaction().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
    } else {
      void loadCases().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
    }
  }, [tab, loadCases, loadSatisfaction]);

  async function submitNew(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await postAdminOps("/api/admin/operations/follow-up/cases", {
        ...form,
        workDate: new Date().toISOString().slice(0, 10),
      });
      setForm((f) => ({
        ...f,
        patientName: "",
        patientPhone: "",
        doctorName: "",
        notes: "",
        followUpDate: "",
      }));
      await loadCases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت ناموفق");
    }
  }

  async function toggleFlag(id: string, patch: Record<string, boolean>) {
    await patchAdminOps("/api/admin/operations/follow-up/cases", { id, ...patch });
    await loadCases();
  }

  async function exportReport(format: "xlsx" | "csv" | "pdf") {
    const params = new URLSearchParams({ format, tab: "completed" });
    const stamp = new Date().toISOString().slice(0, 10);
    await downloadAdminOpsExport(
      `/api/admin/operations/follow-up/export?${params}`,
      `follow-up-${stamp}.${format === "pdf" ? "html" : format}`,
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">فالوآپ</h1>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-bold transition",
              tab === t.id
                ? "bg-teal-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {tab === "new" ? (
        <>
          <Card hover={false} className="border-teal-100 bg-teal-50/40 p-4">
            <p className="font-bold text-teal-900">ثبت کار جدید — {todayLabel}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "بستن فرم" : "باز کردن فرم"}
            </Button>
          </Card>
          {showForm ? (
            <Card hover={false} className="p-5">
              <form onSubmit={submitNew} className="grid gap-4 md:grid-cols-2">
                <div>
                  <FormLabel>نام بیمار</FormLabel>
                  <FormInput
                    required
                    value={form.patientName}
                    onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                  />
                </div>
                <div>
                  <FormLabel>شماره تماس</FormLabel>
                  <FormInput
                    required
                    dir="ltr"
                    className="text-left"
                    value={form.patientPhone}
                    onChange={(e) => setForm((f) => ({ ...f, patientPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <FormLabel>نام دکتر</FormLabel>
                  <FormInput
                    required
                    value={form.doctorName}
                    onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))}
                  />
                </div>
                <div>
                  <FormLabel>خدمات انجام‌شده</FormLabel>
                  <FormSelect
                    value={form.serviceCategory}
                    onChange={(e) => setForm((f) => ({ ...f, serviceCategory: e.target.value }))}
                  >
                    {FOLLOW_UP_SERVICE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </FormSelect>
                </div>
                <RatingSelect
                  label="رضایت از دکتر"
                  value={form.satisfactionDoctor}
                  onChange={(v) => setForm((f) => ({ ...f, satisfactionDoctor: v }))}
                />
                <RatingSelect
                  label="رضایت از دستیاران"
                  value={form.satisfactionAssistants}
                  onChange={(v) => setForm((f) => ({ ...f, satisfactionAssistants: v }))}
                />
                <RatingSelect
                  label="رضایت از پذیرش"
                  value={form.satisfactionReception}
                  onChange={(v) => setForm((f) => ({ ...f, satisfactionReception: v }))}
                />
                <div className="md:col-span-2">
                  <FormLabel>نتیجه</FormLabel>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {FOLLOW_UP_OUTCOME_OPTIONS.map((o) => (
                      <label key={o.id} className="flex items-center gap-2 text-sm font-bold">
                        <input
                          type="radio"
                          name="outcome"
                          checked={form.outcome === o.id}
                          onChange={() => setForm((f) => ({ ...f, outcome: o.id }))}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>
                {form.outcome === "attended" ? (
                  <>
                    <div className="md:col-span-2">
                      <FormLabel>اقدام</FormLabel>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {FOLLOW_UP_ATTENDED_ACTION_OPTIONS.map((o) => (
                          <label key={o.id} className="flex items-center gap-2 text-sm font-bold">
                            <input
                              type="radio"
                              name="attendedAction"
                              checked={form.attendedAction === o.id}
                              onChange={() => setForm((f) => ({ ...f, attendedAction: o.id }))}
                            />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    {form.attendedAction === "follow_up_needed" ? (
                      <div className="md:col-span-2">
                        <FormLabel>تاریخ پیگیری بعدی</FormLabel>
                        <JalaliBirthDateField
                          value={form.followUpDate}
                          onChange={(iso) => setForm((f) => ({ ...f, followUpDate: iso || "" }))}
                        />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <FormLabel>علت</FormLabel>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {FOLLOW_UP_DISSATISFACTION_OPTIONS.map((o) => (
                        <label key={o.id} className="flex items-center gap-2 text-sm font-bold">
                          <input
                            type="radio"
                            name="dissatisfactionTarget"
                            checked={form.dissatisfactionTarget === o.id}
                            onChange={() =>
                              setForm((f) => ({ ...f, dissatisfactionTarget: o.id }))
                            }
                          />
                          {o.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="md:col-span-2">
                  <FormLabel>توضیحات</FormLabel>
                  <FormTextarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit">ثبت</Button>
                </div>
              </form>
            </Card>
          ) : null}
          <AdminTable
            headers={["تاریخ", "بیمار", "تماس", "دکتر", "بخش", "نتیجه"]}
            empty="امروز موردی ثبت نشده."
          >
            {items.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-xs">{formatJalaliDate(row.workDate)}</td>
                <td className="px-4 py-3">{row.patientName}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.patientPhone}</td>
                <td className="px-4 py-3">{row.doctorName}</td>
                <td className="px-4 py-3 text-xs">{row.serviceCategoryLabel}</td>
                <td className="px-4 py-3 text-xs">{row.outcomeLabel}</td>
              </tr>
            ))}
          </AdminTable>
        </>
      ) : null}

      {tab === "appointment" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {BOOKING_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                target="_blank"
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-teal-800 hover:bg-teal-50"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <AdminTable
            headers={["بیمار", "تماس", "دکتر", "بخش", "نوبت داده شد"]}
            empty="بیماری در صف نوبت نیست."
          >
            {items.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.patientName}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.patientPhone}</td>
                <td className="px-4 py-3">{row.doctorName}</td>
                <td className="px-4 py-3 text-xs">{row.serviceCategoryLabel}</td>
                <td className="px-4 py-3">
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={row.appointmentGiven}
                      onChange={(e) =>
                        void toggleFlag(row.id, { appointmentGiven: e.target.checked })
                      }
                    />
                    {row.appointmentGiven ? "داده شد" : "مانده"}
                  </label>
                </td>
              </tr>
            ))}
          </AdminTable>
        </>
      ) : null}

      {tab === "followup" ? (
        <>
          <div className="max-w-sm">
            <FormLabel>فیلتر تاریخ پیگیری</FormLabel>
            <JalaliBirthDateField
              value={followUpFilterDate}
              onChange={(iso) => setFollowUpFilterDate(iso || "")}
            />
          </div>
          <AdminTable
            headers={["بیمار", "تماس", "تاریخ پیگیری", "دکتر", "انجام شد"]}
            empty="برای این تاریخ موردی نیست."
          >
            {items.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.patientName}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.patientPhone}</td>
                <td className="px-4 py-3 text-xs">
                  {row.followUpDate ? formatJalaliDate(row.followUpDate) : "—"}
                </td>
                <td className="px-4 py-3">{row.doctorName}</td>
                <td className="px-4 py-3">
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={row.followUpDone}
                      onChange={(e) => void toggleFlag(row.id, { followUpDone: e.target.checked })}
                    />
                    {row.followUpDone ? "انجام شد" : "مانده"}
                  </label>
                </td>
              </tr>
            ))}
          </AdminTable>
        </>
      ) : null}

      {tab === "completed" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void exportReport("xlsx")}>
              Excel
            </Button>
            <Button type="button" variant="outline" onClick={() => void exportReport("csv")}>
              CSV
            </Button>
            <Button type="button" variant="outline" onClick={() => void exportReport("pdf")}>
              PDF (HTML)
            </Button>
          </div>
          <AdminTable
            headers={["بیمار", "تماس", "بخش", "نتیجه", "توضیح"]}
            empty="مورد بسته‌شده‌ای نیست."
          >
            {items.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.patientName}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.patientPhone}</td>
                <td className="px-4 py-3 text-xs">{row.serviceCategoryLabel}</td>
                <td className="px-4 py-3 text-xs">{row.outcomeLabel}</td>
                <td className="max-w-xs px-4 py-3 text-xs text-slate-600">{row.notes || "—"}</td>
              </tr>
            ))}
          </AdminTable>
        </>
      ) : null}

      {tab === "satisfaction" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FormLabel>بخش</FormLabel>
              <FormSelect
                value={satisfactionCategory}
                onChange={(e) => setSatisfactionCategory(e.target.value)}
              >
                <option value="all">همه</option>
                {FOLLOW_UP_SERVICE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel>نقش</FormLabel>
              <FormSelect
                value={satisfactionRole}
                onChange={(e) => setSatisfactionRole(e.target.value)}
              >
                <option value="doctor">دکتر</option>
                <option value="assistants">دستیار</option>
                <option value="reception">پذیرش</option>
              </FormSelect>
            </div>
          </div>
          <Card hover={false} className="p-5">
            <p className="text-lg font-extrabold text-teal-900">
              میانگین:{" "}
              {stats?.average != null ? stats.average.toLocaleString("fa-IR") : "—"} از ۵
            </p>
            <p className="text-sm text-slate-600">
              بر اساس {stats?.count.toLocaleString("fa-IR") ?? 0} امتیاز ثبت‌شده
            </p>
          </Card>
          <h3 className="font-bold text-slate-800">بیماران ناراضی</h3>
          <AdminTable headers={["بیمار", "تماس", "دکتر", "علت"]} empty="مورد ناراضی ثبت نشده.">
            {(stats?.dissatisfied || []).map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.patientName}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.patientPhone}</td>
                <td className="px-4 py-3">{row.doctorName}</td>
                <td className="px-4 py-3 text-xs">{row.dissatisfactionLabel}</td>
              </tr>
            ))}
          </AdminTable>
        </>
      ) : null}
    </div>
  );
}
