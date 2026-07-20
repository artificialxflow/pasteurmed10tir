"use client";

import { Button } from "@/components/ui/Button";
import {
  Card,
  FormInput,
  FormLabel,
  FormSelect,
  FormTextarea,
} from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { PasteurStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

const TYPE_IDS = ["text", "image", "video", "phone"] as const;

export function ConsultationForm({ variant = "web" }: { variant?: "web" | "app" }) {
  const searchParams = useSearchParams();
  const requestedType = searchParams.get("type");
  const requestedCategory = searchParams.get("category");
  const requestedSpecialty = searchParams.get("specialty");

  const initialType = TYPE_IDS.includes(requestedType as (typeof TYPE_IDS)[number])
    ? (requestedType as string)
    : "text";

  const selectedSpecialty = useMemo(
    () =>
      PASTEUR_DATA.medicalSpecialties.find((s) => s.id === requestedSpecialty) || null,
    [requestedSpecialty],
  );

  const initialCategory =
    PASTEUR_DATA.consultationCategories.some((c) => c.id === requestedCategory)
      ? (requestedCategory as string)
      : PASTEUR_DATA.consultationCategories[0]?.id || "dental";

  const [selectedType, setSelectedType] = useState(initialType);
  const [category, setCategory] = useState(initialCategory);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const cat = PASTEUR_DATA.consultationCategories.find((c) => c.id === category);
  const specialtyText = selectedSpecialty ? ` — تخصص: ${selectedSpecialty.name}` : "";

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
    const type = PASTEUR_DATA.consultationTypes.find((t) => t.id === selectedType);
    PasteurStorage.saveConsultation({
      id: PasteurStorage.generateId(),
      type: selectedType,
      typeLabel: type?.label,
      category,
      categoryLabel: cat?.label,
      specialty: selectedSpecialty?.id || null,
      specialtyLabel: selectedSpecialty?.name || null,
      name,
      phone,
      description,
      estimate: cat?.estimate,
      hasImage: Boolean(imagePreview),
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    PasteurStorage.addClubPoints(phone, 20, "مشاوره و ویزیت");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card
        hover={false}
        className={cn(
          "border-green-200 bg-green-50 p-6 text-center",
          variant === "app" && "mt-2",
        )}
      >
        <p className="text-2xl">✅</p>
        <p className="mt-2 font-bold text-green-800">
          {variant === "app" ? "درخواست ثبت شد" : "درخواست شما ثبت شد!"}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {variant === "app"
            ? "کارشناسان ظرف ۲۴ ساعت پاسخ می‌دهند."
            : "کارشناسان ما ظرف ۲۴ ساعت برای هماهنگی مشاوره یا ویزیت پاسخ می‌دهند."}
        </p>
        <p className="mt-3 text-xs font-bold text-teal-700">+۲۰ امتیاز باشگاه ثبت شد</p>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-6", variant === "app" && "space-y-4")}>
      <div>
        <FormLabel>نوع مشاوره یا ویزیت</FormLabel>
        <div
          className={cn(
            "grid gap-3",
            variant === "app" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2",
          )}
        >
          {PASTEUR_DATA.consultationTypes.map((t) => (
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
              {variant === "web" ? (
                <p className="mt-1 text-xs text-slate-500">{t.desc}</p>
              ) : null}
            </button>
          ))}
        </div>
      </div>

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

      {cat ? (
        <Card hover={false} className="border-teal-200 bg-teal-50 p-5">
          <h3 className="mb-2 font-bold text-teal-800">🔮 پیش‌نمایش هوشمند</h3>
          <p className="text-sm text-slate-700">
            خدمت پیشنهادی: {cat.service}
            {specialtyText}
          </p>
          <p className="mt-2 text-lg font-bold text-teal-700">بازه هزینه: {cat.estimate}</p>
          <p className="mt-2 text-xs text-slate-500">
            این تخمین اولیه است — تشخیص نهایی پس از بررسی کارشناس و ویزیت آنلاین انجام می‌شود.
          </p>
        </Card>
      ) : null}

      <Button type="submit" variant="primary" className="w-full">
        {variant === "app" ? "ثبت درخواست" : "ثبت درخواست مشاوره و ویزیت"}
      </Button>
    </form>
  );
}
