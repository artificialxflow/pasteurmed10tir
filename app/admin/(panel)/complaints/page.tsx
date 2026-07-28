"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import type { Complaint } from "@/lib/patient";
import { PasteurStorage } from "@/lib/storage";
import { useEffect, useState } from "react";

export default function AdminComplaintsPage() {
  const [items, setItems] = useState<Complaint[]>([]);

  function reload() {
    setItems(PasteurStorage.getComplaints());
  }

  useEffect(() => {
    PasteurStorage.initPatientDomainIfNeeded();
    reload();
  }, []);

  return (
    <AdminTable headers={["نام", "موضوع", "وضعیت", "عملیات"]} empty="شکایتی نیست.">
      {items.map((c) => (
        <tr key={c.id} className="border-t border-slate-100">
          <td className="px-4 py-3">
            {c.name}
            <div className="text-xs text-slate-500">{c.phone}</div>
          </td>
          <td className="px-4 py-3">
            <p className="font-bold">{c.subject}</p>
            <p className="text-xs text-slate-500">{c.message}</p>
          </td>
          <td className="px-4 py-3">
            <AdminBadge tone={c.status === "closed" ? "success" : "warn"}>{c.status}</AdminBadge>
          </td>
          <td className="px-4 py-3 text-xs font-bold">
            <button
              type="button"
              className="text-cyan-800"
              onClick={() => {
                PasteurStorage.updateComplaintStatus(c.id, "reviewing");
                reload();
              }}
            >
              بررسی
            </button>{" "}
            <button
              type="button"
              className="text-teal-700"
              onClick={() => {
                PasteurStorage.updateComplaintStatus(c.id, "closed");
                reload();
              }}
            >
              بستن
            </button>
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
