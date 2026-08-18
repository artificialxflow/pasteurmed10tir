"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Card } from "@/components/ui/Card";
import { fetchAdminOps } from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage, type Booking, type BookingStats } from "@/lib/storage";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

type Period = "day" | "week" | "month";

type QueueCounts = {
  pendingPatients: number;
  pendingInsuranceInquiries: number;
  pendingFacilities: number;
  newComplaints: number;
  paidMembers: number;
  pendingCommissions: number;
};

function computeBookingStats(bookings: Booking[]): BookingStats {
  const today = new Date().toLocaleDateString("fa-IR");
  const isoToday = new Date().toISOString().slice(0, 10);
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const todayBookings = confirmed.filter(
    (b) => b.dateLabel === today || b.createdAt?.startsWith(isoToday),
  );
  const revenue = confirmed.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const members = PasteurStorage.getMembers().filter((m) => m.status === "paid");
  const commissions = PasteurStorage.getCommissions();

  return {
    totalBookings: confirmed.length,
    todayVisitors: todayBookings.length,
    revenue,
    activeMembers: members.length,
    commissionsTotal: commissions.reduce(
      (sum, c) => sum + (Number(c.commissionAmount) || 0),
      0,
    ),
    recentBookings: bookings.slice(0, 8),
  };
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("day");
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [queue, setQueue] = useState<QueueCounts>({
    pendingPatients: 0,
    pendingInsuranceInquiries: 0,
    pendingFacilities: 0,
    newComplaints: 0,
    paidMembers: 0,
    pendingCommissions: 0,
  });

  useEffect(() => {
    void (async () => {
      PasteurStorage.initPatientDomainIfNeeded();

      const facilities = PasteurStorage.getFacilityRequests();
      const commissions = PasteurStorage.getCommissions();

      try {
        const [bookingsRes, patientsRes, complaintsRes, insuranceRes] = await Promise.all([
          fetchAdminOps<{ items: Booking[] }>("/api/admin/operations/bookings"),
          fetchAdminOps<{ items: { status?: string }[] }>(
            "/api/admin/operations/patients",
          ),
          fetchAdminOps<{ items: { status?: string }[] }>(
            "/api/admin/operations/complaints",
          ),
          fetchAdminOps<{ items: { status?: string }[] }>(
            "/api/admin/operations/insurance-inquiries",
          ),
        ]);

        setStats(computeBookingStats(bookingsRes.items));
        setQueue({
          pendingPatients: patientsRes.items.filter(
            (p) => p.status !== "approved" && p.status !== "rejected",
          ).length,
          pendingInsuranceInquiries: insuranceRes.items.filter(
            (i) => i.status === "pending" || !i.status,
          ).length,
          pendingFacilities: facilities.filter((f) => !f.status || f.status === "pending")
            .length,
          newComplaints: complaintsRes.items.filter(
            (c) => c.status === "new" || !c.status,
          ).length,
          paidMembers: PasteurStorage.getMembers().filter((m) => m.status === "paid")
            .length,
          pendingCommissions: commissions.filter((c) => c.status !== "paid").length,
        });
      } catch {
        setStats(PasteurStorage.getBookingStats());
        const patients = PasteurStorage.listPatientProfiles();
        const complaints = PasteurStorage.getComplaints();
        setQueue({
          pendingPatients: patients.filter(
            (p) => p.status !== "approved" && p.status !== "rejected",
          ).length,
          pendingInsuranceInquiries: 0,
          pendingFacilities: facilities.filter((f) => !f.status || f.status === "pending")
            .length,
          newComplaints: complaints.filter((c) => c.status === "new" || !c.status).length,
          paidMembers: PasteurStorage.getMembers().filter((m) => m.status === "paid").length,
          pendingCommissions: commissions.filter((c) => c.status !== "paid").length,
        });
      }
    })();
  }, [period]);

  if (!stats) {
    return <p className="text-slate-500">در حال بارگذاری...</p>;
  }

  const shortcuts = [
    {
      href: ROUTES.admin.patients,
      label: "بیماران — تأیید کاربری / فرانشیز",
      count: queue.pendingPatients,
      tone: "text-amber-700",
    },
    {
      href: ROUTES.admin.insurances,
      label: "استعلام‌های بیمه (پرداخت)",
      count: queue.pendingInsuranceInquiries,
      tone: "text-orange-700",
    },
    {
      href: ROUTES.admin.access,
      label: "کارکنان پنل (سطح دسترسی)",
      count: null as number | null,
      tone: "text-indigo-700",
    },
    {
      href: ROUTES.admin.facilities,
      label: "تسهیلات / وام در بررسی",
      count: queue.pendingFacilities,
      tone: "text-rose-700",
    },
    {
      href: ROUTES.admin.memberships,
      label: "عضویت‌های پرداخت‌شده",
      count: queue.paidMembers,
      tone: "text-violet-700",
    },
    {
      href: ROUTES.admin.complaints,
      label: "شکایات جدید",
      count: queue.newComplaints,
      tone: "text-cyan-800",
    },
    {
      href: ROUTES.admin.commissions,
      label: "پورسانت در انتظار",
      count: queue.pendingCommissions,
      tone: "text-teal-700",
    },
  ];

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

      <div>
        <h2 className="mb-3 text-lg font-bold">صف‌های نیازمند توجه</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {shortcuts.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card hover className="p-4 transition hover:border-teal-200">
                <p className={`text-2xl font-bold ${item.tone}`}>
                  {item.count == null ? "→" : item.count}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-600">{item.label}</p>
              </Card>
            </Link>
          ))}
        </div>
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
