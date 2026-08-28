"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import { DraftNumberInput } from "@/components/ui/DraftNumberInput";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import { fetchAdminOps, patchAdminOps } from "@/lib/operations/client";
import type { Booking } from "@/lib/storage";
import { cn, formatPrice } from "@/lib/utils";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Filter = "all" | "visit" | "treatment";

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reservationFee, setReservationFee] = useState(200000);
  const [error, setError] = useState("");
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    day: "",
    timeValue: "",
    timeLabel: "",
    doctorName: "",
    status: "confirmed",
  });

  const reload = useCallback(async (type: Filter = filter) => {
    const q = type === "all" ? "" : `?type=${type}`;
    const data = await fetchAdminOps<{ items: Booking[] }>(
      `/api/admin/operations/bookings${q}`,
    );
    setBookings(data.items);
  }, [filter]);

  useEffect(() => {
    void fetchAdmin<{ dentalReservationFee: number }>("/api/admin/content/settings")
      .then((data) => setReservationFee(data.dentalReservationFee))
      .catch(() => {});
    void reload("all").catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  async function cancelBooking(id: string) {
    if (
      !window.confirm(
        "آیا از لغو این رزرو مطمئن هستید؟\n\nبیعانه پرداخت‌شده قابل استرداد نیست.",
      )
    ) {
      return;
    }
    void patchAdminOps("/api/admin/operations/bookings", { id, status: "cancelled" })
      .then(() => reload(filter))
      .catch((e) => setError(e instanceof Error ? e.message : "لغو ناموفق"));
  }

  function openEdit(booking: Booking) {
    setEditBooking(booking);
    setEditForm({
      day: String(booking.day || ""),
      timeValue: String(booking.timeValue || ""),
      timeLabel: String(booking.timeLabel || ""),
      doctorName: String(booking.doctorName || ""),
      status: String(booking.status || "confirmed"),
    });
  }

  function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editBooking) return;
    void patchAdminOps("/api/admin/operations/bookings", {
      id: editBooking.id,
      day: editForm.day,
      timeValue: editForm.timeValue,
      timeLabel: editForm.timeLabel,
      doctorName: editForm.doctorName,
      status: editForm.status,
    })
      .then(() => {
        setEditBooking(null);
        return reload(filter);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "ویرایش ناموفق"));
  }

  function saveReservationFee() {
    void putAdmin<{ dentalReservationFee: number }>("/api/admin/content/settings", {
      dentalReservationFee: Number(reservationFee || 0),
    })
      .then((data) => setReservationFee(data.dentalReservationFee))
      .catch((e) => setError(e instanceof Error ? e.message : "ذخیره ناموفق"));
  }

  function resetReservationFee() {
    void putAdmin<{ dentalReservationFee: number }>("/api/admin/content/settings", {
      dentalReservationFee: 200000,
    })
      .then((data) => setReservationFee(data.dentalReservationFee))
      .catch((e) => setError(e instanceof Error ? e.message : "بازنشانی ناموفق"));
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Card hover={false} className="border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-7 text-cyan-950">
        این صفحه فقط <strong>رزرو نوبت</strong> است (ویزیت/درمان). تأیید اینجا یعنی نوبت تأیید شده.
        استعلام پوشش بیمه جداست →{" "}
        <a href="/admin/insurances" className="font-bold underline">
          /admin/insurances
        </a>
        .
      </Card>
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
            <DraftNumberInput
              min={0}
              max={10_000_000}
              value={reservationFee}
              onCommit={setReservationFee}
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
              void reload(item.id).catch((e) =>
                setError(e instanceof Error ? e.message : "خطا"),
              );
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
        headers={["کد", "مراجع", "موبایل", "پزشک", "نوع", "زمان", "بیعانه", "وضعیت", "عملیات"]}
        empty="رزروی ثبت نشده است."
      >
        {bookings.map((b) => (
          <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
            <td className="px-4 py-3 font-mono text-xs">{b.id}</td>
            <td className="px-4 py-3">{b.patientName}</td>
            <td className="px-4 py-3 font-mono text-xs">{b.patientPhone || "—"}</td>
            <td className="px-4 py-3">{b.doctorName}</td>
            <td className="px-4 py-3">{b.typeLabel}</td>
            <td className="px-4 py-3">
              {b.dateLabel ? (
                <>
                  {b.dateLabel}
                  <br />
                  <span className="text-xs text-slate-500">{b.timeLabel}</span>
                </>
              ) : (
                <>
                  {b.day} — {b.timeLabel}
                </>
              )}
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs font-semibold text-cyan-800"
                  onClick={() => openEdit(b)}
                >
                  ویرایش
                </button>
                {b.status !== "cancelled" ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600"
                    onClick={() => cancelBooking(String(b.id))}
                  >
                    لغو
                  </button>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      {editBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <Card hover={false} className="w-full max-w-lg space-y-4 p-5">
            <h3 className="font-extrabold text-slate-900">ویرایش رزرو — {editBooking.id}</h3>
            <form onSubmit={saveEdit} className="grid gap-3 sm:grid-cols-2">
              <div>
                <FormLabel>روز</FormLabel>
                <FormInput
                  value={editForm.day}
                  onChange={(e) => setEditForm((f) => ({ ...f, day: e.target.value }))}
                  placeholder="مثلاً sat"
                />
              </div>
              <div>
                <FormLabel>مقدار ساعت (timeValue)</FormLabel>
                <FormInput
                  value={editForm.timeValue}
                  onChange={(e) => setEditForm((f) => ({ ...f, timeValue: e.target.value }))}
                  placeholder="مثلاً 10"
                />
              </div>
              <div>
                <FormLabel>برچسب زمان</FormLabel>
                <FormInput
                  value={editForm.timeLabel}
                  onChange={(e) => setEditForm((f) => ({ ...f, timeLabel: e.target.value }))}
                  placeholder="مثلاً ۱۰:۰۰"
                />
              </div>
              <div>
                <FormLabel>نام پزشک</FormLabel>
                <FormInput
                  value={editForm.doctorName}
                  onChange={(e) => setEditForm((f) => ({ ...f, doctorName: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <FormLabel>وضعیت</FormLabel>
                <FormSelect
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="pending">در انتظار</option>
                  <option value="confirmed">تأیید</option>
                  <option value="cancelled">لغو</option>
                </FormSelect>
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit">ذخیره</Button>
                <Button type="button" variant="outline" onClick={() => setEditBooking(null)}>
                  انصراف
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
