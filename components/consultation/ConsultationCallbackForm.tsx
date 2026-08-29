"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { createConsultationApi } from "@/lib/operations/client";
import { PASTEUR_DATA } from "@/lib/data";
import { cn } from "@/lib/utils";
import { FormEvent, useEffect, useState } from "react";
import { fetchPatientOps } from "@/lib/operations/client";
import type { PatientProfile } from "@/lib/patient";

type Props = {
  categoryId: string;
  variant?: "web" | "app";
};

export function ConsultationCallbackForm({ categoryId, variant = "web" }: Props) {
  const cat = PASTEUR_DATA.consultationCategories.find((c) => c.id === categoryId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchPatientOps<{ profile: PatientProfile | null }>("/api/auth/me")
      .then((res) => {
        if (!res.profile) return;
        setName((prev) => prev || res.profile!.name);
        setPhone((prev) => prev || res.profile!.phone);
      })
      .catch(() => {});
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const patientName = name.trim();
    const patientPhone = phone.trim();
    if (!patientName || !patientPhone) {
      setError("نام و موبایل الزامی است.");
      return;
    }

    const fullDescription = [address.trim(), description.trim()].filter(Boolean).join("\n");

    setSubmitting(true);
    void createConsultationApi({
      category: categoryId,
      categoryLabel: cat?.label,
      type: "callback",
      typeLabel: "تماس کارشناس",
      name: patientName,
      phone: patientPhone,
      patientName,
      patientPhone,
      description: fullDescription || cat?.service || "درخواست تماس",
      estimate: "تماس کارشناس",
      amount: 0,
      priceSource: "callback",
    })
      .then(() => setDone(true))
      .catch((err) => setError(err instanceof Error ? err.message : "ثبت ناموفق"))
      .finally(() => setSubmitting(false));
  }

  if (done) {
    return (
      <Card hover={false} className="border-green-200 bg-green-50 p-6 text-center">
        <p className="mb-2 text-2xl">✅</p>
        <p className="font-bold text-green-800">درخواست شما ثبت شد.</p>
        <p className="mt-2 text-sm text-slate-600">
          کارشناسان پاستور پلاس در اسرع وقت با شماره {phone} تماس می‌گیرند.
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-5", variant === "app" && "space-y-4")}>
      <Card hover={false} className="border-cyan-100 bg-cyan-50/70 p-4">
        <p className="text-sm font-bold text-cyan-900">{cat?.label || "درخواست خدمت"}</p>
        <p className="mt-1 text-xs leading-6 text-slate-600">
          پس از ثبت درخواست، اپراتور با شما تماس می‌گیرد. پرداخت آنلاین در این مرحله انجام
          نمی‌شود.
        </p>
      </Card>

      <div>
        <FormLabel>دسته خدمت</FormLabel>
        <FormInput value={cat?.label || categoryId} readOnly className="bg-slate-50" />
      </div>

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
        <FormLabel>آدرس (منزل یا مجموعه)</FormLabel>
        <FormInput
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="آدرس کامل برای هماهنگی اعزام"
        />
      </div>

      <div>
        <FormLabel>توضیحات تکمیلی</FormLabel>
        <FormTextarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="شرح کوتاه نیاز یا زمان ترجیحی..."
          className="min-h-[100px]"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
        {submitting ? "در حال ثبت..." : "ثبت درخواست — تماس کارشناس"}
      </Button>
    </form>
  );
}
