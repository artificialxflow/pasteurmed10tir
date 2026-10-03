"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { videoStatusLabel } from "@/lib/jitsi/labels";
import { isConsultationVideoWindowExpired } from "@/lib/jitsi/video-window";
import { staffCommissionSourceLabel, staffCommissionStatusLabel } from "@/lib/home-visit/labels";
import { fetchPatientOps, postPatientOps } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { cn, formatPrice } from "@/lib/utils";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type PhysicianTab = "visits" | "stats" | "commissions" | "referrals";

type ReferralRow = {
  id: string;
  referrerName: string;
  patientName: string;
  patientPhone: string;
  specialistName: string;
  note?: string;
  createdAt: string;
};

type VisitPrescription = {
  id: string;
  date: string;
  createdAt: string;
  medications: string;
  dosageSchedule?: string;
  diagnosis?: string;
  recommendations?: string;
};

type VisitRow = {
  kind: "consultation" | "booking";
  id: string;
  patientName: string;
  patientPhone: string;
  title: string;
  when: string;
  status: string;
  preferredDate?: string;
  preferredTime?: string;
  videoStatus?: string | null;
  supportsVideo?: boolean;
  canJoinVideo: boolean;
  canWritePrescription?: boolean;
  prescriptions?: VisitPrescription[];
  createdAt: string;
};

type Stats = {
  consultationTotal: number;
  consultationPending: number;
  consultationAnswered: number;
  consultationCancelled: number;
  videoReady: number;
  videoCompleted: number;
  bookingActive: number;
  bookingConfirmed: number;
  bookingCancelled: number;
  consultationAmountSum: number;
  commissionTotal?: number;
  commissionPaidTotal?: number;
  commissionPendingTotal?: number;
  commissionPercent?: number;
};

type CommissionRow = {
  id: string;
  commissionAmount: number;
  status?: string;
  sourceType?: string;
  sourceLabel?: string | null;
  createdAt: string;
};

function visitStatusLabel(kind: string, status: string): string {
  if (kind === "booking") {
    if (status === "confirmed") return "تأیید شده";
    if (status === "pending") return "در انتظار";
    if (status === "cancelled") return "لغو شده";
    return status;
  }
  if (status === "answered") return "پاسخ داده";
  if (status === "cancelled") return "لغو شده";
  return "در انتظار";
}

export function PhysicianPanel({ section }: { section: PhysicianTab }) {
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [summary, setSummary] = useState<{
    count: number;
    total: number;
    paidTotal: number;
    pendingTotal: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [physicianName, setPhysicianName] = useState("");
  const [rxId, setRxId] = useState("");
  const [rxMedications, setRxMedications] = useState("");
  const [rxDosage, setRxDosage] = useState("");
  const [rxDiagnosis, setRxDiagnosis] = useState("");
  const [rxRecommendations, setRxRecommendations] = useState("");
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [referralBusy, setReferralBusy] = useState(false);
  const [referralForm, setReferralForm] = useState({
    patientName: "",
    patientPhone: "",
    specialistName: "",
    note: "",
  });

  const loadVisits = useCallback(async () => {
    const data = await fetchPatientOps<{
      item: { name?: string } | null;
      items: VisitRow[];
    }>("/api/operations/physician/me/visits");
    setPhysicianName(data.item?.name || "");
    setVisits(data.items || []);
  }, []);

  const loadStats = useCallback(async () => {
    const data = await fetchPatientOps<{ stats: Stats | null }>("/api/operations/physician/me/stats");
    setStats(data.stats);
  }, []);

  const loadCommissions = useCallback(async () => {
    const data = await fetchPatientOps<{
      items: CommissionRow[];
      summary: {
        count: number;
        total: number;
        paidTotal: number;
        pendingTotal: number;
      } | null;
    }>("/api/operations/physician/me/commissions");
    setCommissions(data.items || []);
    setSummary(data.summary);
  }, []);

  const loadReferrals = useCallback(async () => {
    const data = await fetchPatientOps<{ items: ReferralRow[] }>(
      "/api/operations/physician/me/referrals",
    );
    setReferrals(data.items || []);
  }, []);

  useEffect(() => {
    setError("");
    setMessage("");
    if (section === "visits") {
      void loadVisits().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
    } else if (section === "stats") {
      void loadStats().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
    } else if (section === "referrals") {
      void loadReferrals().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
    } else {
      void loadCommissions().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
    }
  }, [section, loadVisits, loadStats, loadCommissions, loadReferrals]);

  async function saveReferral(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setReferralBusy(true);
    try {
      await postPatientOps("/api/operations/physician/me/referrals", referralForm);
      setReferralForm({
        patientName: "",
        patientPhone: "",
        specialistName: "",
        note: "",
      });
      setMessage("ارجاع به متخصص ثبت شد.");
      await loadReferrals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت ارجاع ناموفق بود.");
    } finally {
      setReferralBusy(false);
    }
  }

  function startRx(v: VisitRow) {
    setError("");
    setMessage("");
    setRxId(v.id);
    setRxMedications("");
    setRxDosage("");
    setRxDiagnosis("");
    setRxRecommendations("");
  }

  function cancelRx() {
    setRxId("");
    setRxMedications("");
    setRxDosage("");
    setRxDiagnosis("");
    setRxRecommendations("");
  }

  async function joinVideo(id: string) {
    setError("");
    setMessage("");
    setBusyId(id);
    try {
      const token = await postPatientOps<{ url: string }>(
        `/api/operations/physician/me/consultations/${encodeURIComponent(id)}/video-token`,
        {},
      );
      window.location.href = token.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "ورود به ویزیت ناموفق");
      setBusyId("");
    }
  }

  async function savePrescription(v: VisitRow) {
    setError("");
    setMessage("");
    if (!rxMedications.trim()) {
      setError("متن دارو / نسخه الزامی است.");
      return;
    }
    setBusyId(v.id);
    try {
      await postPatientOps("/api/operations/physician/me/prescriptions", {
        consultationId: v.kind === "consultation" ? v.id : undefined,
        bookingId: v.kind === "booking" ? v.id : undefined,
        patientPhone: v.patientPhone,
        medications: rxMedications.trim(),
        dosageSchedule: rxDosage.trim() || undefined,
        diagnosis: rxDiagnosis.trim() || undefined,
        recommendations: rxRecommendations.trim() || undefined,
      });
      setMessage("نسخه الکترونیک در پرونده سلامت بیمار ثبت شد.");
      cancelRx();
      await loadVisits();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "ثبت نسخه ناموفق بود. بیمار باید با همین موبایل حساب داشته باشد.",
      );
    } finally {
      setBusyId("");
    }
  }

  if (error && section !== "visits" && section !== "referrals") {
    return (
      <Card hover={false} className="p-4">
        <p className="text-sm font-bold text-rose-600">{error}</p>
      </Card>
    );
  }

  if (section === "referrals") {
    return (
      <div className="space-y-4">
        <Card hover={false} className="space-y-3 p-4">
          <div>
            <p className="text-sm font-extrabold text-slate-900">ارجاع به متخصص</p>
            <p className="mt-1 text-xs text-slate-500">
              بیمار را برای پیگیری تخصصی ثبت کنید. نام ارجاع‌دهنده به‌صورت خودکار شماست.
            </p>
          </div>
          {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm font-bold text-teal-700">{message}</p> : null}
          <form onSubmit={saveReferral} className="grid gap-3 sm:grid-cols-2">
            <div>
              <FormLabel>نام بیمار</FormLabel>
              <FormInput
                value={referralForm.patientName}
                onChange={(e) =>
                  setReferralForm((f) => ({ ...f, patientName: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <FormLabel>شماره تماس بیمار</FormLabel>
              <FormInput
                value={referralForm.patientPhone}
                onChange={(e) =>
                  setReferralForm((f) => ({ ...f, patientPhone: e.target.value }))
                }
                required
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="sm:col-span-2">
              <FormLabel>متخصص ارجاع‌شده</FormLabel>
              <FormInput
                value={referralForm.specialistName}
                onChange={(e) =>
                  setReferralForm((f) => ({ ...f, specialistName: e.target.value }))
                }
                required
              />
            </div>
            <div className="sm:col-span-2">
              <FormLabel>یادداشت (اختیاری)</FormLabel>
              <FormTextarea
                value={referralForm.note}
                onChange={(e) => setReferralForm((f) => ({ ...f, note: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={referralBusy}>
                {referralBusy ? "در حال ثبت…" : "ثبت ارجاع"}
              </Button>
            </div>
          </form>
        </Card>

        <Card hover={false} className="space-y-3 p-4">
          <p className="text-sm font-extrabold text-slate-900">ارجاع‌های ثبت‌شده من</p>
          {referrals.length === 0 ? (
            <p className="text-xs text-slate-500">هنوز ارجاعی ثبت نکرده‌اید.</p>
          ) : (
            <ul className="space-y-2">
              {referrals.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-100 px-3 py-2 text-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-800">{item.patientName}</p>
                      <p className="mt-0.5 text-slate-500" dir="ltr">
                        {item.patientPhone}
                      </p>
                    </div>
                    <p className="text-slate-500">{formatJalaliDate(item.createdAt)}</p>
                  </div>
                  <p className="mt-2 font-bold text-teal-800">→ {item.specialistName}</p>
                  {item.note ? (
                    <p className="mt-1 text-slate-600">{item.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  if (section === "stats") {
    if (!stats) return <p className="text-sm text-slate-500">در حال بارگذاری…</p>;
    const cards = [
      { label: "کل مشاوره‌ها", value: stats.consultationTotal },
      { label: "در انتظار پاسخ", value: stats.consultationPending },
      { label: "پاسخ‌داده‌شده", value: stats.consultationAnswered },
      { label: "لغو شده", value: stats.consultationCancelled },
      { label: "آماده / در تماس ویدیو", value: stats.videoReady },
      { label: "ویدیو تمام‌شده", value: stats.videoCompleted },
      { label: "نوبت فعال", value: stats.bookingActive },
      { label: "نوبت تأییدشده", value: stats.bookingConfirmed },
    ];
    return (
      <div className="space-y-4">
        <Card hover={false} className="p-4">
          <p className="text-sm font-extrabold text-slate-900">کارکرد من</p>
          <p className="mt-1 text-xs text-slate-500">خلاصه وضعیت ویزیت‌ها و نوبت‌های ثبت‌شده برای شما</p>
        </Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label} hover={false} className="p-4">
              <p className="text-xs font-bold text-slate-500">{c.label}</p>
              <p className="mt-2 text-2xl font-extrabold text-teal-800">
                {c.value.toLocaleString("fa-IR")}
              </p>
            </Card>
          ))}
        </div>
        <Card hover={false} className="border-teal-100 bg-teal-50/50 p-4">
          <p className="text-xs font-bold text-teal-900">جمع پورسانت من</p>
          <p className="mt-1 text-lg font-extrabold text-teal-950">
            {formatPrice(Number(stats.commissionTotal || 0))}
          </p>
          <p className="mt-2 text-xs text-teal-900/80">
            {Number(stats.commissionPercent || 0) > 0
              ? `نرخ پورسانت: ${Number(stats.commissionPercent).toLocaleString("fa-IR")}٪ · `
              : ""}
            در انتظار تسویه: {formatPrice(Number(stats.commissionPendingTotal || 0))}
            {" · "}
            پرداخت‌شده: {formatPrice(Number(stats.commissionPaidTotal || 0))}
          </p>
        </Card>
      </div>
    );
  }

  if (section === "commissions") {
    return (
      <Card hover={false} className="space-y-3 p-4">
        <p className="text-sm font-extrabold text-slate-900">پورسانت‌های من</p>
        <p className="text-xs text-slate-500">
          فقط مشاهده. تسویه از پنل ادمین انجام می‌شود.
        </p>
        {summary ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
              <p className="text-slate-500">تعداد</p>
              <p className="font-extrabold text-slate-900">
                {summary.count.toLocaleString("fa-IR")}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs">
              <p className="text-amber-800">در انتظار</p>
              <p className="font-extrabold text-amber-950">{formatPrice(summary.pendingTotal)}</p>
            </div>
            <div className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs">
              <p className="text-teal-800">پرداخت‌شده</p>
              <p className="font-extrabold text-teal-950">{formatPrice(summary.paidTotal)}</p>
            </div>
          </div>
        ) : null}
        {commissions.length === 0 ? (
          <p className="text-xs text-slate-500">هنوز پورسانتی ثبت نشده است.</p>
        ) : (
          <ul className="space-y-2">
            {commissions.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-800">
                    {staffCommissionSourceLabel(item.sourceType)}
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    {formatJalaliDate(item.createdAt)}
                    {item.sourceLabel ? ` · ${item.sourceLabel}` : ""}
                  </p>
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-teal-800">
                    {formatPrice(item.commissionAmount)}
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    {staffCommissionStatusLabel(item.status)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  }

  return (
    <Card hover={false} className="space-y-3 p-4">
      <div>
        <p className="text-sm font-extrabold text-slate-900">ویزیت‌ها و نوبت‌های من</p>
        <p className="mt-1 text-xs text-slate-500">
          {physicianName ? `${physicianName} · ` : ""}
          مشاوره‌ها و نوبت‌های ثبت‌شده برای شما. برای ویزیت تصویری آماده، دکمه ورود را بزنید.
        </p>
      </div>
      {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm font-bold text-teal-700">{message}</p> : null}
      {visits.length === 0 ? (
        <p className="text-xs text-slate-500">ویزیت یا نوبتی ثبت نشده است.</p>
      ) : (
        <ul className="space-y-2">
          {visits.map((v) => {
            const writingRx = rxId === v.id;
            const windowExpired = isConsultationVideoWindowExpired({
              preferredDate: v.preferredDate,
              preferredTime: v.preferredTime,
            });
            const showVideoMeta = Boolean(v.supportsVideo) && v.videoStatus && v.videoStatus !== "none";
            const videoMetaLabel = windowExpired
              ? "مهلت اتاق پایان یافت"
              : videoStatusLabel(v.videoStatus);
            return (
              <li
                key={`${v.kind}-${v.id}`}
                className="rounded-xl border border-slate-100 px-3 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{v.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {v.patientName} · {v.patientPhone}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {v.when} · {formatJalaliDate(v.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold",
                        v.status === "answered" || v.status === "confirmed"
                          ? "text-teal-700"
                          : v.status === "cancelled"
                            ? "text-rose-700"
                            : "text-amber-700",
                      )}
                    >
                      {visitStatusLabel(v.kind, v.status)}
                      {showVideoMeta ? ` · ${videoMetaLabel}` : ""}
                    </span>
                    {v.canJoinVideo ? (
                      <Button
                        type="button"
                        className="!rounded-xl px-3 py-2 text-xs font-extrabold"
                        disabled={busyId === v.id}
                        onClick={() => void joinVideo(v.id)}
                      >
                        {busyId === v.id ? "در حال اتصال…" : "ورود به ویزیت تصویری"}
                      </Button>
                    ) : null}
                    {v.canWritePrescription && !writingRx ? (
                      <button
                        type="button"
                        disabled={busyId === v.id}
                        className="text-xs font-bold text-violet-800 disabled:opacity-50"
                        onClick={() => startRx(v)}
                      >
                        ثبت نسخه الکترونیک
                      </button>
                    ) : null}
                  </div>
                </div>
                {v.prescriptions && v.prescriptions.length > 0 ? (
                  <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs font-extrabold text-slate-800">
                      نسخه‌های قبلی این ویزیت ({v.prescriptions.length.toLocaleString("fa-IR")})
                    </p>
                    <ul className="space-y-2">
                      {v.prescriptions.map((rx) => (
                        <li
                          key={rx.id}
                          className="rounded-lg border border-slate-100 bg-white px-2.5 py-2 text-xs text-slate-700"
                        >
                          <p className="font-bold text-slate-500">
                            {formatJalaliDate(rx.createdAt || rx.date)}
                          </p>
                          {rx.diagnosis ? (
                            <p className="mt-1">
                              <span className="font-bold text-slate-500">تشخیص: </span>
                              {rx.diagnosis}
                            </p>
                          ) : null}
                          <p className="mt-1 whitespace-pre-wrap">
                            <span className="font-bold text-slate-500">داروها: </span>
                            {rx.medications || "—"}
                          </p>
                          {rx.dosageSchedule ? (
                            <p className="mt-1 whitespace-pre-wrap">
                              <span className="font-bold text-slate-500">زمان‌بندی: </span>
                              {rx.dosageSchedule}
                            </p>
                          ) : null}
                          {rx.recommendations ? (
                            <p className="mt-1 whitespace-pre-wrap">
                              <span className="font-bold text-slate-500">توصیه‌ها: </span>
                              {rx.recommendations}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {writingRx ? (
                  <div className="mt-3 space-y-2 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
                    <p className="text-xs font-bold text-violet-900">
                      نسخه الکترونیک در پرونده سلامت بیمار ذخیره می‌شود
                    </p>
                    <label className="block text-xs font-bold text-slate-600">
                      داروها / نسخه
                      <textarea
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        rows={3}
                        value={rxMedications}
                        onChange={(e) => setRxMedications(e.target.value)}
                        placeholder="نام دارو، دوز، نحوه مصرف"
                      />
                    </label>
                    <label className="block text-xs font-bold text-slate-600">
                      زمان‌بندی مصرف
                      <textarea
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        rows={2}
                        value={rxDosage}
                        onChange={(e) => setRxDosage(e.target.value)}
                      />
                    </label>
                    <label className="block text-xs font-bold text-slate-600">
                      تشخیص
                      <textarea
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        rows={2}
                        value={rxDiagnosis}
                        onChange={(e) => setRxDiagnosis(e.target.value)}
                      />
                    </label>
                    <label className="block text-xs font-bold text-slate-600">
                      توصیه‌ها
                      <textarea
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        rows={2}
                        value={rxRecommendations}
                        onChange={(e) => setRxRecommendations(e.target.value)}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === v.id}
                        className="text-xs font-bold text-violet-800 disabled:opacity-50"
                        onClick={() => void savePrescription(v)}
                      >
                        {busyId === v.id ? "در حال ذخیره…" : "ذخیره در پرونده"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === v.id}
                        className="text-xs font-bold text-slate-500 disabled:opacity-50"
                        onClick={cancelRx}
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
