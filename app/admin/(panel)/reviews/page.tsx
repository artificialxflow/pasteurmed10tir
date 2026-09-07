"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { fetchAdminOps, patchAdminOps } from "@/lib/operations/client";
import { useCallback, useEffect, useState } from "react";
import type { DoctorReview } from "@/lib/patient";

type ServiceReviewRow = {
  id: string;
  staffName: string;
  staffKind: string;
  rating: number;
  comment: string;
  status: string;
};

export default function AdminReviewsPage() {
  const [items, setItems] = useState<DoctorReview[]>([]);
  const [serviceReviews, setServiceReviews] = useState<ServiceReviewRow[]>([]);

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

  return (
    <div className="space-y-8">
      <AdminTable headers={["پزشک", "امتیاز", "نظر", "وضعیت", "عملیات"]} empty="نظری نیست.">
        {items.map((r) => (
          <tr key={r.id} className="border-t border-slate-100">
            <td className="px-4 py-3">{r.doctorName}</td>
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
                  void patchAdminOps("/api/admin/operations/reviews", {
                    id: r.id,
                    status: "approved",
                  }).then(() => reload());
                }}
              >
                تأیید
              </button>{" "}
              <button
                type="button"
                className="text-slate-600"
                onClick={() => {
                  void patchAdminOps("/api/admin/operations/reviews", {
                    id: r.id,
                    status: "hidden",
                  }).then(() => reload());
                }}
              >
                مخفی
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      <div>
        <p className="mb-3 text-sm font-extrabold text-slate-900">امتیاز اعزام خانگی</p>
        <AdminTable headers={["نیرو", "امتیاز", "نظر", "وضعیت", "عملیات"]} empty="امتیاز خانگی ثبت نشده.">
          {serviceReviews.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                {r.staffName}
                <span className="mr-1 text-xs text-slate-500">
                  {r.staffKind === "physician" ? "پزشک" : "پرستار"}
                </span>
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
