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
import { cn, formatPrice } from "@/lib/utils";
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

  if (showDoctorStep) {
    return (
      <div className={cn("space-y-4", variant === "app" && "mt-2")}>
        <div>
          <FormLabel>انتخاب پزشک — {selectedSpecialty?.name}</FormLabel>
          <p className="mb-3 text-sm text-slate-600">
            پزشک مورد نظر را انتخاب کنید؛ سپس نوع ویزیت را مشخص می‌کنید.
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
