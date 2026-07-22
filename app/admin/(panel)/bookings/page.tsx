"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput } from "@/components/ui/Card";
import { PasteurStorage, type Booking } from "@/lib/storage";
import { cn, formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";

type Filter = "all" | "visit" | "treatment";

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reservationFee, setReservationFee] = useState(200000);

  function reload(type: Filter = filter) {
    let list = PasteurStorage.getBookings();
    if (type !== "all") list = list.filter((b) => b.type === type);
    setBookings(list);
  }

  useEffect(() => {
    PasteurStorage.initSettingsIfNeeded();
    setReservationFee(PasteurStorage.getDentalReservationFee());
    reload("all");
  }, []);

  function cancelBooking(id: string) {
    if (
      !window.confirm(
        "آیا از لغو این رزرو مطمئن هستید؟ بیعانه پرداخت‌شده قابل استرداد نیست.",
      )
    ) {
      return;
    }
    PasteurStorage.updateBooking(id, {
      status: "cancelled",
      depositNonRefundable: true,
    });
    reload(filter);
  }

  function saveReservationFee() {
    PasteurStorage.saveSettings({
      dentalReservationFee: Number(reservationFee || 0),
    });
    setReservationFee(PasteurStorage.getDentalReservationFee());
  }

  function resetReservationFee() {
    PasteurStorage.resetSettings();
    setReservationFee(PasteurStorage.getDentalReservationFee());
  }

  return (
    <div className="space-y-6">
      <Card hover={false} className="p-5">
        <h2 className="mb-3 text-lg font-bold">تنظیمات بیعانه رزرو دندان</h2>
        <p className="mb-4 text-sm text-slate-600">
          مبلغ ثابت بیعانه رزرو نوبت (غیرقابل استرداد هنگام لغو).
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              مبلغ بیعانه (تومان)
            </label>
            <FormInput
              type="number"
              min={0}
              value={reservationFee}
              onChange={(e) => setReservationFee(Number(e.target.value || 0))}
              className="max-w-[200px]"
            />
          </div>
          <Button onClick={saveReservationFee}>ذخیره</Button>
          <Button variant="outline" onClick={resetReservationFee}>
            پیش‌فرض (۲۰۰,۰۰۰)
          </Button>
        </div>
        <p className="mt-3 text-xs text-amber-700">
          مقدار فعلی در جریان رزرو: {formatPrice(reservationFee)}
        </p>
      </Card>

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
        headers={["کد", "مراجع", "پزشک", "نوع", "زمان", "بیعانه", "وضعیت", "عملیات"]}
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
            <td className="px-4 py-3">
              {(b.amount || 0).toLocaleString("fa-IR")}
              {b.isDeposit ? (
                <>
                  <br />
                  <span className="text-xs text-amber-700">بیعانه</span>
                </>
              ) : null}
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
                    ? b.depositNonRefundable
                      ? "لغو — بدون عودت"
                      : "لغو"
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
