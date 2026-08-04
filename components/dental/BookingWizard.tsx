"use client";

import { Button } from "@/components/ui/Button";
import { Badge, Card, FormInput, FormLabel } from "@/components/ui/Card";
import { PASTEUR_DATA, type Dentist } from "@/lib/data";
import { fetchPublic } from "@/lib/content/client";
import { PasteurStorage } from "@/lib/storage";
import { cn, formatHour, normalizePhone } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { DentalBasePath } from "./types";
import { isAppDental } from "./types";

const DENTISTS = PASTEUR_DATA.dentists as unknown as Dentist[];

type StepName = "type" | "doctor" | "day" | "time" | "info";
type BookingType = "visit" | "treatment" | null;

type BookingState = {
  type: BookingType;
  doctorId: number | null;
  day: string | null;
  timeValue: number | null;
  timeLabel: string | null;
  patientName: string;
  patientPhone: string;
  referralCode: string;
  onlineInsuranceCovered: boolean;
};

const STEP_LABELS: Record<StepName, string> = {
  type: "نوع خدمت",
  doctor: "انتخاب پزشک",
  day: "روز حضور",
  time: "انتخاب زمان",
  info: "اطلاعات مراجع",
};

const INITIAL_STATE: BookingState = {
  type: null,
  doctorId: null,
  day: null,
  timeValue: null,
  timeLabel: null,
  patientName: "",
  patientPhone: "",
  referralCode: "",
  onlineInsuranceCovered: false,
};

function getDoctor(id: number | null): Dentist | undefined {
  if (id == null) return undefined;
  return DENTISTS.find((d) => d.id === id);
}

/** Slot check against API occupied times (+ local draft fallback). */
function isSlotTaken(
  doctorId: number | string,
  day: string,
  type: string,
  timeValue: number | string,
  occupied: string[],
): boolean {
  if (occupied.includes(String(timeValue))) return true;
  return PasteurStorage.getBookings().some(
    (b) =>
      b.status !== "cancelled" &&
      String(b.doctorId) === String(doctorId) &&
      b.day === day &&
      b.type === type &&
      Number(b.timeValue) === Number(timeValue),
  );
}

export function BookingWizard({ basePath }: { basePath: DentalBasePath }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const app = isAppDental(basePath);
  const doctorFromQuery = searchParams.get("doctor");

  const steps = useMemo<StepName[]>(() => {
    if (doctorFromQuery) return ["type", "day", "time", "info"];
    return ["type", "doctor", "day", "time", "info"];
  }, [doctorFromQuery]);

  const [state, setState] = useState<BookingState>(() => {
    const doctorId = doctorFromQuery ? parseInt(doctorFromQuery, 10) : null;
    return {
      ...INITIAL_STATE,
      doctorId: Number.isFinite(doctorId) ? doctorId : null,
    };
  });
  const [currentStep, setCurrentStep] = useState<StepName>("type");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [reservationFee, setReservationFee] = useState(200000);

  useEffect(() => {
    void fetchPublic<{ dentalReservationFee: number }>("/api/content/settings")
      .then((data) => setReservationFee(data.dentalReservationFee))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!state.doctorId || !state.day || !state.type) {
      setOccupiedSlots([]);
      return;
    }
    const q = new URLSearchParams({
      doctorId: String(state.doctorId),
      day: state.day,
      type: state.type,
    });
    void fetchPublic<{ timeValues: string[] }>(`/api/operations/bookings/occupied?${q}`)
      .then((data) => setOccupiedSlots(data.timeValues))
      .catch(() => setOccupiedSlots([]));
  }, [state.doctorId, state.day, state.type]);

  useEffect(() => {
    const saved = PasteurStorage.getPendingBooking() as
      | { step?: StepName; data?: Partial<BookingState> }
      | null;
    if (saved?.data) {
      const draft = saved.data;
      setState((prev) => ({
        ...prev,
        ...draft,
        doctorId:
          doctorFromQuery && Number.isFinite(parseInt(doctorFromQuery, 10))
            ? parseInt(doctorFromQuery, 10)
            : (draft.doctorId ?? prev.doctorId),
      }));
      if (saved.step && steps.includes(saved.step)) {
        setCurrentStep(saved.step);
      }
    }
    setHydrated(true);
  }, [doctorFromQuery, steps]);

  const doctor = getDoctor(state.doctorId);
  const stepIndex = steps.indexOf(currentStep);

  const saveDraft = useCallback(
    (stepName: StepName, nextState: BookingState) => {
      PasteurStorage.setPendingBooking({ step: stepName, data: { ...nextState } });
    },
    [],
  );

  const showStep = useCallback(
    (stepName: StepName, nextState = state) => {
      setCurrentStep(stepName);
      setError("");
      saveDraft(stepName, nextState);
    },
    [saveDraft, state],
  );

  const updateState = useCallback((patch: Partial<BookingState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const showError = (msg: string) => setError(msg);

  const next = () => {
    if (currentStep === "type" && !state.type) {
      showError("لطفاً نوع خدمت را انتخاب کنید.");
      return;
    }
    if (currentStep === "doctor" && !state.doctorId) {
      showError("لطفاً پزشک را انتخاب کنید.");
      return;
    }
    if (currentStep === "day" && !state.day) {
      showError("لطفاً روز حضور را انتخاب کنید.");
      return;
    }
    if (currentStep === "time" && state.timeValue == null) {
      showError("لطفاً زمان را انتخاب کنید.");
      return;
    }
    if (stepIndex < steps.length - 1) {
      showStep(steps[stepIndex + 1]);
    }
  };

  const back = () => {
    if (stepIndex > 0) showStep(steps[stepIndex - 1]);
    else router.push(`${basePath}/general`);
  };

  const submitBooking = (e?: FormEvent) => {
    e?.preventDefault();
    const patientName = state.patientName.trim();
    if (!patientName || patientName.length < 2) {
      showError("نام و نام خانوادگی را وارد کنید.");
      return;
    }
    const phoneDigits = normalizePhone(state.patientPhone);
    if (phoneDigits.length < 10) {
      showError("شماره موبایل معتبر وارد کنید.");
      return;
    }
    if (!doctor || !state.type) {
      showError("اطلاعات رزرو ناقص است.");
      return;
    }

    const amount = reservationFee;
    PasteurStorage.setPendingPayment({
      kind: "booking",
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      type: state.type,
      typeLabel: state.type === "visit" ? "ویزیت" : "شروع یا ادامه درمان",
      day: state.day,
      timeValue: state.timeValue,
      timeLabel: state.timeLabel,
      patientName,
      patientPhone: state.patientPhone.trim(),
      amount,
      visitFee: 350000,
      isDeposit: true,
      paymentLabel: "بیعانه رزرو نوبت",
      referralCode: state.referralCode,
      onlineInsuranceCovered: state.onlineInsuranceCovered,
    });
    PasteurStorage.clearPendingBooking();
    router.push(`${basePath}/confirm`);
  };

  if (!hydrated) {
    return (
      <div className={cn(app ? "" : "mx-auto max-w-2xl px-4 py-10 sm:px-6")}>
        <p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className={cn(app ? "space-y-4" : "mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10")}>
      {!app ? (
        <>
          <nav className="mb-4 text-sm text-slate-500">
            <button
              type="button"
              onClick={() => router.push(`${basePath}/general`)}
              className="hover:text-teal-700"
            >
              دندانپزشکان
            </button>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-900">رزرو نوبت</span>
          </nav>
          <h1 className="mb-1 text-2xl font-bold text-slate-900">رزرو نوبت دندانپزشکی</h1>
          <p className="mb-6 text-slate-600">انتخاب نوع خدمت: ویزیت یا شروع درمان؟</p>
        </>
      ) : (
        <p className="text-sm text-slate-600">انتخاب نوع خدمت: ویزیت یا شروع درمان؟</p>
      )}

      {doctor ? (
        <div
          className={cn(
            "mb-4 flex items-center gap-3 rounded-2xl border p-3",
            app ? "border-sky-200 bg-white" : "mb-6 border-teal-200 bg-teal-50",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={doctor.image}
            alt=""
            className="h-12 w-12 rounded-lg object-cover"
          />
          <div>
            <p className="font-bold text-slate-900">{doctor.name}</p>
            <p className="text-sm text-teal-700">{doctor.specialty}</p>
          </div>
        </div>
      ) : null}

      <BookingProgress steps={steps} activeIndex={stepIndex} app={app} />

      {error ? (
        <div className="mb-4 rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {currentStep === "type" ? (
        <div className={cn("grid gap-4", app ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
          <TypeOption
            selected={state.type === "visit"}
            onClick={() => updateState({ type: "visit", timeValue: null, timeLabel: null })}
            emoji="🦷"
            title="ویزیت"
            desc="انتخاب ساعت کلی — ویزیت هر زمان قابل انتخاب است"
            accent="teal"
            app={app}
          />
          <TypeOption
            selected={state.type === "treatment"}
            onClick={() => updateState({ type: "treatment", timeValue: null, timeLabel: null })}
            emoji="🪥"
            title="شروع یا ادامه درمان"
            desc="بازه‌های یک‌ساعته — هر خدمت دقیقاً یک ساعت"
            accent="blue"
            app={app}
          />
        </div>
      ) : null}

      {currentStep === "doctor" ? (
        <div className="space-y-3">
          <p className="mb-1 text-sm text-slate-600">دندانپزشک مورد نظر را انتخاب کنید:</p>
          {DENTISTS.map((d) => {
            const selected = state.doctorId === d.id;
            const inactive = d.status === "inactive";
            return (
              <button
                key={d.id}
                type="button"
                disabled={inactive}
                onClick={() =>
                  updateState({
                    doctorId: d.id,
                    day: null,
                    timeValue: null,
                    timeLabel: null,
                  })
                }
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-4 text-right transition",
                  selected
                    ? "border-teal-500 bg-teal-50 ring-2 ring-teal-200"
                    : "border-sky-200 bg-white hover:border-teal-400",
                  inactive && "cursor-not-allowed opacity-50",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.image}
                  alt=""
                  className="h-14 w-14 rounded-lg border-2 border-slate-200 object-cover"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{d.name}</span>
                    <Badge status={d.status} />
                  </div>
                  <p className="text-sm text-teal-700">{d.specialty}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {currentStep === "day" ? (
        <div>
          <p className="mb-4 text-sm text-slate-600">روز حضور پزشک را انتخاب کنید:</p>
          <div className="flex flex-wrap gap-3">
            {!doctor || !Object.keys(doctor.schedule || {}).length ? (
              <p className="w-full py-6 text-center text-slate-500">
                روزی برای این پزشک ثبت نشده است.
              </p>
            ) : (
              Object.keys(doctor.schedule).map((day) => {
                const selected = state.day === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      updateState({ day, timeValue: null, timeLabel: null })
                    }
                    className={cn(
                      "min-w-[100px] rounded-2xl border px-5 py-4 text-center font-semibold transition",
                      selected
                        ? "border-teal-500 bg-teal-50 ring-2 ring-teal-200"
                        : "border-sky-200 bg-white hover:border-teal-400",
                    )}
                  >
                    📅 {day}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {currentStep === "time" ? (
        <TimeStep
          doctor={doctor}
          state={state}
          occupiedSlots={occupiedSlots}
          onSelect={(timeValue, timeLabel) => updateState({ timeValue, timeLabel })}
        />
      ) : null}

      {currentStep === "info" ? (
        <div>
          {doctor ? (
            <Card className="mb-6 space-y-2 bg-slate-50 p-4 text-sm" hover={false}>
              <div className="flex justify-between">
                <span className="text-slate-500">پزشک:</span>
                <span className="font-semibold">{doctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">نوع:</span>
                <span className="font-semibold">
                  {state.type === "visit" ? "ویزیت" : "شروع یا ادامه درمان"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">روز:</span>
                <span className="font-semibold">{state.day || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">زمان:</span>
                <span className="font-semibold">{state.timeLabel || "—"}</span>
              </div>
            </Card>
          ) : null}
          <form className="space-y-4" onSubmit={submitBooking}>
            <div>
              <FormLabel>نام و نام خانوادگی</FormLabel>
              <FormInput
                value={state.patientName}
                onChange={(e) => updateState({ patientName: e.target.value.trimStart() })}
                placeholder="مثال: علی احمدی"
                required
              />
            </div>
            <div>
              <FormLabel>شماره موبایل</FormLabel>
              <FormInput
                type="tel"
                value={state.patientPhone}
                onChange={(e) => updateState({ patientPhone: e.target.value.trim() })}
                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                required
              />
            </div>
            <div>
              <FormLabel>کد معرف ویزیتور (اختیاری)</FormLabel>
              <FormInput
                value={state.referralCode}
                onChange={(e) =>
                  updateState({ referralCode: e.target.value.trim().toUpperCase() })
                }
                placeholder="مثلاً PLUS100"
              />
              <p className="mt-1 text-xs text-slate-500">
                اگر اپلیکیشن را از طریق ویزیتور شناختید، کد معرف را وارد کنید.
              </p>
            </div>
            {state.type === "visit" ? (
              <label className="flex items-start gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-cyan-800"
                  checked={state.onlineInsuranceCovered}
                  onChange={(e) =>
                    updateState({ onlineInsuranceCovered: e.target.checked })
                  }
                />
                <span>
                  ویزیت آنلاین با پوشش بیمه تکمیلی
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    بیمه تکمیلی را در پنل کاربری ثبت کنید؛ استعلام در مرحله پرداخت انجام می‌شود.
                  </span>
                </span>
              </label>
            ) : null}
          </form>
        </div>
      ) : null}

      <div className="mt-8 flex gap-3">
        <Button variant="outline" onClick={back} className="rounded-lg px-5 py-2.5">
          قبلی
        </Button>
        {currentStep === "info" ? (
          <Button onClick={() => submitBooking()} className="flex-1">
            ادامه و تأیید نهایی
          </Button>
        ) : (
          <Button onClick={next} className="flex-1">
            مرحله بعد
          </Button>
        )}
      </div>
    </div>
  );
}

function BookingProgress({
  steps,
  activeIndex,
  app,
}: {
  steps: StepName[];
  activeIndex: number;
  app: boolean;
}) {
  if (app) {
    return (
      <div className="mb-4 flex items-start gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s} className="flex min-w-0 flex-1 items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                  i < activeIndex
                    ? "border-teal-500 bg-teal-500 text-white"
                    : i === activeIndex
                      ? "border-teal-500 bg-teal-500 text-white"
                      : "border-slate-300 bg-white text-slate-500",
                )}
              >
                {i < activeIndex ? "✓" : i + 1}
              </div>
              <span className="whitespace-nowrap text-[0.6rem] text-slate-600">
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <div
                className={cn(
                  "mt-3 h-0.5 flex-1",
                  i < activeIndex ? "bg-teal-500" : "bg-slate-200",
                )}
              />
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8 flex items-center overflow-x-auto pb-2">
      {steps.map((s, i) => (
        <div
          key={s}
          className={cn("flex items-center gap-2", i < steps.length - 1 && "flex-1")}
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold",
              i <= activeIndex
                ? "border-teal-500 bg-teal-500 text-white"
                : "border-teal-500 bg-white text-teal-700",
            )}
          >
            {i < activeIndex ? "✓" : i + 1}
          </div>
          <span className="hidden text-xs font-medium text-slate-600 sm:inline sm:text-sm">
            {STEP_LABELS[s]}
          </span>
          {i < steps.length - 1 ? (
            <div
              className={cn(
                "mx-1 h-0.5 flex-1",
                i < activeIndex ? "bg-teal-500" : "bg-slate-200",
              )}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function TypeOption({
  selected,
  onClick,
  emoji,
  title,
  desc,
  accent,
  app,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  desc: string;
  accent: "teal" | "blue";
  app: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-6 text-center transition-all",
        selected
          ? accent === "teal"
            ? "border-teal-500 bg-teal-50 ring-2 ring-teal-200"
            : "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
          : "border-sky-200 bg-white hover:border-teal-500",
        app && "p-4",
      )}
    >
      <span className={cn("mb-3 block", app ? "text-3xl" : "text-4xl")}>{emoji}</span>
      <h3 className={cn("font-bold", app ? "text-base" : "text-lg")}>{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </button>
  );
}

function TimeStep({
  doctor,
  state,
  occupiedSlots,
  onSelect,
}: {
  doctor: Dentist | undefined;
  state: BookingState;
  occupiedSlots: string[];
  onSelect: (timeValue: number, timeLabel: string) => void;
}) {
  if (!doctor || !state.day || !state.type) return null;
  const daySchedule = doctor.schedule[state.day];
  if (!daySchedule) {
    return (
      <p className="col-span-full py-6 text-center text-slate-500">
        برنامه‌ای برای این روز وجود ندارد.
      </p>
    );
  }

  const isVisit = state.type === "visit";

  return (
    <div>
      <p className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">
        {isVisit
          ? "ویزیت: یک ساعت کلی انتخاب کنید (مثلاً ساعت ۱۴)"
          : "درمان: یک بازه یک‌ساعته انتخاب کنید (مثلاً ۱۴ تا ۱۵)"}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {isVisit
          ? (daySchedule.visitHours || []).map((h) => {
              const booked = isSlotTaken(doctor.id, state.day!, "visit", h, occupiedSlots);
              const selected = state.timeValue === h;
              return (
                <button
                  key={h}
                  type="button"
                  disabled={booked}
                  onClick={() => onSelect(h, formatHour(h))}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-center font-semibold transition",
                    booked && "cursor-not-allowed opacity-40",
                    selected
                      ? "border-teal-500 bg-teal-50 ring-2 ring-teal-200"
                      : "border-sky-200 bg-white",
                  )}
                >
                  {formatHour(h)}
                  {booked ? <span className="mt-1 block text-xs text-red-600">پر</span> : null}
                </button>
              );
            })
          : (daySchedule.treatmentSlots || []).map((slot) => {
              const booked =
                slot.booked || isSlotTaken(doctor.id, state.day!, "treatment", slot.start, occupiedSlots);
              const selected = state.timeValue === slot.start;
              return (
                <button
                  key={slot.start}
                  type="button"
                  disabled={booked}
                  onClick={() => onSelect(slot.start, slot.label)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-center font-semibold transition",
                    booked && "cursor-not-allowed opacity-40",
                    selected
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-sky-200 bg-white",
                  )}
                >
                  {slot.label}
                  {booked ? (
                    <span className="mt-1 block text-xs text-red-600">رزرو شده</span>
                  ) : null}
                </button>
              );
            })}
      </div>
    </div>
  );
}
