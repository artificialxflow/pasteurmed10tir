"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { fetchAdminOps, patchAdminOps } from "@/lib/operations/client";
import { confirmAction } from "@/lib/ui/confirm-action";
import { useCallback, useEffect, useState } from "react";
import type { DoctorReview } from "@/lib/patient";

type ServiceReviewRow = {
  id: string;
  staffName: string;
  staffKind: string;
  rating: number;
  comment: string;
  status: string;
  submittedBy?: string;
  patientPhone?: string;
};

type ReviewStatus = "pending" | "approved" | "hidden";

function statusTone(s: ReviewStatus | undefined) {
  if (s === "approved") return "success";
  if (s === "hidden") return "neutral";
  return "warn";
}

function statusLabel(s: ReviewStatus | undefined) {
  if (s === "approved") return "تأیید";
  if (s === "hidden") return "مخفی";
  return "انتظار";
}

function sourceLabel(source?: string) {
  if (source === "follow_up") return "فالوآپ";
  return "بیمار";
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<DoctorReview[]>([]);
  const [serviceReviews, setServiceReviews] = useState<ServiceReviewRow[]>([]);
  const [staffKind, setStaffKind] = useState("all");

  const reload = useCallback(async () => {
    const data = await fetchAdminOps<{ items: DoctorReview[]; serviceReviews?: ServiceReviewRow[] }>(
      "/api/admin/operations/reviews",
    );
    setItems(data.items);
    setServiceReviews(data.serviceReviews || []);
  }, []);

  useEffect(() => {
    void reload().catch(() => {
      setItems([]);
      setServiceReviews([]);
    });
  }, [reload]);

  function patchDoctorReview(
    id: string,
    patch: { ratingStatus?: ReviewStatus; commentStatus?: ReviewStatus },
  ) {
    void patchAdminOps("/api/admin/operations/reviews", { id, ...patch }).then(() => reload());
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        امتیاز و متن نظر جدا تأیید می‌شوند. امتیاز فالوآپ معمولاً خودکار در میانگین سایت است؛ نظر
        یادداشت فالوآپ پس از تأیید نمایش داده می‌شود. امتیاز بیمار بلافاصله در میانگین است؛ متن
        نظر پس از تأیید.
      </p>

      <AdminTable
        compact
        minTableWidth="min-w-[48rem]"
        colWidths={["12%", "14%", "8%", "6%", "22%", "8%", "8%", "22%"]}
        headers={[
          "پزشک",
          "منبع / ثبت‌کننده",
          "امتیاز",
          "نظر",
          "متن",
          "وضعیت امتیاز",
          "وضعیت نظر",
          "عملیات",
        ]}
        empty="نظری نیست."
      >
        {items.map((r) => {
          const rs = (r.ratingStatus || r.status) as ReviewStatus;
          const cs = (r.commentStatus || r.status) as ReviewStatus;
          const hasComment = Boolean(r.comment?.trim());
          return (
            <tr key={r.id} className="border-t border-slate-100 align-top text-xs">
              <td className="px-2 py-2 font-bold">{r.doctorName}</td>
              <td className="px-2 py-2">
                <p>{sourceLabel(r.source)}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {r.submittedBy || r.patientName || r.phone || "—"}
                </p>
              </td>
              <td className="px-2 py-2">{r.rating}</td>
              <td className="px-2 py-2">{hasComment ? "دارد" : "—"}</td>
              <td className="max-w-[14rem] truncate px-2 py-2" title={r.comment}>
                {hasComment ? r.comment : "—"}
              </td>
              <td className="px-2 py-2">
                <AdminBadge tone={statusTone(rs)}>{statusLabel(rs)}</AdminBadge>
              </td>
              <td className="px-2 py-2">
                <AdminBadge tone={statusTone(cs)}>{statusLabel(cs)}</AdminBadge>
              </td>
              <td className="px-2 py-2">
                <div className="flex max-w-[11rem] flex-wrap gap-1">
                  {rs !== "approved" ? (
                    <button
                      type="button"
                      className="rounded border border-teal-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-teal-800"
                      onClick={() => {
                        if (!confirmAction("امتیاز در میانگین سایت تأیید شود؟")) return;
                        patchDoctorReview(r.id, { ratingStatus: "approved" });
                      }}
                    >
                      تأیید امتیاز
                    </button>
                  ) : null}
                  {rs !== "hidden" ? (
                    <button
                      type="button"
                      className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600"
                      onClick={() => {
                        if (!confirmAction("امتیاز از میانگین سایت مخفی شود؟")) return;
                        patchDoctorReview(r.id, { ratingStatus: "hidden" });
                      }}
                    >
                      مخفی امتیاز
                    </button>
                  ) : null}
                  {hasComment && cs !== "approved" ? (
                    <button
                      type="button"
                      className="rounded border border-violet-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-violet-900"
                      onClick={() => {
                        if (!confirmAction("متن نظر در سایت نمایش داده شود؟")) return;
                        patchDoctorReview(r.id, { commentStatus: "approved" });
                      }}
                    >
                      تأیید نظر
                    </button>
                  ) : null}
                  {hasComment && cs !== "hidden" ? (
                    <button
                      type="button"
                      className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600"
                      onClick={() => {
                        if (!confirmAction("متن نظر مخفی شود؟")) return;
                        patchDoctorReview(r.id, { commentStatus: "hidden" });
                      }}
                    >
                      مخفی نظر
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      <div>
        <p className="mb-1 text-lg font-extrabold text-slate-900">نظرات اعزام خانگی (پرستاری / پزشکی در منزل)</p>
        <p className="mb-3 text-xs text-slate-500">
          بیمار بعد از انجام خدمت در صفحه پیگیری امتیاز می‌دهد. اینجا تأیید یا مخفی کنید.
        </p>
        <select
          className="mb-3 rounded-lg border border-slate-200 px-2 py-1 text-sm"
          value={staffKind}
          onChange={(e) => setStaffKind(e.target.value)}
        >
          <option value="all">همه نیروها</option>
          <option value="nurse">پرستار</option>
          <option value="physician">پزشک</option>
        </select>
        <AdminTable
          headers={["نیرو", "ثبت‌کننده نظر", "امتیاز", "نظر", "وضعیت", "عملیات"]}
          empty="امتیاز خانگی ثبت نشده."
        >
          {serviceReviews
            .filter((r) => staffKind === "all" || r.staffKind === staffKind)
            .map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{r.staffName}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                  {r.submittedBy || r.patientPhone || "—"}
                </td>
                <td className="px-4 py-3">{r.rating}</td>
                <td className="max-w-xs truncate px-4 py-3">{r.comment}</td>
                <td className="px-4 py-3">
                  <AdminBadge tone={r.status === "approved" ? "success" : "warn"}>{r.status}</AdminBadge>
                </td>
                <td className="px-4 py-3 text-xs font-bold">
                  <button
                    type="button"
                    className="text-teal-700"
                    onClick={() => {
                      if (!confirmAction("این نظر تأیید و در سایت نمایش داده شود؟")) return;
                      void patchAdminOps("/api/admin/operations/reviews", {
                        id: r.id,
                        status: "approved",
                        kind: "service",
                      }).then(() => reload());
                    }}
                  >
                    تأیید
                  </button>{" "}
                  <button
                    type="button"
                    className="text-slate-600"
                    onClick={() => {
                      if (!confirmAction("این نظر مخفی شود؟")) return;
                      void patchAdminOps("/api/admin/operations/reviews", {
                        id: r.id,
                        status: "hidden",
                        kind: "service",
                      }).then(() => reload());
                    }}
                  >
                    مخفی
                  </button>
                </td>
              </tr>
            ))}
        </AdminTable>
      </div>
    </div>
  );
}
