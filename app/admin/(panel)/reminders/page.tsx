"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { PasteurStorage } from "@/lib/storage";
import { useEffect, useState } from "react";

type ReminderRow = Record<string, unknown> & {
  id: string;
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
  day?: string;
  timeLabel?: string;
  optionLabel?: string;
  status?: string;
};

export default function AdminRemindersPage() {
  const [items, setItems] = useState<ReminderRow[]>([]);

  useEffect(() => {
    setItems(PasteurStorage.getReminders() as ReminderRow[]);
  }, []);

  return (
    <AdminTable
      headers={["مراجع", "موبایل", "پزشک", "زمان نوبت", "یادآور", "وضعیت"]}
      empty="یادآوری ثبت نشده."
    >
      {items.map((r) => (
        <tr key={r.id} className="border-t border-slate-100">
          <td className="px-4 py-3">{String(r.patientName || "—")}</td>
          <td className="px-4 py-3">{String(r.patientPhone || "—")}</td>
          <td className="px-4 py-3">{String(r.doctorName || "—")}</td>
          <td className="px-4 py-3">
            {String(r.day || "")} {String(r.timeLabel || "")}
          </td>
          <td className="px-4 py-3">{String(r.optionLabel || "—")}</td>
          <td className="px-4 py-3">
            <AdminBadge tone={r.status === "active" ? "success" : "danger"}>
              {r.status === "active" ? "فعال" : "غیرفعال"}
            </AdminBadge>
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
