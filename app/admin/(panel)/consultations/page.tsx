"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import {
  consultationSupportsConsultationRoom,
  consultationSupportsLiveSession,
} from "@/lib/consultation/modality";
import { videoStatusLabel } from "@/lib/jitsi/labels";
import { isExternalConsultationMeetingUrl } from "@/lib/jitsi/meeting-url";
import { canJoinConsultationVideoNow } from "@/lib/jitsi/video-window";
import {
  fetchAdminOps,
  mintAdminConsultationVideoToken,
  patchAdminOps,
  postAdminOps,
} from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import { confirmAction } from "@/lib/ui/confirm-action";
import { cn, formatPrice } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

function actionBtnClass(tone: "teal" | "cyan" | "violet" | "rose" | "slate") {
  const tones = {
    teal: "border-teal-200 text-teal-800 hover:bg-teal-50",
    cyan: "border-cyan-200 text-cyan-900 hover:bg-cyan-50",
    violet: "border-violet-200 text-violet-900 hover:bg-violet-50",
    rose: "border-rose-200 text-rose-800 hover:bg-rose-50",
    slate: "border-slate-200 text-slate-800 hover:bg-slate-50",
  };
  return cn(
    "rounded-md border bg-white px-2 py-1 text-[11px] font-bold leading-snug disabled:opacity-50",
    tones[tone],
  );
}

const TD = "px-2 py-2 align-top text-xs text-slate-800";

type Consultation = Record<string, unknown> & {
  id: string;
  name?: string;
  phone?: string;
  type?: string;
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
  preferredDate?: string;
  preferredDateLabel?: string;
  preferredTime?: string;
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
      if (row?.videoMeetingUrl && isExternalConsultationMeetingUrl(row.videoMeetingUrl)) {
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

      <details className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-3 text-sm text-slate-700">
        <summary className="cursor-pointer font-extrabold text-cyan-950">
          راهنمای اتاق مشاوره (پزشک / اپراتور)
        </summary>
        <ol className="mt-2 list-decimal space-y-1 pr-5 text-xs font-bold leading-6 text-slate-600">
          <li>جلسه را با «باز کردن ویزیت تصویری» یا «ثبت لینک اتاق / ساعت» آماده کنید.</li>
          <li>
            برای بیمار لینک صفحه پیگیری را کپی یا با پیامک بفرستید — بیمار با اکانت خودش وارد همان
            صفحه می‌شود و دکمه «ورود به اتاق» را می‌زند.
          </li>
          <li>خودتان با «ورود به ویزیت تصویری» وارد اتاق شوید؛ ۵ دقیقه قبل در اتاق باشید.</li>
          <li>لینک مستقیم Jitsi پزشک را برای بیمار نفرستید؛ لینک بیمار همان صفحه پیگیری است.</li>
        </ol>
      </details>

      <AdminTable
        compact
        minTableWidth="min-w-[52rem]"
        colWidths={["14%", "20%", "17%", "11%", "12%", "26%"]}
        headers={["مراجع", "خدمت", "پزشک و زمان", "مبلغ", "وضعیت", "عملیات"]}
        empty="درخواست مشاوره‌ای ثبت نشده."
      >
        {items.map((c) => {
          const roomOk = consultationSupportsConsultationRoom({
            category: c.category ? String(c.category) : undefined,
            type: c.type ? String(c.type) : undefined,
          });
          const liveOk = consultationSupportsLiveSession({
            category: c.category ? String(c.category) : undefined,
            type: c.type ? String(c.type) : undefined,
          });
          const videoStatus = String(c.videoStatus || "none");
          const joinable =
            liveOk &&
            canJoinConsultationVideoNow({
              videoStatus,
              preferredDate: c.preferredDate,
              preferredTime: c.preferredTime,
            });
          const busy = busyId === c.id;
          const serviceLine = [
            c.typeLabel,
            c.categoryLabel,
            c.specialtyLabel,
          ]
            .map((x) => String(x || "").trim())
            .filter(Boolean)
            .join(" · ");
          const whenLabel =
            c.preferredDateLabel || c.preferredTimeLabel
              ? `${String(c.preferredDateLabel || "")} ${String(c.preferredTimeLabel || "")}`.trim()
              : "—";
          const desc = String(c.description || "").trim();
          return (
            <tr key={c.id} className="border-t border-slate-100">
              <td className={TD}>
                <p className="font-bold text-slate-900">{String(c.name || "—")}</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-500" dir="ltr">
                  {String(c.phone || "—")}
                </p>
                {desc ? (
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-500" title={desc}>
                    {desc}
                  </p>
                ) : null}
              </td>
              <td className={TD}>
                <p className="font-bold text-slate-800">{serviceLine || "—"}</p>
              </td>
              <td className={TD}>
                <p className="font-bold">{String(c.doctorName || "—")}</p>
                <p className="mt-0.5 text-slate-600">{whenLabel}</p>
                {c.videoMeetingUrl ? (
                  <p
                    className="mt-1 truncate text-[10px] text-cyan-800"
                    dir="ltr"
                    title={String(c.videoMeetingUrl)}
                  >
                    لینک خارجی
                  </p>
                ) : null}
              </td>
              <td className={cn(TD, "whitespace-nowrap")}>
                <p className="font-bold">{formatPrice(Number(c.amount || 0))}</p>
                {c.estimate ? (
                  <p className="mt-0.5 text-[10px] text-slate-500">{String(c.estimate)}</p>
                ) : null}
              </td>
              <td className={TD}>
                <div className="flex flex-col gap-1">
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
                  {liveOk ? (
                    <span className="text-[10px] font-bold text-slate-600">
                      {videoStatusLabel(videoStatus)}
                    </span>
                  ) : null}
                </div>
              </td>
              <td className={cn(TD, "lg:sticky lg:left-0 lg:z-[1] lg:bg-white")}>
                <div className="flex max-w-[14rem] flex-wrap gap-1">
                  {c.status !== "answered" && c.status !== "cancelled" ? (
                    <button
                      type="button"
                      className={actionBtnClass("teal")}
                      onClick={() => markAnswered(String(c.id))}
                    >
                      پاسخ
                    </button>
                  ) : null}
                  {c.status !== "cancelled" && c.status !== "answered" ? (
                    <button
                      type="button"
                      className={actionBtnClass("rose")}
                      onClick={() => markCancelled(String(c.id))}
                    >
                      لغو
                    </button>
                  ) : null}
                  {roomOk && c.status !== "cancelled" && videoStatus === "none" ? (
                    <button
                      type="button"
                      disabled={busy}
                      className={actionBtnClass("cyan")}
                      onClick={() => void openVideo(String(c.id))}
                    >
                      باز کردن اتاق
                    </button>
                  ) : null}
                  {liveOk && c.status !== "cancelled" && joinable ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        className={actionBtnClass("teal")}
                        onClick={() => void joinVideo(String(c.id))}
                      >
                        ورود اتاق
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className={actionBtnClass("cyan")}
                        onClick={() => void copyPatientLink(String(c.id))}
                      >
                        کپی لینک
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className={actionBtnClass("violet")}
                        onClick={() => void smsPatientLink(String(c.id))}
                      >
                        SMS بیمار
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className={actionBtnClass("rose")}
                        onClick={() => void completeVideo(String(c.id))}
                      >
                        پایان
                      </button>
                    </>
                  ) : null}
                  {roomOk && c.status !== "cancelled" ? (
                    <button
                      type="button"
                      disabled={busy || videoStatus === "completed"}
                      className={actionBtnClass("slate")}
                      onClick={() => startEdit(c)}
                    >
                      لینک / ساعت
                    </button>
                  ) : null}
                  {c.status !== "cancelled" ? (
                    <button
                      type="button"
                      disabled={busy}
                      className={actionBtnClass("violet")}
                      onClick={() => startRx(c)}
                    >
                      نسخه
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {editingId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="presentation"
          onClick={cancelEdit}
        >
          <div
            className="w-full max-w-md"
            role="dialog"
            aria-labelledby="edit-meeting-title"
            onClick={(e) => e.stopPropagation()}
          >
          <Card hover={false} className="space-y-3 p-5">
            <h3 id="edit-meeting-title" className="font-extrabold text-slate-900">
              ثبت لینک اتاق و زمان ویزیت
            </h3>
            <div className="space-y-3">
              <div>
                <FormLabel>لینک اتاق (اختیاری)</FormLabel>
                <FormInput
                  type="url"
                  dir="ltr"
                  placeholder="https://..."
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FormLabel>روز ویزیت</FormLabel>
                  <FormInput
                    placeholder="مثلاً ۱۴۰۵/۰۷/۱۱"
                    value={visitDateLabel}
                    onChange={(e) => setVisitDateLabel(e.target.value)}
                  />
                </div>
                <div>
                  <FormLabel>ساعت ویزیت</FormLabel>
                  <FormInput
                    placeholder="مثلاً ۱۴:۳۰"
                    value={visitTimeLabel}
                    onChange={(e) => setVisitTimeLabel(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={busyId === editingId}
                className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                onClick={() => void saveMeetingLink(editingId)}
              >
                ذخیره
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
                onClick={cancelEdit}
              >
                انصراف
              </button>
            </div>
          </Card>
          </div>
        </div>
      ) : null}

      {rxId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="presentation"
          onClick={cancelRx}
        >
          <div
            className="w-full max-w-lg"
            role="dialog"
            aria-labelledby="rx-title"
            onClick={(e) => e.stopPropagation()}
          >
          <Card hover={false} className="max-h-[90vh] space-y-3 overflow-y-auto p-5">
            <h3 id="rx-title" className="font-extrabold text-slate-900">
              ثبت نسخه در پرونده سلامت
            </h3>
            <p className="text-xs text-slate-500">نسخه برای بیمار با موبایل ثبت‌شده ذخیره می‌شود.</p>
            <div className="space-y-3">
              <div>
                <FormLabel>پزشک</FormLabel>
                <FormInput value={rxDoctor} onChange={(e) => setRxDoctor(e.target.value)} />
              </div>
              <div>
                <FormLabel>داروها / نسخه</FormLabel>
                <FormTextarea
                  rows={3}
                  value={rxMedications}
                  onChange={(e) => setRxMedications(e.target.value)}
                  placeholder="نام دارو، دوز، نحوه مصرف"
                />
              </div>
              <div>
                <FormLabel>زمان‌بندی مصرف</FormLabel>
                <FormTextarea rows={2} value={rxDosage} onChange={(e) => setRxDosage(e.target.value)} />
              </div>
              <div>
                <FormLabel>تشخیص</FormLabel>
                <FormTextarea rows={2} value={rxDiagnosis} onChange={(e) => setRxDiagnosis(e.target.value)} />
              </div>
              <div>
                <FormLabel>توصیه‌ها</FormLabel>
                <FormTextarea
                  rows={2}
                  value={rxRecommendations}
                  onChange={(e) => setRxRecommendations(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={busyId === rxId}
                className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                onClick={() => {
                  const row = items.find((i) => i.id === rxId);
                  if (row) void savePrescription(row);
                }}
              >
                ذخیره در پرونده
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
                onClick={cancelRx}
              >
                انصراف
              </button>
            </div>
          </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
