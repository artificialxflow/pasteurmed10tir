"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { PasteurStorage, type Booking } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Filter = "all" | "visit" | "treatment";

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);

  function reload(type: Filter = filter) {
    let list = PasteurStorage.getBookings();
    if (type !== "all") list = list.filter((b) => b.type === type);
    setBookings(list);
  }

  useEffect(() => {
    reload("all");
  }, []);

  function cancelBooking(id: string) {
    if (!window.confirm("آیا از لغو این رزرو مطمئن هستید؟")) return;
    PasteurStorage.updateBooking(id, { status: "cancelled" });
    reload(filter);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "all", label: "همه" },
            { id: "visit", label: "ویزیت" },
            { id: "treatment", label: "درمان" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setFilter(item.id);
              reload(item.id);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold",
              filter === item.id
                ? "border-green-300 bg-green-100 text-green-800"
                : "border-slate-300 bg-slate-100 text-slate-700",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <AdminTable
        headers={["کد", "مراجع", "پزشک", "نوع", "زمان", "مبلغ", "وضعیت", "عملیات"]}
        empty="رزروی ثبت نشده است."
      >
        {bookings.map((b) => (
          <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
            <td className="px-4 py-3 font-mono text-xs">{b.id}</td>
            <td className="px-4 py-3">{b.patientName}</td>
            <td className="px-4 py-3">{b.doctorName}</td>
            <td className="px-4 py-3">{b.typeLabel}</td>
            <td className="px-4 py-3">
              {b.day} — {b.timeLabel}
            </td>
            <td className="px-4 py-3">{(b.amount || 0).toLocaleString("fa-IR")}</td>
            <td className="px-4 py-3">
              <AdminBadge
                tone={
                  b.status === "confirmed"
                    ? "success"
                    : b.status === "cancelled"
                      ? "danger"
                      : "warn"
                }
              >
                {b.status === "confirmed"
                  ? "تأیید"
                  : b.status === "cancelled"
                    ? "لغو"
                    : "در انتظار"}
              </AdminBadge>
            </td>
            <td className="px-4 py-3">
              {b.status !== "cancelled" ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600"
                  onClick={() => cancelBooking(b.id)}
                >
                  لغو
                </button>
              ) : (
                "—"
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
