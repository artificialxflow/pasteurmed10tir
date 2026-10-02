"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { supportsConsultationVideo } from "@/lib/consultation/categories";
import {
  canJoinConsultationVideoStatus,
  videoStatusLabel,
} from "@/lib/jitsi/labels";
import {
  fetchAdminOps,
  mintAdminConsultationVideoToken,
  patchAdminOps,
  postAdminOps,
} from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import { confirmAction } from "@/lib/ui/confirm-action";
import { useCallback, useEffect, useState } from "react";

type Consultation = Record<string, unknown> & {
  id: string;
  name?: string;
  phone?: string;
  typeLabel?: string;
  category?: string;
  categoryLabel?: string;
  specialtyLabel?: string;
  doctorName?: string;
  description?: string;
  estimate?: string;
  amount?: number;
  status?: string;
  videoStatus?: string;
  videoMeetingUrl?: string;
  preferredDateLabel?: string;
  preferredTimeLabel?: string;
};

export default function AdminConsultationsPage() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [visitTimeLabel, setVisitTimeLabel] = useState("");
  const [visitDateLabel, setVisitDateLabel] = useState("");
  const [rxId, setRxId] = useState("");
  const [rxDoctor, setRxDoctor] = useState("");
  const [rxMedications, setRxMedications] = useState("");
  const [rxDosage, setRxDosage] = useState("");
  const [rxDiagnosis, setRxDiagnosis] = useState("");
  const [rxRecommendations, setRxRecommendations] = useState("");
  const [rxMessage, setRxMessage] = useState("");
  const [linkMessage, setLinkMessage] = useState("");

  function patientTrackUrl(id: string) {
    if (typeof window === "undefined") return `${ROUTES.web.consultationTrack}/${id}`;
    return `${window.location.origin}${ROUTES.web.consultationTrack}/${id}`;
  }

  async function copyPatientLink(id: string) {
    setError("");
    setLinkMessage("");
    try {
      await navigator.clipboard.writeText(patientTrackUrl(id));
      setLinkMessage("لینک پیگیری بیمار کپی شد. می‌توانید برای بیمار بفرستید.");
    } catch {
      setError("کپی لینک ناموفق بود.");
    }
  }

  async function smsPatientLink(id: string) {
    setError("");
    setLinkMessage("");
    setBusyId(id);
    try {
      const res = await postAdminOps<{ message?: string; trackUrl?: string }>(
        "/api/admin/operations/consultations/notify-patient",
        { id },
      );
      setLinkMessage(res.message || "پیامک برای بیمار ارسال شد.");
      if (res.trackUrl) {
        try {
          await navigator.clipboard.writeText(res.trackUrl);
        } catch {
          /* optional */
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارسال پیامک بیمار ناموفق");
    } finally {
      setBusyId("");
    }
  }

  const reload = useCallback(async () => {
    const data = await fetchAdminOps<{ items: Consultation[] }>(
      "/api/admin/operations/consultations",
    );
    setItems(data.items);
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  function startEdit(c: Consultation) {
    setEditingId(c.id);
    setMeetingUrl(String(c.videoMeetingUrl || ""));
    setVisitTimeLabel(String(c.preferredTimeLabel || ""));
    setVisitDateLabel(String(c.preferredDateLabel || ""));
    setError("");
  }

  function cancelEdit() {
    setEditingId("");
    setMeetingUrl("");
    setVisitTimeLabel("");
    setVisitDateLabel("");
  }

  function startRx(c: Consultation) {
    setRxId(c.id);
    setRxDoctor(String(c.doctorName || ""));
    setRxMedications("");
    setRxDosage("");
    setRxDiagnosis("");
    setRxRecommendations("");
    setRxMessage("");
    setError("");
  }

  function cancelRx() {
    setRxId("");
    setRxDoctor("");
    setRxMedications("");
    setRxDosage("");
    setRxDiagnosis("");
    setRxRecommendations("");
  }

  function markAnswered(id: string) {
    if (!confirmAction("این مشاوره به‌عنوان پاسخ‌داده‌شده ثبت شود؟")) return;
    void patchAdminOps("/api/admin/operations/consultations", { id, status: "answered" })
      .then(() => reload())
      .catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }

  function markCancelled(id: string) {
    if (!confirmAction("این مشاوره لغو شود و در لیست بیماران لغو‌شده فالوآپ بیاید؟")) return;
    void patchAdminOps("/api/admin/operations/consultations", { id, status: "cancelled" })
      .then(() => reload())
      .catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }

  async function openVideo(id: string) {
    setError("");
    setBusyId(id);
    try {
      await patchAdminOps("/api/admin/operations/consultations", {
        id,
        videoStatus: "scheduled",
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "باز کردن ویدیو ناموفق");
    } finally {
      setBusyId("");
    }
  }

  async function joinVideo(id: string) {
    setError("");
    setBusyId(id);
    try {
      const row = items.find((c) => c.id === id);
      if (row?.videoMeetingUrl) {
        window.location.href = String(row.videoMeetingUrl);
        return;
      }
      const token = await mintAdminConsultationVideoToken(id);
      window.location.href = token.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "ورود به اتاق ناموفق");
      setBusyId("");
    }
  }

  async function completeVideo(id: string) {
    if (!confirmAction("جلسه ویدیو این مشاوره پایان یابد؟")) return;
    setError("");
    setBusyId(id);
    try {
      await patchAdminOps("/api/admin/operations/consultations", {
        id,
        videoStatus: "completed",
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "پایان جلسه ناموفق");
    } finally {
      setBusyId("");
    }
  }

  async function saveMeetingLink(id: string) {
    setError("");
    setBusyId(id);
    try {
      await patchAdminOps("/api/admin/operations/consultations", {
        id,
        videoMeetingUrl: meetingUrl.trim() || null,
        preferredTimeLabel: visitTimeLabel.trim() || null,
        preferredDateLabel: visitDateLabel.trim() || null,
      });
      cancelEdit();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ثبت لینک اتاق ناموفق");
    } finally {
      setBusyId("");
    }
  }

  async function savePrescription(c: Consultation) {
    if (!String(c.phone || "").trim()) {
      setError("موبایل بیمار برای ثبت نسخه در پرونده لازم است.");
      return;
    }
    if (!rxMedications.trim()) {
      setError("متن دارو / نسخه الزامی است.");
      return;
    }
    setError("");
    setRxMessage("");
    setBusyId(c.id);
    try {
      await postAdminOps("/api/admin/operations/health-records/entries", {
        patientPhone: String(c.phone),
        section: "prescription",
        date: new Date().toISOString().slice(0, 10),
        doctorName: rxDoctor.trim() || undefined,
        medications: rxMedications.trim(),
        dosageSchedule: rxDosage.trim() || undefined,
        diagnosis: rxDiagnosis.trim() || undefined,
        recommendations: rxRecommendations.trim() || undefined,
        consultationId: c.id,
        consultationNote: [
          c.typeLabel ? `نوع: ${String(c.typeLabel)}` : "",
          c.specialtyLabel ? `تخصص: ${String(c.specialtyLabel)}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
      });
      setRxMessage("نسخه در پرونده سلامت بیمار ثبت شد.");
      cancelRx();
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

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {rxMessage ? <p className="text-sm text-teal-700">{rxMessage}</p> : null}
      {linkMessage ? <p className="text-sm text-teal-700">{linkMessage}</p> : null}

      <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-4 text-sm leading-7 text-slate-700">
        <p className="font-extrabold text-cyan-950">راهنمای ویزیت تصویری (پزشک / اپراتور)</p>
        <ol className="mt-2 list-decimal space-y-1 pr-5 text-xs font-bold text-slate-600">
          <li>جلسه را با «باز کردن ویزیت تصویری» یا «ثبت لینک اتاق / ساعت» آماده کنید.</li>
          <li>
            برای بیمار لینک صفحه پیگیری را کپی یا با پیامک بفرستید — بیمار با اکانت خودش وارد همان
            صفحه می‌شود و دکمه «ورود به اتاق» را می‌زند.
          </li>
          <li>خودتان با «ورود به ویزیت تصویری» وارد اتاق شوید؛ ۵ دقیقه قبل در اتاق باشید.</li>
          <li>لینک مستقیم Jitsi پزشک را برای بیمار نفرستید؛ لینک بیمار همان صفحه پیگیری است.</li>
        </ol>
      </div>

      <AdminTable
        headers={[
          "نام",
          "موبایل",
          "نوع",
          "دسته",
          "تخصص",
          "پزشک",
          "روز / ساعت",
          "شرح",
          "مبلغ",
          "وضعیت",
          "ویدیو",
          "عملیات",
        ]}
        empty="درخواست مشاوره‌ای ثبت نشده."
      >
        {items.map((c) => {
          const videoOk = supportsConsultationVideo(
            c.category ? String(c.category) : undefined,
          );
          const videoStatus = String(c.videoStatus || "none");
          const joinable = videoOk && canJoinConsultationVideoStatus(videoStatus);
          const busy = busyId === c.id;
          const editing = editingId === c.id;
          const writingRx = rxId === c.id;
          return (
            <tr key={c.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{String(c.name || "—")}</td>
              <td className="px-4 py-3">{String(c.phone || "—")}</td>
              <td className="px-4 py-3">{String(c.typeLabel || "—")}</td>
              <td className="px-4 py-3">{String(c.categoryLabel || "—")}</td>
              <td className="px-4 py-3">{String(c.specialtyLabel || "—")}</td>
              <td className="px-4 py-3">{String(c.doctorName || "—")}</td>
              <td className="px-4 py-3 text-xs">
                {c.preferredDateLabel || c.preferredTimeLabel
                  ? `${String(c.preferredDateLabel || "")} ${String(c.preferredTimeLabel || "")}`.trim()
                  : "—"}
                {c.videoMeetingUrl ? (
                  <p className="mt-1 max-w-[12rem] truncate text-[11px] text-cyan-800">
                    لینک: {String(c.videoMeetingUrl)}
                  </p>
                ) : null}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-xs">
                {String(c.description || "—")}
              </td>
              <td className="px-4 py-3">
                {Number(c.amount || 0).toLocaleString("fa-IR")}
                {c.estimate ? (
                  <>
                    <br />
                    <span className="text-xs text-slate-500">{String(c.estimate)}</span>
                  </>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <AdminBadge
                  tone={
                    c.status === "answered"
                      ? "success"
                      : c.status === "cancelled"
                        ? "danger"
                        : "warn"
                  }
                >
                  {c.status === "answered"
                    ? "پاسخ داده"
                    : c.status === "cancelled"
                      ? "لغو شده"
                      : "در انتظار"}
                </AdminBadge>
              </td>
              <td className="px-4 py-3 text-xs font-bold text-slate-700">
                {videoOk ? videoStatusLabel(videoStatus) : "—"}
              </td>
              <td className="space-y-1 px-4 py-3">
                {c.status !== "answered" && c.status !== "cancelled" ? (
                  <button
                    type="button"
                    className="block text-xs font-semibold text-teal-700"
                    onClick={() => markAnswered(String(c.id))}
                  >
                    علامت پاسخ
                  </button>
                ) : null}
                {c.status !== "cancelled" && c.status !== "answered" ? (
                  <button
                    type="button"
                    className="block text-xs font-semibold text-rose-700"
                    onClick={() => markCancelled(String(c.id))}
                  >
                    لغو مشاوره
                  </button>
                ) : null}
                {videoOk && c.status !== "cancelled" && videoStatus === "none" ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="block text-xs font-semibold text-cyan-800 disabled:opacity-50"
                    onClick={() => void openVideo(String(c.id))}
                  >
                    باز کردن ویزیت تصویری
                  </button>
                ) : null}
                {videoOk && c.status !== "cancelled" && joinable ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      className="block text-xs font-semibold text-teal-700 disabled:opacity-50"
                      onClick={() => void joinVideo(String(c.id))}
                    >
                      ورود به ویزیت تصویری
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="block text-xs font-semibold text-cyan-800 disabled:opacity-50"
                      onClick={() => void copyPatientLink(String(c.id))}
                    >
                      کپی لینک بیمار
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="block text-xs font-semibold text-violet-800 disabled:opacity-50"
                      onClick={() => void smsPatientLink(String(c.id))}
                    >
                      پیامک لینک به بیمار
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="block text-xs font-semibold text-rose-700 disabled:opacity-50"
                      onClick={() => void completeVideo(String(c.id))}
                    >
                      پایان جلسه ویدیو
                    </button>
                  </>
                ) : null}
                {videoOk && c.status !== "cancelled" && !editing ? (
                  <button
                    type="button"
                    disabled={busy || videoStatus === "completed"}
                    className="block text-xs font-semibold text-slate-800 disabled:opacity-50"
                    onClick={() => startEdit(c)}
                  >
                    ثبت لینک اتاق / ساعت
                  </button>
                ) : null}
                {videoOk && c.status !== "cancelled" && editing ? (
                  <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <label className="block text-[11px] font-bold text-slate-600">
                      لینک اتاق
                      <input
                        type="url"
                        dir="ltr"
                        className="mt-1 w-56 rounded border border-slate-200 px-2 py-1 text-xs"
                        placeholder="https://..."
                        value={meetingUrl}
                        onChange={(e) => setMeetingUrl(e.target.value)}
                      />
                    </label>
                    <label className="block text-[11px] font-bold text-slate-600">
                      روز ویزیت
                      <input
                        type="text"
                        className="mt-1 w-56 rounded border border-slate-200 px-2 py-1 text-xs"
                        placeholder="مثلاً ۱۴۰۵/۰۷/۱۱"
                        value={visitDateLabel}
                        onChange={(e) => setVisitDateLabel(e.target.value)}
                      />
                    </label>
                    <label className="block text-[11px] font-bold text-slate-600">
                      ساعت ویزیت
                      <input
                        type="text"
                        className="mt-1 w-56 rounded border border-slate-200 px-2 py-1 text-xs"
                        placeholder="مثلاً ۱۴:۳۰"
                        value={visitTimeLabel}
                        onChange={(e) => setVisitTimeLabel(e.target.value)}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        className="text-xs font-bold text-teal-700 disabled:opacity-50"
                        onClick={() => void saveMeetingLink(c.id)}
                      >
                        ذخیره
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="text-xs font-bold text-slate-500 disabled:opacity-50"
                        onClick={cancelEdit}
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : null}
                {c.status !== "cancelled" && !writingRx ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="block text-xs font-semibold text-violet-800 disabled:opacity-50"
                    onClick={() => startRx(c)}
                  >
                    ثبت نسخه در پرونده
                  </button>
                ) : null}
                {c.status !== "cancelled" && writingRx ? (
                  <div className="mt-2 space-y-2 rounded-lg border border-violet-200 bg-violet-50/60 p-2">
                    <p className="text-[11px] font-bold text-violet-900">
                      نسخه در پرونده سلامت ذخیره می‌شود
                    </p>
                    <label className="block text-[11px] font-bold text-slate-600">
                      پزشک
                      <input
                        type="text"
                        className="mt-1 w-56 rounded border border-slate-200 px-2 py-1 text-xs"
                        value={rxDoctor}
                        onChange={(e) => setRxDoctor(e.target.value)}
                      />
                    </label>
                    <label className="block text-[11px] font-bold text-slate-600">
                      داروها / نسخه
                      <textarea
                        className="mt-1 w-56 rounded border border-slate-200 px-2 py-1 text-xs"
                        rows={3}
                        value={rxMedications}
                        onChange={(e) => setRxMedications(e.target.value)}
                        placeholder="نام دارو، دوز، نحوه مصرف"
                      />
                    </label>
                    <label className="block text-[11px] font-bold text-slate-600">
                      زمان‌بندی مصرف
                      <textarea
                        className="mt-1 w-56 rounded border border-slate-200 px-2 py-1 text-xs"
                        rows={2}
                        value={rxDosage}
                        onChange={(e) => setRxDosage(e.target.value)}
                      />
                    </label>
                    <label className="block text-[11px] font-bold text-slate-600">
                      تشخیص
                      <textarea
                        className="mt-1 w-56 rounded border border-slate-200 px-2 py-1 text-xs"
                        rows={2}
                        value={rxDiagnosis}
                        onChange={(e) => setRxDiagnosis(e.target.value)}
                      />
                    </label>
                    <label className="block text-[11px] font-bold text-slate-600">
                      توصیه‌ها
                      <textarea
                        className="mt-1 w-56 rounded border border-slate-200 px-2 py-1 text-xs"
                        rows={2}
                        value={rxRecommendations}
                        onChange={(e) => setRxRecommendations(e.target.value)}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        className="text-xs font-bold text-violet-800 disabled:opacity-50"
                        onClick={() => void savePrescription(c)}
                      >
                        ذخیره در پرونده
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="text-xs font-bold text-slate-500 disabled:opacity-50"
                        onClick={cancelRx}
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : null}
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </div>
  );
}
