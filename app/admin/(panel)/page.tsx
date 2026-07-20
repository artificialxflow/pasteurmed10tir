"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Card } from "@/components/ui/Card";
import { PasteurStorage, type Booking, type BookingStats } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Period = "day" | "week" | "month";

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("day");
  const [stats, setStats] = useState<BookingStats | null>(null);

  useEffect(() => {
    setStats(PasteurStorage.getBookingStats());
  }, [period]);

  if (!stats) {
    return <p className="text-slate-500">در حال بارگذاری...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "day", label: "امروز" },
            { id: "week", label: "هفته" },
            { id: "month", label: "ماه" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPeriod(item.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold",
              period === item.id
                ? "border-green-300 bg-green-100 text-green-800"
                : "border-slate-300 bg-slate-100 text-slate-700",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-teal-700">{stats.totalBookings}</p>
          <p className="text-sm text-slate-500">کل رزروها</p>
        </Card>
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-blue-700">{stats.todayVisitors}</p>
          <p className="text-sm text-slate-500">مراجعین امروز</p>
        </Card>
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-amber-700">
            {stats.revenue.toLocaleString("fa-IR")}
          </p>
          <p className="text-sm text-slate-500">درآمد (تومان)</p>
        </Card>
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-violet-700">{stats.activeMembers}</p>
          <p className="text-sm text-slate-500">عضویت فعال</p>
        </Card>
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-rose-700">
            {stats.commissionsTotal.toLocaleString("fa-IR")}
          </p>
          <p className="text-sm text-slate-500">پورسانت معرف‌ها</p>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">رزروهای اخیر</h2>
        <AdminTable
          headers={["مراجع", "پزشک", "نوع", "زمان", "وضعیت"]}
          empty="هنوز رزروی ثبت نشده است."
        >
          {stats.recentBookings.map((b: Booking) => (
            <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3">{b.patientName || "—"}</td>
              <td className="px-4 py-3">{b.doctorName || "—"}</td>
              <td className="px-4 py-3">{b.typeLabel || "—"}</td>
              <td className="px-4 py-3">
                {b.day || ""} {b.timeLabel || ""}
              </td>
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
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}
