"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import {
  getHomeVisitTariffs,
  loadConsultationPricing,
} from "@/lib/consultationPrice";
import {
  DEFAULT_HOME_VISIT_TARIFFS,
  getHomeVisitPrice,
  type HomeVisitTariffs,
} from "@/lib/consultation/home-visit";
import { PASTEUR_DATA } from "@/lib/data";
import type { PendingConsultationPayment } from "@/lib/payment";
import { fetchPatientOps } from "@/lib/operations/client";
import type { PatientProfile } from "@/lib/patient";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import { cn, formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type Props = {
  variant?: "web" | "app";
};

export function MedicalHomeVisitForm({ variant = "web" }: Props) {
  const router = useRouter();
  const cat = PASTEUR_DATA.consultationCategories.find((c) => c.id === "medical-home");
  const [homeTariffs, setHomeTariffs] = useState<HomeVisitTariffs>(DEFAULT_HOME_VISIT_TARIFFS);
  const [visitScope, setVisitScope] = useState<"general" | "specialty">("general");
  const [specialtyId, setSpecialtyId] = useState("cardiology");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadConsultationPricing().then(() => {
      setHomeTariffs(getHomeVisitTariffs());
    });
    void fetchPatientOps<{ profile: PatientProfile | null }>("/api/auth/me")
      .then((res) => {
        if (!res.profile) return;
        setName((prev) => prev || res.profile!.name);
        setPhone((prev) => prev || res.profile!.phone);
      })
      .catch(() => {});
  }, []);

  const effectiveSpecialtyId = visitScope === "general" ? "general" : specialtyId;

  const pricing = useMemo(
    () => getHomeVisitPrice(homeTariffs, effectiveSpecialtyId),
    [homeTariffs, effectiveSpecialtyId],
  );

  const specialtyName = useMemo(() => {
    if (visitScope === "general") return "پزشک عمومی";
    return PASTEUR_DATA.medicalSpecialties.find((s) => String(s.id) === specialtyId)?.name || "";
  }, [visitScope, specialtyId]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const patientName = name.trim();
    const patientPhone = phone.trim();
    const homeAddress = address.trim();
    if (!patientName || !patientPhone) {
      setError("نام و موبایل الزامی است.");
      return;
    }
    if (!homeAddress) {
      setError("آدرس منزل الزامی است.");
      return;
    }
    if (pricing.amount < 100) {
      setError("تعرفه ویزیت در منزل تنظیم نشده است.");
      return;
    }

    const pending: PendingConsultationPayment = {
      kind: "consultation",
      type: "home-visit",
      typeLabel: "ویزیت در منزل",
      category: "medical-home",
      categoryLabel: cat?.label,
      specialty: effectiveSpecialtyId,
      specialtyLabel: specialtyName,
      patientName,
      patientPhone,
      description: [homeAddress, description.trim()].filter(Boolean).join("\n"),
      estimate: pricing.label,
      amount: pricing.amount,
      priceSource: "home-visit",
      paymentLabel: "هزینه ویزیت پزشک در منزل",
      returnTo: variant === "app" ? ROUTES.app.consultation : ROUTES.web.consultation,
      successTo:
        variant === "app" ? ROUTES.app.consultationSuccess : ROUTES.web.consultationSuccess,
    };

    PasteurStorage.initPatientDomainIfNeeded();
    PasteurStorage.setPendingPayment(pending);
    router.push(variant === "app" ? ROUTES.app.consultationConfirm : ROUTES.web.consultationConfirm);
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-5", variant === "app" && "space-y-4")}>
      <Card hover={false} className="border-teal-100 bg-teal-50/70 p-4">
        <p className="text-sm font-bold text-teal-900">{cat?.label || "ویزیت پزشک در منزل"}</p>
        <p className="mt-1 text-xs leading-6 text-slate-600">
          نوع پزشک و تخصص را انتخاب کنید؛ سپس هزینه ویزیت در منزل را پرداخت کنید.
        </p>
      </Card>

      <div>
        <FormLabel>نوع اعزام</FormLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setVisitScope("general")}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold",
              visitScope === "general"
                ? "border-teal-400 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-700",
            )}
          >
            پزشک عمومی
          </button>
          <button
            type="button"
            onClick={() => setVisitScope("specialty")}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold",
              visitScope === "specialty"
                ? "border-teal-400 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-700",
            )}
          >
            پزشک متخصص
          </button>
        </div>
      </div>

      {visitScope === "specialty" ? (
        <div>
          <FormLabel>تخصص مورد نیاز</FormLabel>
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            value={specialtyId}
            onChange={(e) => setSpecialtyId(e.target.value)}
          >
            {PASTEUR_DATA.medicalSpecialties.map((s) => (
              <option key={String(s.id)} value={String(s.id)}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className={cn("grid gap-4", variant === "app" ? "grid-cols-1" : "sm:grid-cols-2")}>
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
        <FormLabel>آدرس منزل</FormLabel>
        <FormInput
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="آدرس کامل برای اعزام پزشک"
        />
      </div>

      <div>
        <FormLabel>توضیحات</FormLabel>
        <FormTextarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="علائم یا زمان ترجیحی..."
          className="min-h-[100px]"
        />
      </div>

      <Card hover={false} className="border-teal-200 bg-teal-50 p-4">
        <p className="text-sm text-slate-700">{pricing.label}</p>
        <p className="mt-2 text-lg font-bold text-teal-800">{formatPrice(pricing.amount)}</p>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" variant="primary" className="w-full">
        {variant === "app" ? "ادامه و پرداخت" : "ادامه به پرداخت"}
      </Button>
    </form>
  );
}
