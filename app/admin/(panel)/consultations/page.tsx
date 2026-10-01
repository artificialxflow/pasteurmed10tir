"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import {
  canJoinConsultationVideoStatus,
  videoStatusLabel,
} from "@/lib/jitsi/labels";
import {
  fetchAdminOps,
  mintAdminConsultationVideoToken,
  patchAdminOps,
} from "@/lib/operations/client";
import { confirmAction } from "@/lib/ui/confirm-action";
import { useCallback, useEffect, useState } from "react";

type Consultation = Record<string, unknown> & {
  id: string;
  name?: string;
  phone?: string;
  typeLabel?: string;
  categoryLabel?: string;
  specialtyLabel?: string;
  doctorName?: string;
  description?: string;
  estimate?: string;
  amount?: number;
  status?: string;
  videoStatus?: string;
};

export default function AdminConsultationsPage() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const reload = useCallback(async () => {
    const data = await fetchAdminOps<{ items: Consultation[] }>(
      "/api/admin/operations/consultations",
    );
    setItems(data.items);
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  function markAnswered(id: string) {
    if (!confirmAction("این مشاوره به‌عنوان پاسخ‌داده‌شده ثبت شود؟")) return;
    void patchAdminOps("/api/admin/operations/consultations", { id, status: "answered" })
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

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
          const videoStatus = String(c.videoStatus || "none");
          const joinable = canJoinConsultationVideoStatus(videoStatus);
          const busy = busyId === c.id;
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
                <AdminBadge tone={c.status === "answered" ? "success" : "warn"}>
                  {c.status === "answered" ? "پاسخ داده" : "در انتظار"}
                </AdminBadge>
              </td>
              <td className="px-4 py-3 text-xs font-bold text-slate-700">
                {videoStatusLabel(videoStatus)}
              </td>
              <td className="space-y-1 px-4 py-3">
                {c.status !== "answered" ? (
                  <button
                    type="button"
                    className="block text-xs font-semibold text-teal-700"
                    onClick={() => markAnswered(String(c.id))}
                  >
                    علامت پاسخ
                  </button>
                ) : null}
                {videoStatus === "none" ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="block text-xs font-semibold text-cyan-800 disabled:opacity-50"
                    onClick={() => void openVideo(String(c.id))}
                  >
                    باز کردن ویزیت تصویری
                  </button>
                ) : null}
                {joinable ? (
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
                      className="block text-xs font-semibold text-rose-700 disabled:opacity-50"
                      onClick={() => void completeVideo(String(c.id))}
                    >
                      پایان جلسه ویدیو
                    </button>
                  </>
                ) : null}
                {c.status === "answered" && videoStatus === "none" ? (
                  <span className="text-xs text-slate-400">—</span>
                ) : null}
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </div>
  );
}
