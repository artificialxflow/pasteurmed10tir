"use client";

import { Button } from "@/components/ui/Button";
import {
  Badge,
  Card,
  FormInput,
  FormLabel,
  FormSelect,
  FormTextarea,
} from "@/components/ui/Card";
import {
  getConsultationPrice,
  getConsultationTypes,
  loadConsultationPricing,
} from "@/lib/consultationPrice";
import {
  buildAvailableBookingDates,
  formatBookingDateLabel,
} from "@/lib/operations/booking-dates";
import {
  formatPreferredTimeLabel,
  medicalVisitSlotsForDay,
} from "@/lib/operations/medical-slots";
import { fetchPublic } from "@/lib/content/client";
import { fetchPatientOps } from "@/lib/operations/client";
import { PASTEUR_DATA, type Physician } from "@/lib/data";
import { type PendingConsultationPayment } from "@/lib/payment";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import {
  isPatientApproved,
  payableFromFranchise,
  resolveFranchisePercent,
  type PatientProfile,
} from "@/lib/patient";
import {
  isConsultationCallbackCategory,
  isMedicalHomeCategory,
} from "@/lib/consultation/categories";
import { cn, formatPrice } from "@/lib/utils";
import { ConsultationCallbackForm } from "./ConsultationCallbackForm";
import { MedicalHomeVisitForm } from "./MedicalHomeVisitForm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const TYPE_IDS = ["text", "image", "video", "phone"] as const;

export function ConsultationForm({ variant = "web" }: { variant?: "web" | "app" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedType = searchParams.get("type");
  const requestedCategory = searchParams.get("category");
  const requestedSpecialty = searchParams.get("specialty");
  const requestedDoctor = searchParams.get("doctor");

  const initialType = TYPE_IDS.includes(requestedType as (typeof TYPE_IDS)[number])
    ? (requestedType as string)
    : "text";

  const [physicians, setPhysicians] = useState<Physician[]>([]);

  const initialDoctorId = requestedDoctor ? Number.parseInt(requestedDoctor, 10) : null;

  const initialCategory =
    PASTEUR_DATA.consultationCategories.some((c) => c.id === requestedCategory)
      ? (requestedCategory as string)
      : PASTEUR_DATA.consultationCategories[0]?.id || "dental";

  // پرستاری و لیزر دیگر از فرم مشاوره پشتیبانی نمی‌شوند
  const blockedNursing = requestedCategory === "nursing";
  const blockedLaser = requestedCategory === "laser";

  const [consultationTypes, setConsultationTypes] = useState(() => getConsultationTypes());
  const [selectedType, setSelectedType] = useState(initialType);
  const [category, setCategory] = useState(initialCategory);
  const [doctorId, setDoctorId] = useState<number | null>(
    Number.isFinite(initialDoctorId) ? initialDoctorId : null,
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [onlineInsurance, setOnlineInsurance] = useState(false);
  const [hasComplementary, setHasComplementary] = useState(false);
  const [patientApproved, setPatientApproved] = useState(false);
  const [franchisePercent, setFranchisePercent] = useState(10);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const selectedSpecialty = useMemo(() => {
    if (!requestedSpecialty) return null;
    const match = physicians.find(
      (doctor) =>
        String(doctor.specialtyId) === requestedSpecialty ||
        doctor.specialtyId === requestedSpecialty,
    );
    if (!match) return null;
    return { id: requestedSpecialty, name: match.specialty };
  }, [physicians, requestedSpecialty]);

  const requiresDoctor = category === "medical-specialty" && Boolean(selectedSpecialty);
  const isVisitBooking =
    category === "medical" || category === "medical-specialty";
  const selectedDoctor = useMemo(
    () => physicians.find((doctor) => doctor.id === doctorId) || null,
    [physicians, doctorId],
  );
  const availableDoctors = useMemo(() => {
    if (!selectedSpecialty) return [];
    return physicians.filter(
      (doctor) =>
        String(doctor.specialtyId) === selectedSpecialty.id ||
        doctor.specialtyId === selectedSpecialty.id,
    );
  }, [physicians, selectedSpecialty]);
  const showDoctorStep = requiresDoctor && !selectedDoctor;
  const needsGeneralDoctor = category === "medical" && !doctorId;

  const dateOptions = useMemo(() => {
    if (!selectedDoctor?.days?.length) return [];
    return buildAvailableBookingDates(selectedDoctor.days, 6);
  }, [selectedDoctor]);

  const timeOptions = useMemo(() => {
    if (!selectedDoctor || !preferredDate) return [];
    const option = dateOptions.find((d) => d.isoDate === preferredDate);
    const weekday = option?.weekday;
    const daySchedule =
      (weekday && selectedDoctor.schedule?.[weekday]) ||
      Object.values(selectedDoctor.schedule || {})[0] ||
      null;
    const slots = medicalVisitSlotsForDay(daySchedule);
    if (slots.length) return slots;
    // Fallback when schedule not yet configured: 9–16 every 15 minutes
    return medicalVisitSlotsForDay({
      visitHours: [9, 10, 11, 12, 13, 14, 15, 16],
    });
  }, [selectedDoctor, preferredDate, dateOptions]);

  useEffect(() => {
    setPreferredDate("");
    setPreferredTime("");
  }, [doctorId]);

  useEffect(() => {
    setPreferredTime("");
  }, [preferredDate]);

  useEffect(() => {
    if (
      requestedCategory &&
      PASTEUR_DATA.consultationCategories.some((c) => c.id === requestedCategory)
    ) {
      setCategory(requestedCategory);
    }
  }, [requestedCategory]);

  useEffect(() => {
    if (requestedType && TYPE_IDS.includes(requestedType as (typeof TYPE_IDS)[number])) {
      setSelectedType(requestedType);
    }
  }, [requestedType]);

  useEffect(() => {
    if (requestedDoctor) {
      const parsed = Number.parseInt(requestedDoctor, 10);
      if (Number.isFinite(parsed)) {
        setDoctorId(parsed);
      }
    }
  }, [requestedDoctor]);

  useEffect(() => {
    void loadConsultationPricing().then(() => setConsultationTypes(getConsultationTypes()));
    void fetchPublic<{ items: Physician[] }>("/api/content/physicians")
      .then((data) => setPhysicians(data.items))
      .catch(() => setPhysicians([]));
    void fetchPatientOps<{ profile: PatientProfile | null }>("/api/auth/me")
      .then((res) => {
        const session = res.profile;
        if (!session) return;
        setHasComplementary(Boolean(session.complementaryInsuranceId));
        setPatientApproved(isPatientApproved(session));
        setFranchisePercent(resolveFranchisePercent(session));
        setName((prev) => prev || session.name);
        setPhone((prev) => prev || session.phone);
      })
      .catch(() => {});
  }, []);

  const cat = PASTEUR_DATA.consultationCategories.find((c) => c.id === category);
  const selectedTypeMeta = consultationTypes.find((type) => type.id === selectedType);
  const pricePreview = useMemo(
    () =>
      getConsultationPrice({
        specialtyId: selectedSpecialty?.id || null,
        specialtyName: selectedSpecialty?.name || null,
        typeId: selectedType,
        categoryId: category,
      }),
    [selectedSpecialty?.id, selectedSpecialty?.name, selectedType, category],
  );

  function onImageChange(file: File | null) {
    if (!file) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(String(ev.target?.result || ""));
    reader.readAsDataURL(file);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (requiresDoctor && !selectedDoctor) return;
    if (selectedDoctor && isVisitBooking) {
      if (!preferredDate || !preferredTime) {
        setSubmitError("روز و ساعت ویزیت ۱۵ دقیقه‌ای را انتخاب کنید.");
        return;
      }
    }

    const type = consultationTypes.find((item) => item.id === selectedType);
    const pricing = getConsultationPrice({
      specialtyId: selectedSpecialty?.id || null,
      specialtyName: selectedSpecialty?.name || null,
      typeId: selectedType,
      categoryId: category,
    });

    let payableAmount = pricing.amount;
    let paymentLabel = "مبلغ مشاوره یا ویزیت";
    if (onlineInsurance && patientApproved) {
      payableAmount = payableFromFranchise(pricing.amount, franchisePercent);
      paymentLabel = `فرانشیز ${franchisePercent.toLocaleString("fa-IR")}٪ از هزینه ویزیت`;
    }

    if (payableAmount < 100) {
      setSubmitError("مبلغ پرداخت نامعتبر است.");
      return;
    }

    const preferredDateLabel = preferredDate ? formatBookingDateLabel(preferredDate) : undefined;
    const preferredTimeLabel = preferredTime
      ? formatPreferredTimeLabel(preferredTime)
      : undefined;

    const pending: PendingConsultationPayment = {
      kind: "consultation",
      type: selectedType,
      typeLabel: type?.label,
      category,
      categoryLabel: cat?.label,
      specialty: selectedSpecialty?.id || undefined,
      specialtyLabel: selectedSpecialty?.name || undefined,
      doctorId: selectedDoctor?.id,
      doctorName: selectedDoctor?.name || undefined,
      patientName: name.trim(),
      patientPhone: phone.trim(),
      description: description.trim(),
      estimate: pricing.label,
      amount: payableAmount,
      priceSource: pricing.source,
      hasImage: Boolean(imagePreview),
      onlineInsuranceCovered: onlineInsurance,
      paymentLabel,
      preferredDate: preferredDate || undefined,
      preferredDateLabel,
      preferredTime: preferredTime || undefined,
      preferredTimeLabel,
      returnTo: variant === "app" ? ROUTES.app.consultation : ROUTES.web.consultation,
      successTo:
        variant === "app" ? ROUTES.app.consultationSuccess : ROUTES.web.consultationSuccess,
    };

    PasteurStorage.initPatientDomainIfNeeded();
    PasteurStorage.setPendingPayment(pending);
    setSubmitError("");
    router.push(
      variant === "app" ? ROUTES.app.consultationConfirm : ROUTES.web.consultationConfirm,
    );
  }

  if (blockedNursing) {
    const nursingHref = variant === "app" ? ROUTES.app.nursing : ROUTES.web.nursing;
    return (
      <div className={cn("space-y-4", variant === "app" && "mt-2")}>
        <p className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
          خدمات پرستاری دیگر از مسیر مشاوره و ویزیت ثبت نمی‌شود. لطفاً خدمت و تعرفه را از بخش
          پرستاری انتخاب و پرداخت کنید.
        </p>
        <Link
          href={nursingHref}
          className="inline-flex rounded-full bg-teal-700 px-5 py-2.5 text-sm font-bold text-white"
        >
          رفتن به خدمات پرستاری
        </Link>
      </div>
    );
  }

  if (isConsultationCallbackCategory(category)) {
    return <ConsultationCallbackForm categoryId={category} variant={variant} />;
  }

  if (isMedicalHomeCategory(category)) {
    return <MedicalHomeVisitForm variant={variant} />;
  }

  if (blockedLaser) {
    const laserHref = variant === "app" ? ROUTES.app.laser : ROUTES.web.laser;
    return (
      <div className={cn("space-y-4", variant === "app" && "mt-2")}>
        <p className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
          خدمات لیزر و زیبایی از مسیر مشاوره ثبت نمی‌شود. لطفاً خدمت و تعرفه را از بخش لیزر انتخاب و
          پرداخت کنید.
        </p>
        <Link
          href={laserHref}
          className="inline-flex rounded-full bg-purple-700 px-5 py-2.5 text-sm font-bold text-white"
        >
          رفتن به لیزر و زیبایی
        </Link>
      </div>
    );
  }

  if (showDoctorStep) {
    return (
      <div className={cn("space-y-4", variant === "app" && "mt-2")}>
        <div>
          <FormLabel>انتخاب پزشک — {selectedSpecialty?.name}</FormLabel>
          <p className="mb-3 text-sm text-slate-600">
            پزشک را انتخاب کنید؛ سپس روز و نوبت ۱۵ دقیقه‌ای ویزیت را مشخص می‌کنید.
          </p>
        </div>
        <div className="space-y-3">
          {availableDoctors.length ? (
            availableDoctors.map((doctor) => {
              const inactive = doctor.status !== "available" && doctor.status !== "busy";
              return (
                <button
                  key={doctor.id}
                  type="button"
                  disabled={inactive}
                  onClick={() => setDoctorId(doctor.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl border p-4 text-right transition",
                    doctorId === doctor.id
                      ? "border-teal-500 bg-teal-50 ring-2 ring-teal-200"
                      : "border-sky-200 bg-white hover:border-teal-400",
                    inactive && "cursor-not-allowed opacity-50",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doctor.image}
                    alt=""
                    className="h-14 w-14 rounded-lg border-2 border-slate-200 object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{doctor.name}</span>
                      <Badge status={doctor.status} />
                    </div>
                    <p className="text-sm text-teal-700">{doctor.specialty}</p>
                    {doctor.medicalCouncilNumber ? (
                      <p className="text-xs text-slate-500">
                        نظام پزشکی: {doctor.medicalCouncilNumber}
                      </p>
                    ) : null}
                    {doctor.days?.length ? (
                      <p className="mt-1 text-xs text-slate-500">
                        روزهای حضور: {doctor.days.join("، ")}
                        {doctor.hours ? ` · ${doctor.hours}` : ""}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[0.7rem] font-bold text-cyan-800">
                      ویزیت · نوبت‌های ۱۵ دقیقه‌ای
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              در حال حاضر پزشکی برای این تخصص ثبت نشده است.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (needsGeneralDoctor) {
    const doctorsHref =
      variant === "app"
        ? `${ROUTES.app.medicalDoctors}?scope=general`
        : `${ROUTES.web.medicalDoctors}?scope=general`;
    return (
      <div className={cn("space-y-4", variant === "app" && "mt-2")}>
        <p className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
          برای ویزیت پزشکی عمومی ابتدا پزشک را انتخاب کنید (مثل دندانپزشکی)، سپس روز و نوبت ۱۵
          دقیقه‌ای را مشخص کنید.
        </p>
        <Link
          href={doctorsHref}
          className="inline-flex rounded-full bg-teal-700 px-5 py-2.5 text-sm font-bold text-white"
        >
          مشاهده پزشکان عمومی
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-6", variant === "app" && "space-y-4")}>
      {selectedDoctor ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
          <FormLabel>پزشک انتخاب‌شده</FormLabel>
          <div className="mt-3 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedDoctor.image}
              alt=""
              className="h-14 w-14 rounded-lg border-2 border-white object-cover"
            />
            <div>
              <p className="font-bold text-slate-900">{selectedDoctor.name}</p>
              <p className="text-sm text-teal-700">{selectedDoctor.specialty}</p>
              {selectedDoctor.medicalCouncilNumber ? (
                <p className="text-xs text-slate-500">
                  نظام پزشکی: {selectedDoctor.medicalCouncilNumber}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {selectedDoctor && (dateOptions.length > 0 || isVisitBooking) ? (
        <div className="space-y-4">
          <div>
            <FormLabel>روز ویزیت</FormLabel>
            <p className="mb-2 text-xs text-slate-500">
              فقط ویزیت — هر نوبت ۱۵ دقیقه (یک ربع)
            </p>
            {dateOptions.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {dateOptions.map((d) => (
                  <button
                    key={d.isoDate}
                    type="button"
                    onClick={() => setPreferredDate(d.isoDate)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-bold transition",
                      preferredDate === d.isoDate
                        ? "border-teal-500 bg-teal-50 text-teal-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-teal-300",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-amber-700">
                روزهای حضور این پزشک هنوز تنظیم نشده است.
              </p>
            )}
          </div>
          {preferredDate ? (
            <div>
              <FormLabel>ساعت ویزیت (۱۵ دقیقه‌ای)</FormLabel>
              {timeOptions.length ? (
                <div className="mt-2 grid max-h-48 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                  {timeOptions.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setPreferredTime(t.value)}
                      className={cn(
                        "rounded-xl border px-2 py-2 text-xs font-bold transition",
                        preferredTime === t.value
                          ? "border-teal-500 bg-teal-50 text-teal-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-teal-300",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-amber-700">
                  برای این روز نوبتی تعریف نشده است.
                </p>
              )}
            </div>
          ) : null}
          <p className="text-xs text-slate-500">
            پس از انتخاب روز و ساعت، کارشناسان هماهنگی نهایی را انجام می‌دهند.
          </p>
        </div>
      ) : selectedDoctor ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          برنامه حضور این پزشک هنوز تنظیم نشده؛ کارشناسان ظرف چند ساعت هماهنگی می‌کنند.
        </p>
      ) : null}

      <div>
        <FormLabel>نوع مشاوره یا ویزیت</FormLabel>
        <div
          className={cn(
            "grid gap-3",
            variant === "app" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2",
          )}
        >
          {consultationTypes.map((t) => {
            const cardPrice = getConsultationPrice({
              specialtyId: selectedSpecialty?.id || null,
              specialtyName: selectedSpecialty?.name || null,
              typeId: t.id,
              categoryId: category,
            });
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id)}
                className={cn(
                  "rounded-[1.25rem] border p-4 text-center transition",
                  selectedType === t.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-sky-200 bg-white hover:border-teal-300",
                )}
              >
                <span className="text-2xl">{t.emoji}</span>
                <p className="mt-2 text-sm font-bold">{t.label}</p>
                <p className="mt-1 text-xs font-bold text-teal-700">
                  {formatPrice(cardPrice.amount)}
                </p>
                {variant === "web" ? (
                  <p className="mt-1 text-xs text-slate-500">{t.desc}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {!requestedCategory ? (
        <div>
          <FormLabel>دسته خدمت</FormLabel>
          <FormSelect
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {PASTEUR_DATA.consultationCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </FormSelect>
        </div>
      ) : (
        <div>
          <FormLabel>دسته خدمت</FormLabel>
          <FormInput value={cat?.label || category} readOnly className="bg-slate-50" />
        </div>
      )}

      {selectedSpecialty ? (
        <div>
          <FormLabel>تخصص پزشکی</FormLabel>
          <FormInput value={selectedSpecialty.name} readOnly className="bg-slate-50" />
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-4",
          variant === "app" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
        )}
      >
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
        <FormLabel>شرح مشکل</FormLabel>
        <FormTextarea
          required
          placeholder="مشکل خود را شرح دهید..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px]"
        />
      </div>

      <div>
        <FormLabel>آپلود تصویر (اختیاری)</FormLabel>
        <FormInput
          type="file"
          accept="image/*"
          onChange={(e) => onImageChange(e.target.files?.[0] || null)}
        />
        {imagePreview ? (
          <div className="mt-3">
            <p className="mb-2 text-xs text-slate-500">پیش‌نمایش تصویر:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="پیش‌نمایش"
              className="max-h-48 rounded-lg border-2 border-slate-200"
            />
          </div>
        ) : null}
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm font-bold text-slate-700">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-cyan-800"
          checked={onlineInsurance}
          disabled={!hasComplementary || !patientApproved}
          onChange={(e) => setOnlineInsurance(e.target.checked)}
        />
        <span>
          ویزیت آنلاین با پوشش بیمه تکمیلی
          <span className="mt-1 block text-xs font-normal text-slate-500">
            {!hasComplementary
              ? "ابتدا در پنل کاربری بیمه تکمیلی را ثبت کنید تا این گزینه فعال شود."
              : !patientApproved
                ? "کاربری شما در حال بررسی است؛ پس از تأیید کارشناس، فرانشیز٪ اعمال می‌شود."
                : `پس از تأیید، مبلغ واریزی = ${franchisePercent.toLocaleString("fa-IR")}٪ از هزینه ویزیت.`}
          </span>
        </span>
      </label>

      <Card hover={false} className="border-teal-200 bg-teal-50 p-5">
        <h3 className="mb-2 font-bold text-teal-800">🔮 پیش‌نمایش هوشمند</h3>
        <p className="text-sm text-slate-700">
          {selectedSpecialty && selectedTypeMeta
            ? pricePreview.label
            : `خدمت پیشنهادی: ${cat?.service || "—"}`}
        </p>
        <p className="mt-2 text-lg font-bold text-teal-700">
          {formatPrice(pricePreview.amount)}
        </p>
        {onlineInsurance && patientApproved ? (
          <p className="mt-2 text-sm font-bold text-cyan-900">
            مبلغ واریزی با فرانشیز {franchisePercent.toLocaleString("fa-IR")}٪:{" "}
            {formatPrice(payableFromFranchise(pricePreview.amount, franchisePercent))}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">
          مبلغ نهایی بر اساس نوع ویزیت
          {selectedSpecialty ? " و تخصص انتخاب‌شده" : ""} محاسبه شده است.
        </p>
      </Card>

      <Button type="submit" variant="primary" className="w-full">
        {variant === "app" ? "ادامه و پرداخت" : "ادامه به پرداخت"}
      </Button>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
    </form>
  );
}
