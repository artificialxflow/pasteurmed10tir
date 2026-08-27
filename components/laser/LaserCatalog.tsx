"use client";

import { Button } from "@/components/ui/Button";
import { Card, EmptyState, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { PASTEUR_DATA, type LaserCategory, type LaserService } from "@/lib/data";
import { fetchPublic } from "@/lib/content/client";
import {
  buildLaserAvailableDates,
  buildLaserHourSlots,
  DEFAULT_LASER_RESERVATION_FEE,
  formatLaserTimeLabel,
} from "@/lib/operations/laser-slots";
import { checkBookingSlot } from "@/lib/operations/client";
import { fetchPatientOps } from "@/lib/operations/client";
import type { PendingLaserPayment } from "@/lib/payment";
import type { PatientProfile } from "@/lib/patient";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import { cn, formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const LASER_RESOURCE_ID = "laser";
const LASER_BOOKING_TYPE = "laser";

type LaserCatalogProps = {
  variant?: "site" | "app";
};

function parsePriceFromLabel(raw?: string): number {
  if (!raw) return 0;
  const digits = raw
    .replace(/[^\d۰-۹0-9]/g, "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

function serviceAmount(service: LaserService): number {
  if (service.priceNum && service.priceNum > 0) return service.priceNum;
  return parsePriceFromLabel(service.price);
}

function formatServicePrice(service: LaserService): string {
  const amount = serviceAmount(service);
  if (amount > 0) return formatPrice(amount);
  return service.price || "—";
}

export function LaserCatalog({ variant = "site" }: LaserCatalogProps) {
  const app = variant === "app";
  const router = useRouter();
  const phoneDigits = PASTEUR_DATA.institute.phoneDigits;
  const [categories, setCategories] = useState<LaserCategory[]>([]);
  const [services, setServices] = useState<LaserService[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [day, setDay] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [timeLabel, setTimeLabel] = useState("");
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [reservationFee, setReservationFee] = useState(DEFAULT_LASER_RESERVATION_FEE);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const dateOptions = useMemo(() => buildLaserAvailableDates(3), []);
  const hourSlots = useMemo(() => buildLaserHourSlots(), []);

  useEffect(() => {
    fetchPublic<{ categories?: LaserCategory[]; items: LaserService[] }>("/api/content/laser")
      .then((data) => {
        const cats = (data.categories || []).filter((c) => c.active !== false);
        const active = data.items.filter((s) => s.active !== false);
        setCategories(cats);
        setServices(active);
        if (cats.length) {
          setCategoryId(cats[0].id);
          const firstInCat = active.find((s) => s.categoryId === cats[0].id) || active[0];
          if (firstInCat) setSelectedId(firstInCat.id);
        } else if (active.length) {
          setSelectedId(active[0].id);
        }
      })
      .catch(() => {
        setCategories([]);
        setServices([]);
      })
      .finally(() => setLoaded(true));

    void fetchPublic<{ laserReservationFee?: number }>("/api/content/settings")
      .then((data) => {
        const fee = Number(data.laserReservationFee);
        if (Number.isFinite(fee) && fee > 0) setReservationFee(fee);
      })
      .catch(() => {});

    void fetchPatientOps<{ profile: PatientProfile | null }>("/api/auth/me")
      .then((res) => {
        if (!res.profile) return;
        setName((prev) => prev || res.profile!.name);
        setPhone((prev) => prev || res.profile!.phone);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!appointmentDate) {
      setOccupiedSlots([]);
      return;
    }
    const q = new URLSearchParams({
      doctorId: LASER_RESOURCE_ID,
      date: appointmentDate,
      type: LASER_BOOKING_TYPE,
    });
    void fetchPublic<{ timeValues: string[] }>(`/api/operations/bookings/occupied?${q}`)
      .then((data) => setOccupiedSlots(data.timeValues || []))
      .catch(() => setOccupiedSlots([]));
  }, [appointmentDate]);

  const filteredServices = useMemo(() => {
    if (!categoryId) return services;
    return services.filter((s) => s.categoryId === categoryId);
  }, [services, categoryId]);

  const selected = useMemo(
    () => services.find((s) => s.id === selectedId) || null,
    [services, selectedId],
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) || null,
    [categories, categoryId],
  );

  const tariffAmount = selected ? serviceAmount(selected) : 0;

  function selectCategory(id: string) {
    setCategoryId(id);
    setError("");
    const next = services.find((s) => s.categoryId === id);
    setSelectedId(next?.id || "");
    setAppointmentDate("");
    setDay("");
    setTimeValue("");
    setTimeLabel("");
  }

  function selectService(id: string) {
    setSelectedId(id);
    setError("");
    setTimeValue("");
    setTimeLabel("");
  }

  function selectDate(iso: string, weekday: string) {
    setAppointmentDate(iso);
    setDay(weekday);
    setTimeValue("");
    setTimeLabel("");
    setError("");
  }

  function selectHour(value: string, label: string) {
    setTimeValue(value);
    setTimeLabel(label);
    setError("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!selected) {
      setError("خدمت لیزر را انتخاب کنید.");
      return;
    }
    if (!appointmentDate || !day || !timeValue) {
      setError("تاریخ و ساعت نوبت را انتخاب کنید.");
      return;
    }
    if (reservationFee < 100) {
      setError("بیعانه رزرو تنظیم نشده است.");
      return;
    }
    const patientName = name.trim();
    const patientPhone = phone.trim();
    if (!patientName || !patientPhone) {
      setError("نام و موبایل الزامی است.");
      return;
    }

    setChecking(true);
    void checkBookingSlot({
      doctorId: LASER_RESOURCE_ID,
      appointmentDate,
      type: LASER_BOOKING_TYPE,
      timeValue,
    })
      .then((taken) => {
        if (taken) {
          setError("این زمان دیگر در دسترس نیست. ساعت دیگری انتخاب کنید.");
          return;
        }

        const dateLabel = dateOptions.find((d) => d.isoDate === appointmentDate)?.label
          || appointmentDate;
        const pending: PendingLaserPayment = {
          kind: "laser",
          serviceId: selected.id,
          serviceTitle: selected.title,
          categoryId: selected.categoryId || categoryId || undefined,
          categoryName:
            selected.categoryName || selectedCategory?.name || undefined,
          patientName,
          patientPhone,
          description: description.trim(),
          day,
          appointmentDate,
          appointmentDateLabel: dateLabel,
          timeValue,
          timeLabel: timeLabel || formatLaserTimeLabel(timeValue),
          amount: reservationFee,
          amountToman: reservationFee,
          tariffAmount,
          estimate: formatServicePrice(selected),
          isDeposit: true,
          depositNonRefundable: true,
          paymentLabel: "بیعانه رزرو نوبت لیزر",
          returnTo: app ? ROUTES.app.laser : ROUTES.web.laser,
          successTo: app ? ROUTES.app.laserSuccess : ROUTES.web.laserSuccess,
        };

        PasteurStorage.initPatientDomainIfNeeded();
        PasteurStorage.setPendingPayment(pending);
        router.push(app ? ROUTES.app.laserConfirm : ROUTES.web.laserConfirm);
      })
      .catch(() => setError("بررسی زمان رزرو ناموفق بود. دوباره تلاش کنید."))
      .finally(() => setChecking(false));
  }

  if (loaded && services.length === 0) {
    return (
      <EmptyState
        title="هنوز خدمت لیزری ثبت نشده"
        desc="از پنل ادمین → خدمات لیزر دسته و خدمت اضافه کنید."
      />
    );
  }

  return (
    <>
      <p className={cn("mb-4 text-sm text-slate-600", app && "text-xs")}>
        دسته و خدمت را انتخاب کنید، وقت ۱۰ صبح تا ۷ عصر بگیرید و بیعانه{" "}
        {formatPrice(reservationFee)} بپردازید (مثل دندانپزشکی).
      </p>

      {categories.length > 0 ? (
        <div className={cn("mb-4 flex flex-wrap gap-2", app && "mb-3")}>
          {categories.map((cat) => {
            const active = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-bold transition",
                  active
                    ? "border-purple-500 bg-purple-50 text-purple-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-purple-300",
                )}
              >
                <span className="ml-1">{cat.emoji}</span>
                {cat.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className={cn(app ? "space-y-3" : "grid grid-cols-1 gap-5 sm:grid-cols-2")}>
        {filteredServices.map((service) => {
          const amount = serviceAmount(service);
          const active = selectedId === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => selectService(service.id)}
              className={cn(
                "rounded-2xl border p-4 text-right transition",
                app ? "p-4" : "p-6",
                active
                  ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                  : "border-slate-200 bg-white hover:border-purple-400",
              )}
            >
              <span className={cn("text-3xl", app && "text-2xl")}>{service.emoji}</span>
              <h2 className={cn("mt-3 text-lg font-bold text-slate-900", app && "mt-2 text-sm")}>
                {service.title}
              </h2>
              {service.description ? (
                <p className={cn("mt-2 text-sm text-slate-600", app && "mt-1 text-xs leading-6")}>
                  {service.description}
                </p>
              ) : null}
              <p className={cn("mt-2 font-extrabold text-purple-700", app && "mt-1 text-sm")}>
                {amount > 0 ? `تعرفه: ${formatPrice(amount)}` : service.price || "تعرفه نامشخص"}
              </p>
              {active ? (
                <p className="mt-2 text-[0.7rem] font-bold text-purple-800">انتخاب‌شده ✓</p>
              ) : null}
            </button>
          );
        })}
      </div>

      {selected ? (
        <form onSubmit={onSubmit} className={cn("mt-6 space-y-4", app && "mt-4")}>
          <div>
            <FormLabel>تاریخ نوبت</FormLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {dateOptions.map((opt) => {
                const active = appointmentDate === opt.isoDate;
                return (
                  <button
                    key={opt.isoDate}
                    type="button"
                    onClick={() => selectDate(opt.isoDate, opt.weekday)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-bold transition",
                      active
                        ? "border-purple-500 bg-purple-50 text-purple-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-purple-300",
                    )}
                  >
                    <span className="block">{opt.weekday}</span>
                    <span className="mt-0.5 block text-[0.7rem] font-medium text-slate-500">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {appointmentDate ? (
            <div>
              <FormLabel>ساعت (۱۰ صبح تا ۷ عصر — هر یک ساعت)</FormLabel>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {hourSlots.map((slot) => {
                  const taken = occupiedSlots.includes(slot.value);
                  const active = timeValue === slot.value;
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      disabled={taken}
                      onClick={() => selectHour(slot.value, slot.label)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-xs font-bold transition",
                        taken && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 line-through",
                        !taken &&
                          active &&
                          "border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-200",
                        !taken &&
                          !active &&
                          "border-slate-200 bg-white text-slate-700 hover:border-purple-300",
                      )}
                    >
                      {slot.label}
                      {taken ? " (پر)" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <Card hover={false} className="border-purple-200 bg-purple-50 p-4">
            <p className="text-xs text-slate-500">بیعانه قابل پرداخت</p>
            <p className="mt-1 text-lg font-extrabold text-purple-800">
              {formatPrice(reservationFee)}
            </p>
            <p className="mt-1 text-xs text-slate-600">{selected.title}</p>
            {tariffAmount > 0 ? (
              <p className="mt-1 text-[0.7rem] text-slate-500">
                تعرفه خدمت: {formatPrice(tariffAmount)} (باقی‌مانده در کلینیک)
              </p>
            ) : null}
            {appointmentDate && timeLabel ? (
              <p className="mt-2 text-xs font-bold text-purple-900">
                {dateOptions.find((d) => d.isoDate === appointmentDate)?.label || appointmentDate}
                {" — "}
                {timeLabel}
              </p>
            ) : null}
          </Card>

          <div className={cn("grid gap-4", app ? "grid-cols-1" : "sm:grid-cols-2")}>
            <div>
              <FormLabel>نام و نام خانوادگی</FormLabel>
              <FormInput required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <FormLabel>موبایل</FormLabel>
              <FormInput
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div>
            <FormLabel>توضیحات (اختیاری)</FormLabel>
            <FormTextarea
              placeholder="ناحیه مورد نظر..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[90px]"
            />
          </div>
          {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
          <Button
            type="submit"
            variant="accent"
            className="w-full"
            disabled={checking || !timeValue || reservationFee < 100}
          >
            {checking
              ? "در حال بررسی زمان..."
              : `ادامه به پرداخت بیعانه (${formatPrice(reservationFee)})`}
          </Button>
          <a
            href={`tel:${phoneDigits}`}
            className="block text-center text-sm font-bold text-slate-600 hover:text-purple-700"
          >
            یا تماس: {PASTEUR_DATA.institute.phone}
          </a>
        </form>
      ) : null}
    </>
  );
}
