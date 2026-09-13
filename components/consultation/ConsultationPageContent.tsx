"use client";

import { ConsultationForm } from "@/components/consultation/ConsultationForm";
import { ConsultationQuickLinks } from "@/components/consultation/ConsultationQuickLinks";
import {
  isFocusedConsultationCategory,
  isMedicalHomeCategory,
  isConsultationCallbackCategory,
  MEDICAL_CLINIC_CATEGORIES,
} from "@/lib/consultation/categories";
import { PASTEUR_DATA } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function isMedicalClinicCategory(categoryId?: string | null): boolean {
  return MEDICAL_CLINIC_CATEGORIES.includes(
    categoryId as (typeof MEDICAL_CLINIC_CATEGORIES)[number],
  );
}

function focusedIntro(categoryId: string): string {
  if (isMedicalHomeCategory(categoryId)) {
    return "نوع پزشک (عمومی یا متخصص) را انتخاب کنید؛ آدرس منزل را وارد کنید و هزینه ویزیت را پرداخت کنید.";
  }
  if (isMedicalClinicCategory(categoryId)) {
    return "پزشک انتخاب‌شده را تأیید کنید؛ روز و نوبت ۱۵ دقیقه‌ای ویزیت را مشخص کنید و درخواست را ثبت کنید.";
  }
  if (isConsultationCallbackCategory(categoryId)) {
    return "درخواست شما ثبت می‌شود و کارشناس در اسرع وقت با شما تماس می‌گیرد. پرداخت آنلاین در این مرحله انجام نمی‌شود.";
  }
  const cat = PASTEUR_DATA.consultationCategories.find((c) => c.id === categoryId);
  return cat?.service || "درخواست خود را ثبت کنید.";
}

function ConsultationPageBody({ variant }: { variant: "web" | "app" }) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const doctor = searchParams.get("doctor");
  /** ویزیت پزشک با category اختصاصی یا با doctor در query — Quick Links نامرتبط نشان داده نشود. */
  const focused = isFocusedConsultationCategory(category) || Boolean(doctor);
  const consultationBase = variant === "app" ? ROUTES.app.consultation : ROUTES.web.consultation;

  const title = focused
    ? PASTEUR_DATA.consultationCategories.find((c) => c.id === category)?.label ||
      (doctor ? "ویزیت پزشک" : "مشاوره و ویزیت")
    : "مشاوره و ویزیت";

  const intro = focused
    ? focusedIntro(category || (doctor ? "medical" : ""))
    : "ابتدا درخواست خود را ثبت کنید؛ در مرحله بعد نوع ارتباط متنی، تصویری، اورژانسی یا صوتی هماهنگ می‌شود.";

  return (
    <>
      {focused ? (
        <Link
          href={consultationBase}
          className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:underline"
        >
          ← همه خدمات مشاوره
        </Link>
      ) : null}

      {variant === "web" ? (
        <>
          <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">💬 {title}</h1>
          <p className="mb-8 text-slate-600">{intro}</p>
        </>
      ) : (
        <p className="mb-4 text-sm leading-6 text-slate-600">{intro}</p>
      )}

      {!focused ? <ConsultationQuickLinks variant={variant} /> : null}

      <Suspense
        fallback={<p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>}
      >
        <ConsultationForm variant={variant} />
      </Suspense>
    </>
  );
}

export function ConsultationPageContent({ variant }: { variant: "web" | "app" }) {
  return (
    <Suspense
      fallback={<p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>}
    >
      <ConsultationPageBody variant={variant} />
    </Suspense>
  );
}

export function useConsultationPageTitle(): string {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const doctor = searchParams.get("doctor");
  if (isFocusedConsultationCategory(category)) {
    return (
      PASTEUR_DATA.consultationCategories.find((c) => c.id === category)?.label ||
      "مشاوره و ویزیت"
    );
  }
  if (doctor) return "ویزیت پزشک";
  return "مشاوره و ویزیت";
}
