"use client";

import { Badge } from "@/components/ui/Card";
import { DoctorReviewForm } from "@/components/reviews/DoctorReviewForm";
import { fetchPublic } from "@/lib/content/client";
import type { Physician } from "@/lib/data";
import { isGeneralPhysician } from "@/lib/operations/medical-slots";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import type { MedicalBasePath } from "./MedicalHub";

function isAppMedical(basePath: MedicalBasePath): boolean {
  return basePath.startsWith("/app");
}

export function MedicalDoctorList({ basePath }: { basePath: MedicalBasePath }) {
  const searchParams = useSearchParams();
  const specialtyId = searchParams.get("specialty");
  const scope = searchParams.get("scope");
  const isGeneralScope = scope === "general";
  const [physicians, setPhysicians] = useState<Physician[]>([]);

  useEffect(() => {
    fetchPublic<{ items: Physician[] }>("/api/content/physicians")
      .then((data) => setPhysicians(data.items))
      .catch(() => setPhysicians([]));
  }, []);

  const doctors = useMemo(() => {
    if (isGeneralScope) {
      return physicians.filter(isGeneralPhysician);
    }
    if (!specialtyId) return [];
    return physicians.filter(
      (doctor) =>
        doctor.specialtyId === specialtyId || String(doctor.specialtyId) === specialtyId,
    );
  }, [physicians, specialtyId, isGeneralScope]);

  const app = isAppMedical(basePath);
  const consultation = app ? ROUTES.app.consultation : ROUTES.web.consultation;
  const medical = app ? ROUTES.app.medical : ROUTES.web.medical;
  const specialtyPage = app ? ROUTES.app.medicalSpecialty : ROUTES.web.medicalSpecialty;

  const specialty = useMemo(() => {
    if (isGeneralScope) {
      return { id: "general", name: "پزشکی عمومی", emoji: "👨‍⚕️" };
    }
    if (!specialtyId) return null;
    const match = physicians.find(
      (doctor) =>
        doctor.specialtyId === specialtyId || String(doctor.specialtyId) === specialtyId,
    );
    if (!match) return null;
    return {
      id: specialtyId,
      name: match.specialty,
      emoji: "🔬",
    };
  }, [physicians, specialtyId, isGeneralScope]);

  if (!specialty) {
    return (
      <div className={cn(app ? "space-y-4" : "mx-auto max-w-3xl px-4 py-10 sm:px-6")}>
        <p className="text-sm text-slate-600">تخصص انتخاب نشده است.</p>
        <Link href={specialtyPage} className="text-sm font-bold text-teal-700 underline">
          بازگشت به لیست تخصص‌ها
        </Link>
      </div>
    );
  }

  const backHref = isGeneralScope ? medical : specialtyPage;
  const backLabel = isGeneralScope ? "بازگشت به پزشکی" : "بازگشت به تخصص‌ها";

  const content = (
    <div className="space-y-4">
      {doctors.length ? (
        doctors.map((doctor) => {
          const inactive = doctor.status !== "available" && doctor.status !== "busy";
          const href = isGeneralScope
            ? `${consultation}?category=medical&type=phone&doctor=${doctor.id}`
            : `${consultation}?category=medical-specialty&specialty=${specialty.id}&doctor=${doctor.id}&type=phone`;
          return (
            <div key={doctor.id}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border p-4 text-right transition",
                  inactive
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50"
                    : "border-sky-200 bg-white hover:border-teal-400",
                )}
                aria-disabled={inactive}
                onClick={(event) => {
                  if (inactive) event.preventDefault();
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doctor.image}
                  alt=""
                  className="h-16 w-16 rounded-lg border-2 border-slate-200 object-cover"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{doctor.name}</span>
                    <Badge status={doctor.status} />
                  </div>
                  <p className="text-sm text-teal-700">{doctor.specialty}</p>
                  {doctor.medicalCouncilNumber ? (
                    <p className="mt-0.5 text-xs text-slate-500">
                      نظام پزشکی: {doctor.medicalCouncilNumber}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">
                    روزهای حضور: {(doctor.days || []).join("، ") || "—"}
                    {doctor.hours ? ` · ${doctor.hours}` : ""}
                  </p>
                  <p className="mt-1 text-[0.7rem] font-bold text-cyan-800">
                    ویزیت · نوبت‌های ۱۵ دقیقه‌ای
                  </p>
                </div>
                <span className="text-sm font-bold text-teal-700">انتخاب ←</span>
              </Link>
              <DoctorReviewForm
                doctorId={doctor.id}
                doctorName={doctor.name}
                doctorKind="medical"
              />
            </div>
          );
        })
      ) : (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {isGeneralScope
            ? "در حال حاضر پزشک عمومی ثبت نشده است. از پنل ادمین پزشک با تخصص «پزشک عمومی» اضافه کنید."
            : "در حال حاضر پزشکی برای این تخصص ثبت نشده است. لطفاً با پشتیبانی تماس بگیرید."}
        </p>
      )}
    </div>
  );

  if (app) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-500">{specialty.name}</p>
          <h2 className="text-lg font-bold text-slate-900">انتخاب پزشک</h2>
          <p className="mt-1 text-sm text-slate-600">
            پزشک را انتخاب کنید؛ سپس روز و ساعت ویزیت (هر نوبت ۱۵ دقیقه) را مشخص می‌کنید.
          </p>
        </div>
        {content}
        <Link href={backHref} className="inline-block text-sm font-bold text-teal-700 underline">
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href={medical} className="hover:text-teal-700">
          پزشکی
        </Link>
        {!isGeneralScope ? (
          <>
            <span className="mx-2">/</span>
            <Link href={specialtyPage} className="hover:text-teal-700">
              تخصص‌ها
            </Link>
          </>
        ) : null}
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">{specialty.name}</span>
      </nav>
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl">{specialty.emoji}</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">انتخاب پزشک — {specialty.name}</h1>
          <p className="mt-1 text-slate-600">
            مثل دندانپزشکی: ابتدا پزشک را ببینید و انتخاب کنید؛ سپس روز و نوبت ۱۵ دقیقه‌ای ویزیت را
            مشخص کنید.
          </p>
        </div>
      </div>
      {content}
      <Link href={backHref} className="mt-6 inline-block text-sm font-bold text-teal-700 underline">
        {backLabel}
      </Link>
    </div>
  );
}
