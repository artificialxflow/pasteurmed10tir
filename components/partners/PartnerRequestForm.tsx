"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Card";
import { postPublicOps } from "@/lib/operations/client";
import { cn } from "@/lib/utils";
import { FormEvent, useState } from "react";

const PARTNER_TYPES = [
  { id: "nurse", label: "پرستار", emoji: "👩‍⚕️" },
  { id: "dentist", label: "دندانپزشک", emoji: "🦷" },
  { id: "doctor", label: "پزشک", emoji: "🩺" },
  { id: "psychologist", label: "روانشناس", emoji: "🧠" },
] as const;

type Props = {
  /** Compact select-based form for /app */
  variant?: "web" | "app";
  onSuccess?: () => void;
};

export function PartnerRequestForm({ variant = "web", onSuccess }: Props) {
  const [selectedType, setSelectedType] = useState<string>("nurse");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("تبریز");
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const type = PARTNER_TYPES.find((t) => t.id === selectedType);
    void postPublicOps("/api/operations/partners", {
      type: selectedType,
      typeLabel: type?.label || "—",
      name: name.trim(),
      phone: phone.trim(),
      specialty: specialty.trim(),
      city: city.trim(),
      description: description.trim(),
      notes: description.trim(),
    }).then(() => {
      setDone(true);
      onSuccess?.();
      if (variant === "app") {
        setName("");
        setPhone("");
        setSpecialty("");
        setDescription("");
        setDone(false);
      }
    });
  }

  if (done && variant === "web") {
    return (
      <Card hover={false} className="border-green-200 bg-green-50 p-6 text-center">
        <p className="mb-2 text-2xl">✅</p>
        <p className="font-bold text-green-800">درخواست همکاری ثبت شد.</p>
        <p className="mt-2 text-sm text-slate-600">
          پس از بررسی اولیه، کارشناسان پاستور پلاس با شما تماس می‌گیرند.
        </p>
      </Card>
    );
  }

  if (variant === "app") {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormSelect
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          required
        >
          {PARTNER_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.emoji} {t.label}
            </option>
          ))}
        </FormSelect>
        <FormInput
          placeholder="نام و نام خانوادگی"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <FormInput
          type="tel"
          placeholder="موبایل"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <FormInput
          placeholder="تخصص / مهارت"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        />
        <FormInput
          placeholder="شهر"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <FormTextarea
          placeholder="توضیحات"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button type="submit" className="w-full">
          ارسال درخواست
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card hover={false} className="space-y-5 bg-white p-6">
        <div>
          <FormLabel>نوع همکاری</FormLabel>
          <div className="mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-4">
            {PARTNER_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "rounded-[1.25rem] border p-4 text-center transition",
                  selectedType === type.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-sky-300/45 bg-white hover:border-teal-400",
                )}
              >
                <span className="text-2xl">{type.emoji}</span>
                <p className="mt-2 text-sm font-bold">{type.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel>نام و نام خانوادگی</FormLabel>
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <FormLabel>شماره موبایل</FormLabel>
            <FormInput
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <FormLabel>تخصص / مهارت</FormLabel>
            <FormInput
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="مثلاً پرستاری زخم، دندانپزشک عمومی، روانشناسی..."
            />
          </div>
          <div>
            <FormLabel>شهر</FormLabel>
            <FormInput value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>

        <div>
          <FormLabel>توضیحات همکاری</FormLabel>
          <FormTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="سابقه کار، روزهای آزاد، محدوده فعالیت یا توضیحات تکمیلی..."
            className="min-h-[110px]"
          />
        </div>

        <Button type="submit" className="w-full">
          ثبت درخواست همکاری
        </Button>
      </Card>
    </form>
  );
}
