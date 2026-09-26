"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Card";
import { DraftNumberInput } from "@/components/ui/DraftNumberInput";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import {
  filterReceptionItems,
  mapBookingToReception,
  mapConsultationToReception,
  receptionCategoryLabel,
  RECEPTION_CATEGORY_TABS,
  RECEPTION_TIME_TABS,
  uniqueDoctors,
  type ReceptionCategory,
  type ReceptionItem,
  type ReceptionTimeOfDay,
} from "@/lib/admin/reception-bookings";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import { fetchAdminOps, patchAdminOps } from "@/lib/operations/client";
import { confirmAction } from "@/lib/ui/confirm-action";
import { formatJalaliDate, normalizePatientPhone, type PatientProfile } from "@/lib/patient";
import type { Booking } from "@/lib/storage";
import { cn, formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

export default function AdminBookingsPage() {
  const [category, setCategory] = useState<ReceptionCategory>("all");
  const [timeOfDay, setTimeOfDay] = useState<ReceptionTimeOfDay>("all");
  const [doctor, setDoctor] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [items, setItems] = useState<ReceptionItem[]>([]);
  const [bookingById, setBookingById] = useState<Record<string, Booking>>({});
  const [fileNumberByPhone, setFileNumberByPhone] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [reservationFee, setReservationFee] = useState(200000);
  const [reservationNote, setReservationNote] = useState("");
  const [error, setError] = useState("");
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    day: "",
    timeValue: "",
    timeLabel: "",
    doctorName: "",
    status: "confirmed",
  });

  const reload = useCallback(async () => {
    const [bookingsRes, consultationsRes, patientsRes] = await Promise.all([
      fetchAdminOps<{ items: Booking[] }>("/api/admin/operations/bookings"),
      fetchAdminOps<{ items: Record<string, unknown>[] }>(
        "/api/admin/operations/consultations",
      ).catch(() => ({ items: [] as Record<string, unknown>[] })),
      // شماره پرونده روی خود رزرو ذخیره نمی‌شود؛ از پروفایل بیمار خوانده می‌شود.
      // ادمین بدون مجوز «بیماران» فقط ستون خالی می‌بیند.
      fetchAdminOps<{ items: PatientProfile[] }>(
        "/api/admin/operations/patients",
      ).catch(() => ({ items: [] as PatientProfile[] })),
    ]);

    const map: Record<string, Booking> = {};
    for (const b of bookingsRes.items) map[String(b.id)] = b;
    setBookingById(map);

    const fileNumbers: Record<string, string> = {};
    for (const p of patientsRes.items) {
      if (p.fileNumber) fileNumbers[normalizePatientPhone(p.phone)] = p.fileNumber;
    }
    setFileNumberByPhone(fileNumbers);

    const reception = [
      ...bookingsRes.items.map((b) => mapBookingToReception(b as unknown as Record<string, unknown>)),
      ...consultationsRes.items.map((c) => mapConsultationToReception(c)),
    ].sort((a, b) => String(b.id).localeCompare(String(a.id)));
    setItems(reception);
  }, []);

  useEffect(() => {
    void fetchAdmin<{ dentalReservationFee: number; dentalReservationNote?: string }>(
      "/api/admin/content/settings",
    )
      .then((data) => {
        setReservationFee(data.dentalReservationFee);
        setReservationNote(data.dentalReservationNote ?? "");
      })
      .catch(() => {});
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  const fileNumberFor = useCallback(
    (phone: string) => fileNumberByPhone[normalizePatientPhone(phone)] || "",
    [fileNumberByPhone],
  );

  const filtered = useMemo(() => {
    const base = filterReceptionItems(items, {
      category,
      timeOfDay,
      doctor,
      from: dateFrom,
      to: dateTo,
    });
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (row) =>
        row.patientPhone.includes(q) ||
        row.patientName.toLowerCase().includes(q) ||
        (row.dependentName || "").toLowerCase().includes(q) ||
        (row.dependentFileNumber || "").toLowerCase().includes(q) ||
        fileNumberFor(row.patientPhone).toLowerCase().includes(q) ||
        (row.staffNote || "").toLowerCase().includes(q),
    );
  }, [items, category, timeOfDay, doctor, dateFrom, dateTo, search, fileNumberFor]);

  const doctors = useMemo(() => uniqueDoctors(items), [items]);

  async function cancelBooking(id: string) {
    if (
      !window.confirm(
        "آیا از لغو این رزرو مطمئن هستید؟\n\nبیعانه پرداخت‌شده قابل استرداد نیست.",
      )
    ) {
      return;
    }
    void patchAdminOps("/api/admin/operations/bookings", { id, status: "cancelled" })
      .then(() => reload())
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
        return reload();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "ویرایش ناموفق"));
  }

  function saveReservationSettings() {
    void putAdmin<{ dentalReservationFee: number; dentalReservationNote?: string }>(
      "/api/admin/content/settings",
      {
        dentalReservationFee: Number(reservationFee || 0),
        dentalReservationNote: reservationNote.trim(),
      },
    )
      .then((data) => {
        setReservationFee(data.dentalReservationFee);
        setReservationNote(data.dentalReservationNote ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "ذخیره ناموفق"));
  }

  function resetReservationSettings() {
    if (!confirmAction("بیعانه و توضیحات رزرو به پیش‌فرض برگردد؟")) return;
    void putAdmin<{ dentalReservationFee: number; dentalReservationNote?: string }>(
      "/api/admin/content/settings",
      {
        dentalReservationFee: 200000,
        dentalReservationNote: "",
      },
    )
      .then((data) => {
        setReservationFee(data.dentalReservationFee);
        setReservationNote(data.dentalReservationNote ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "بازنشانی ناموفق"));
  }

  function markConsultationAnswered(id: string) {
    if (!confirmAction("این مشاوره به‌عنوان پاسخ‌داده‌شده ثبت شود؟")) return;
    void patchAdminOps("/api/admin/operations/consultations", { id, status: "answered" })
      .then(() => reload())
      .catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Card hover={false} className="border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-7 text-cyan-950">
        رزروها برای پذیرش به‌تفکیک خدمت، پزشک و ساعت روز فیلتر می‌شوند. دندانپزشکی و لیزر از
        جدول نوبت؛ پزشکی، پرستاری و مشاوره‌ها از درخواست‌های مرتبط خوانده می‌شوند. استعلام بیمه →{" "}
        <Link href="/admin/insurances" className="font-bold underline">
          /admin/insurances
        </Link>
        .
      </Card>
      <Card hover={false} className="p-5">
        <h2 className="mb-3 text-lg font-bold">تنظیمات بیعانه و توضیحات رزرو دندان</h2>
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
          <Button onClick={saveReservationSettings}>ذخیره</Button>
          <Button variant="outline" onClick={resetReservationSettings}>
            پیش‌فرض (۲۰۰,۰۰۰)
          </Button>
        </div>
        <p className="mt-3 text-xs text-amber-700">
          مقدار فعلی در جریان رزرو: {formatPrice(reservationFee)}
        </p>
        <div className="mt-4">
          <FormLabel>توضیحات برای بیمار (در فرم رزرو دندان)</FormLabel>
          <FormTextarea
            rows={4}
            value={reservationNote}
            onChange={(e) => setReservationNote(e.target.value)}
            placeholder="مثلاً قوانین لغو، ساعت مراجعه، یا یادآوری خاص کلینیک…"
          />
          <p className="mt-1 text-xs text-slate-500">
            این متن زیر توضیح ثابت بیعانه در مرحله «اطلاعات رزرو» و صفحه تأیید پرداخت نمایش داده
            می‌شود.
          </p>
        </div>
      </Card>

      <div>
        <p className="mb-2 text-xs font-bold text-slate-500">تفکیک خدمت</p>
        <div className="flex flex-wrap gap-2">
          {RECEPTION_CATEGORY_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-bold",
                category === item.id
                  ? "border-green-300 bg-green-100 text-green-800"
                  : "border-slate-300 bg-slate-100 text-slate-700",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <JalaliBirthDateField label="از تاریخ (شمسی)" value={dateFrom} onChange={setDateFrom} />
        <JalaliBirthDateField label="تا تاریخ (شمسی)" value={dateTo} onChange={setDateTo} />
        <div className="flex flex-col justify-end gap-2 sm:col-span-2">
          <p className="text-xs leading-6 text-slate-500">
            فیلتر روی تاریخ نوبت / ثبت است.
            {dateFrom || dateTo
              ? ` بازه: ${dateFrom ? formatJalaliDate(dateFrom) : "…"} تا ${dateTo ? formatJalaliDate(dateTo) : "…"}`
              : " بدون بازه = همه تاریخ‌ها."}
          </p>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              className="self-start text-xs font-bold text-teal-800 underline"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
            >
              پاک کردن بازه تاریخ
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-2 text-xs font-bold text-slate-500">زمان روز</p>
          <div className="flex flex-wrap gap-2">
            {RECEPTION_TIME_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTimeOfDay(item.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-bold",
                  timeOfDay === item.id
                    ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                    : "border-slate-300 bg-white text-slate-700",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-[14rem] flex-1">
          <FormLabel>جستجو (شماره پرونده / نام / موبایل)</FormLabel>
          <FormInput value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="min-w-[12rem]">
          <FormLabel>پزشک / منبع</FormLabel>
          <FormSelect value={doctor} onChange={(e) => setDoctor(e.target.value)}>
            <option value="all">همه پزشکان</option>
            {doctors.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </FormSelect>
        </div>
        <span className="pb-2 text-xs text-slate-500">
          {filtered.length.toLocaleString("fa-IR")} مورد
        </span>
      </div>

      <Card hover={false} className="border-teal-100 bg-teal-50/40 p-4">
        <p className="text-sm font-extrabold text-teal-900">توضیحات فعال برای بیمار (رزرو دندان)</p>
        <p className="mt-1 text-xs text-slate-600">
          همین متن در فرم رزرو و تأیید پرداخت نمایش داده می‌شود. ویرایش در کارت بالا.
        </p>
        {reservationNote.trim() ? (
          <p className="mt-3 whitespace-pre-wrap rounded-xl border border-teal-200 bg-white p-3 text-sm leading-7 text-slate-800">
            {reservationNote.trim()}
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">توضیح اضافه‌ای ثبت نشده — فقط متن ثابت بیعانه برای بیمار نمایش داده می‌شود.</p>
        )}
      </Card>

      <AdminTable
        headers={[
          "کد",
          "مراجع",
          "موبایل",
          "شماره پرونده",
          "بخش",
          "پزشک",
          "نوع",
          "تاریخ / نوبت",
          "مبلغ",
          "توضیحات",
          "وضعیت",
          "عملیات",
        ]}
        empty="موردی با این فیلتر نیست."
      >
        {filtered.map((row) => {
          const booking = row.source === "booking" ? bookingById[row.id] : null;
          return (
            <tr key={`${row.source}-${row.id}`} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="max-w-[7rem] break-all px-4 py-3 font-mono text-[0.65rem]">{row.id}</td>
              <td className="px-4 py-3">
                {row.dependentId || row.dependentName ? (
                  <span>
                    {row.dependentName || row.patientName}
                    <span className="mt-0.5 block text-[0.65rem] text-slate-500">
                      تحت تکفل · موبایل سرپرست
                    </span>
                  </span>
                ) : (
                  row.patientName
                )}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{row.patientPhone}</td>
              <td className="px-4 py-3 font-mono text-xs">
                {row.dependentFileNumber || fileNumberFor(row.patientPhone) || "—"}
              </td>
              <td className="px-4 py-3 text-xs font-bold text-slate-700">
                {receptionCategoryLabel(row.category)}
              </td>
              <td className="px-4 py-3">{row.doctorName}</td>
              <td className="px-4 py-3 text-xs">
                {row.typeLabel}
                {row.categoryLabel && row.source === "consultation" ? (
                  <span className="mt-0.5 block text-[0.65rem] text-slate-500">
                    {row.categoryLabel}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-xs">
                <p className="font-bold">{row.dateLabel}</p>
                <p className="text-slate-600">{row.timeOfDayLabel}</p>
                <span className="text-slate-500">{row.timeLabel}</span>
              </td>
              <td className="px-4 py-3">
                {row.amount.toLocaleString("fa-IR")}
                {row.isDeposit ? (
                  <>
                    <br />
                    <span className="text-xs text-amber-700">بیعانه</span>
                  </>
                ) : null}
              </td>
              <td className="max-w-[10rem] px-4 py-3 text-xs leading-5 text-slate-600">
                {row.source === "booking" && row.staffNote ? (
                  <span className="line-clamp-3 whitespace-pre-wrap" title={row.staffNote}>
                    {row.staffNote}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3">
                <AdminBadge
                  tone={
                    row.status === "confirmed" || row.status === "answered"
                      ? "success"
                      : row.status === "cancelled"
                        ? "danger"
                        : "warn"
                  }
                >
                  {row.status === "confirmed"
                    ? "تأیید"
                    : row.status === "answered"
                      ? "پاسخ‌داده‌شده"
                      : row.status === "cancelled"
                        ? row.depositNonRefundable
                          ? "لغو — بدون عودت"
                          : "لغو"
                        : "در انتظار"}
                </AdminBadge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {booking ? (
                    <>
                      <button
                        type="button"
                        className="text-xs font-semibold text-cyan-800"
                        onClick={() => openEdit(booking)}
                      >
                        ویرایش
                      </button>
                      {booking.status !== "cancelled" ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-red-600"
                          onClick={() => cancelBooking(String(booking.id))}
                        >
                          لغو
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {row.status !== "answered" ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-cyan-800"
                          onClick={() => markConsultationAnswered(row.id)}
                        >
                          علامت پاسخ
                        </button>
                      ) : null}
                      <Link
                        href="/admin/consultations"
                        className="text-xs font-semibold text-slate-600 underline"
                      >
                        مشاوره‌ها
                      </Link>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
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
