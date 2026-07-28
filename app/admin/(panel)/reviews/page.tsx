"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { PasteurStorage } from "@/lib/storage";
import { useEffect, useState } from "react";
import type { DoctorReview } from "@/lib/patient";

export default function AdminReviewsPage() {
  const [items, setItems] = useState<DoctorReview[]>([]);

  function reload() {
    PasteurStorage.initPatientDomainIfNeeded();
    setItems(PasteurStorage.getDoctorReviews());
  }

  useEffect(() => {
    reload();
  }, []);

  return (
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
                PasteurStorage.updateDoctorReviewStatus(r.id, "approved");
                reload();
              }}
            >
              تأیید
            </button>{" "}
            <button
              type="button"
              className="text-slate-600"
              onClick={() => {
                PasteurStorage.updateDoctorReviewStatus(r.id, "hidden");
                reload();
              }}
            >
              مخفی
            </button>
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
