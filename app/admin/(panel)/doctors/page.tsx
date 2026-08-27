"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormSelect } from "@/components/ui/Card";
import { DraftNumberInput } from "@/components/ui/DraftNumberInput";
import {
  buildScheduleFromDayHours,
  dayHoursFromDentist,
  DENTIST_WEEKDAYS,
  parseDaysInput,
  summarizeDayHours,
  type DayHoursMap,
} from "@/lib/content/doctor-mappers";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import { PASTEUR_DATA, type Dentist, type Physician } from "@/lib/data";
import { cn } from "@/lib/utils";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Tab = "dentists" | "physicians";

const DENTAL_SPECIALTY_OPTIONS = [
  { id: "general", name: "دندانپزشکی عمومی" },
  ...PASTEUR_DATA.dentalSpecialties.map((s) => ({ id: String(s.id), name: s.name })),
];

function specialtyLabel(id: string): string {
  return DENTAL_SPECIALTY_OPTIONS.find((o) => o.id === id)?.name || "دندانپزشکی عمومی";
}

const STATUS_OPTIONS = [
  { value: "available", label: "در دسترس" },
  { value: "busy", label: "مشغول" },
  { value: "inactive", label: "غیرفعال" },
] as const;

function nextIntId(items: { id: number }[]): number {
  const max = items.reduce((m, item) => (Number.isFinite(item.id) ? Math.max(m, item.id) : m), 0);
  return max + 1;
}

function emptyDayHours(): DayHoursMap {
  const map: DayHoursMap = {};
  for (const day of DENTIST_WEEKDAYS) map[day] = null;
  return map;
}

function defaultNewDayHours(): DayHoursMap {
  const map = emptyDayHours();
  map["شنبه"] = { start: 9, end: 17 };
  map["دوشنبه"] = { start: 9, end: 17 };
  map["چهارشنبه"] = { start: 9, end: 17 };
  return map;
}

function applyDayHoursToDentist(dentist: Dentist, dayHours: DayHoursMap): Dentist {
  const schedule = buildScheduleFromDayHours(dayHours);
  const summary = summarizeDayHours(dayHours);
  return {
    ...dentist,
    schedule,
    days: summary.days,
    hours: summary.hours,
  };
}

function applyDayHoursToPhysician(physician: Physician, dayHours: DayHoursMap): Physician {
  const schedule = buildScheduleFromDayHours(dayHours);
  const summary = summarizeDayHours(dayHours);
  return {
    ...physician,
    schedule,
    days: summary.days,
    hours: summary.hours,
  };
}

function validateDayHours(dayHours: DayHoursMap): string | null {
  for (const day of DENTIST_WEEKDAYS) {
    const range = dayHours[day];
    if (!range) continue;
    if (
      !Number.isFinite(range.start) ||
      !Number.isFinite(range.end) ||
      range.start < 0 ||
      range.start > 23 ||
      range.end < 1 ||
      range.end > 24 ||
      range.end <= range.start
    ) {
      return `بازه ساعت «${day}» نامعتبر است (از باید کمتر از تا باشد).`;
    }
  }
  return null;
}

function DayHoursEditor({
  value,
  onChange,
  compact = false,
}: {
  value: DayHoursMap;
  onChange: (next: DayHoursMap) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-2", compact ? "min-w-[16rem]" : "")}>
      {DENTIST_WEEKDAYS.map((day) => {
        const active = Boolean(value[day]);
        const range = value[day] || { start: 9, end: 17 };
        return (
          <div
            key={day}
            className={cn(
              "grid items-center gap-2",
              compact ? "grid-cols-[4.5rem_auto_3.5rem_3.5rem]" : "grid-cols-[6rem_auto_4.5rem_4.5rem]",
            )}
          >
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => {
                  onChange({
                    ...value,
                    [day]: e.target.checked ? { start: range.start, end: range.end } : null,
                  });
                }}
              />
              {day}
            </label>
            <span className="text-[0.65rem] text-slate-400">{active ? "از — تا" : "—"}</span>
            {active ? (
              <DraftNumberInput
                min={0}
                max={23}
                className="text-xs"
                value={range.start}
                onCommit={(start) => {
                  onChange({
                    ...value,
                    [day]: { start, end: range.end },
                  });
                }}
              />
            ) : (
              <FormInput type="text" disabled className="text-xs" value="" />
            )}
            {active ? (
              <DraftNumberInput
                min={1}
                max={24}
                className="text-xs"
                value={range.end}
                onCommit={(end) => {
                  onChange({
                    ...value,
                    [day]: { start: range.start, end },
                  });
                }}
              />
            ) : (
              <FormInput type="text" disabled className="text-xs" value="" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDoctorsPage() {
  const [tab, setTab] = useState<Tab>("dentists");
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [error, setError] = useState("");

  const [dentistName, setDentistName] = useState("");
  const [dentistSpecialtyId, setDentistSpecialtyId] = useState("general");
  const [dentistMedicalCouncilNumber, setDentistMedicalCouncilNumber] = useState("");
  const [dentistDayHours, setDentistDayHours] = useState<DayHoursMap>(defaultNewDayHours);
  const [dentistImage, setDentistImage] = useState("");

  const [physicianName, setPhysicianName] = useState("");
  const [physicianSpecialty, setPhysicianSpecialty] = useState("");
  const [physicianSpecialtyId, setPhysicianSpecialtyId] = useState("");
  const [physicianMedicalCouncilNumber, setPhysicianMedicalCouncilNumber] = useState("");
  const [physicianDayHours, setPhysicianDayHours] = useState<DayHoursMap>(defaultNewDayHours);
  const [physicianImage, setPhysicianImage] = useState("");

  const reloadDentists = useCallback(async () => {
    const data = await fetchAdmin<{ items: Dentist[] }>("/api/admin/content/dentists");
    setDentists(
      data.items.map((d) => {
        const withCopies = {
          ...d,
          days: [...(d.days || [])],
          schedule: { ...(d.schedule || {}) },
        };
        return applyDayHoursToDentist(withCopies, dayHoursFromDentist(withCopies));
      }),
    );
  }, []);

  const reloadPhysicians = useCallback(async () => {
    const data = await fetchAdmin<{ items: Physician[] }>("/api/admin/content/physicians");
    setPhysicians(
      data.items.map((p) => {
        const withCopies = {
          ...p,
          days: [...(p.days || [])],
          schedule: { ...(p.schedule || {}) },
          hours: p.hours || "",
        };
        return applyDayHoursToPhysician(withCopies, dayHoursFromDentist(withCopies));
      }),
    );
  }, []);

  useEffect(() => {
    void reloadDentists().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
    void reloadPhysicians().catch(() => {});
  }, [reloadDentists, reloadPhysicians]);

  async function persistDentists(next: Dentist[]) {
    for (const item of next) {
      if (!item.name?.trim()) continue;
      const rangeError = validateDayHours(dayHoursFromDentist(item));
      if (rangeError) throw new Error(`${item.name}: ${rangeError}`);
    }
    const cleaned = next
      .map((item) => {
        const dayHours = dayHoursFromDentist(item);
        const patched = applyDayHoursToDentist(item, dayHours);
        return {
          ...patched,
          id: Number(patched.id) || nextIntId(next),
          name: String(patched.name || "").trim(),
          specialty: String(patched.specialty || "").trim() || "دندانپزشکی عمومی",
          specialtyId: patched.specialtyId?.trim() || "general",
          medicalCouncilNumber: String(patched.medicalCouncilNumber || "").trim(),
          image: String(patched.image || "").trim() || "/uploads/placeholder.svg",
          status: patched.status || "available",
        };
      })
      .filter((item) => item.name && item.days.length > 0);
    if (cleaned.length === 0) {
      throw new Error(
        next.filter((item) => item.name).length > 0
          ? "هیچ دندانپزشکی با روز و ساعت معتبر برای ذخیره باقی نماند."
          : "حداقل یک دندانپزشک با نام و برنامه حضور لازم است.",
      );
    }
    if (cleaned.length !== next.filter((item) => item.name).length) {
      throw new Error("برای هر دندانپزشک حداقل یک روز با ساعت معتبر لازم است.");
    }
    await putAdmin("/api/admin/content/dentists", { items: cleaned });
    await reloadDentists();
  }

  async function persistPhysicians(next: Physician[]) {
    const cleaned = next
      .map((item) => {
        const dayHours = dayHoursFromDentist(item);
        const patched = applyDayHoursToPhysician(item, dayHours);
        return {
          ...patched,
          id: Number(patched.id) || nextIntId(next),
          name: String(patched.name || "").trim(),
          specialty: String(patched.specialty || "").trim(),
          specialtyId: patched.specialtyId?.trim() || undefined,
          medicalCouncilNumber: String(patched.medicalCouncilNumber || "").trim(),
          image: String(patched.image || "").trim() || "/uploads/placeholder.svg",
          days: patched.days,
          hours: patched.hours || "",
          schedule: patched.schedule || {},
          dayHours,
          status: patched.status || "available",
        };
      })
      .filter((item) => item.name && item.specialty && item.days.length > 0);
    if (!cleaned.length) {
      throw new Error("حداقل یک متخصص با نام، تخصص و برنامه حضور لازم است.");
    }
    await putAdmin("/api/admin/content/physicians", { items: cleaned });
    await reloadPhysicians();
  }

  function saveDentists() {
    void persistDentists(dentists).catch((e) => setError(e instanceof Error ? e.message : "ذخیره ناموفق"));
  }

  function savePhysicians() {
    void persistPhysicians(physicians).catch((e) => setError(e instanceof Error ? e.message : "ذخیره ناموفق"));
  }

  function addDentist(e: FormEvent) {
    e.preventDefault();
    const specialtyId = dentistSpecialtyId.trim() || "general";
    const summary = summarizeDayHours(dentistDayHours);
    if (!summary.days.length) {
      setError("حداقل یک روز حضور با ساعت از–تا انتخاب کنید.");
      return;
    }
    const rangeError = validateDayHours(dentistDayHours);
    if (rangeError) {
      setError(rangeError);
      return;
    }
    void persistDentists([
      ...dentists,
      applyDayHoursToDentist(
        {
          id: nextIntId(dentists),
          name: dentistName.trim(),
          specialty: specialtyLabel(specialtyId),
          specialtyId,
          medicalCouncilNumber: dentistMedicalCouncilNumber.trim(),
          image: dentistImage.trim() || "/uploads/placeholder.svg",
          days: summary.days,
          hours: summary.hours,
          status: "available",
          schedule: {},
        },
        dentistDayHours,
      ),
    ])
      .then(() => {
        setDentistName("");
        setDentistSpecialtyId("general");
        setDentistMedicalCouncilNumber("");
        setDentistDayHours(defaultNewDayHours());
        setDentistImage("");
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "افزودن ناموفق"));
  }

  function addPhysician(e: FormEvent) {
    e.preventDefault();
    const summary = summarizeDayHours(physicianDayHours);
    if (!summary.days.length) {
      setError("حداقل یک روز حضور با ساعت از–تا انتخاب کنید.");
      return;
    }
    const rangeError = validateDayHours(physicianDayHours);
    if (rangeError) {
      setError(rangeError);
      return;
    }
    void persistPhysicians([
      ...physicians,
      applyDayHoursToPhysician(
        {
          id: nextIntId(physicians),
          name: physicianName.trim(),
          specialty: physicianSpecialty.trim(),
          specialtyId: physicianSpecialtyId.trim() || undefined,
          medicalCouncilNumber: physicianMedicalCouncilNumber.trim(),
          image: physicianImage.trim() || "/uploads/placeholder.svg",
          days: summary.days,
          hours: summary.hours,
          status: "available",
          schedule: {},
        },
        physicianDayHours,
      ),
    ])
      .then(() => {
        setPhysicianName("");
        setPhysicianSpecialty("");
        setPhysicianSpecialtyId("");
        setPhysicianMedicalCouncilNumber("");
        setPhysicianDayHours(defaultNewDayHours());
        setPhysicianImage("");
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "افزودن ناموفق"));
  }

  function updateDentist(index: number, patch: Partial<Dentist>) {
    setDentists((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updatePhysician(index: number, patch: Partial<Physician>) {
    setPhysicians((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function deleteDentist(index: number) {
    void persistDentists(dentists.filter((_, i) => i !== index)).catch((e) =>
      setError(e instanceof Error ? e.message : "حذف ناموفق"),
    );
  }

  function deletePhysician(index: number) {
    void persistPhysicians(physicians.filter((_, i) => i !== index)).catch((e) =>
      setError(e instanceof Error ? e.message : "حذف ناموفق"),
    );
  }

  function resetDentists() {
    void persistDentists(
      PASTEUR_DATA.dentists.map((d) => ({ ...d, days: [...d.days], schedule: { ...d.schedule } })),
    ).catch((e) => setError(e instanceof Error ? e.message : "بازنشانی ناموفق"));
  }

  function resetPhysicians() {
    void persistPhysicians(PASTEUR_DATA.physicians.map((p) => ({ ...p, days: [...p.days] }))).catch((e) =>
      setError(e instanceof Error ? e.message : "بازنشانی ناموفق"),
    );
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["dentists", "دندانپزشکان (رزرو)"],
            ["physicians", "متخصصین پزشکی"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-full border-2 px-4 py-2 text-sm font-bold transition",
              tab === key
                ? "border-teal-500 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "dentists" ? (
        <>
          <Card hover={false} className="bg-white p-6">
            <h2 className="mb-4 font-bold">افزودن دندانپزشک</h2>
            <form onSubmit={addDentist} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormInput
                value={dentistName}
                onChange={(e) => setDentistName(e.target.value)}
                placeholder="نام مثل دکتر علی رضایی"
                required
              />
              <FormSelect
                value={dentistSpecialtyId}
                onChange={(e) => setDentistSpecialtyId(e.target.value)}
              >
                {DENTAL_SPECIALTY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </FormSelect>
              <FormInput
                value={dentistMedicalCouncilNumber}
                onChange={(e) => setDentistMedicalCouncilNumber(e.target.value)}
                placeholder="شماره نظام پزشکی"
                className="md:col-span-2"
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2">
                <p className="mb-2 text-sm font-bold text-slate-800">روز و ساعت حضور (جدا برای هر روز)</p>
                <DayHoursEditor value={dentistDayHours} onChange={setDentistDayHours} />
              </div>
              <ImageUploadField value={dentistImage} onChange={setDentistImage} className="md:col-span-2" />
              <Button type="submit" className="md:col-span-2">
                افزودن
              </Button>
            </form>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">لیست دندانپزشکان</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetDentists}
                className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white"
              >
                بازنشانی به پیش‌فرض
              </button>
              <Button type="button" onClick={saveDentists}>
                ذخیره تغییرات
              </Button>
            </div>
          </div>

          <AdminTable
            headers={["نام", "تخصص", "نظام پزشکی", "روز / ساعت", "وضعیت", "تصویر", "عملیات"]}
            empty="دندانپزشکی ثبت نشده."
          >
            {dentists.map((d, index) => (
              <tr key={d.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3">
                  <FormInput
                    className="text-xs"
                    value={d.name}
                    onChange={(e) => updateDentist(index, { name: e.target.value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <FormSelect
                    className="text-xs"
                    value={d.specialtyId || "general"}
                    onChange={(e) => {
                      const specialtyId = e.target.value;
                      updateDentist(index, {
                        specialtyId,
                        specialty: specialtyLabel(specialtyId),
                      });
                    }}
                  >
                    {DENTAL_SPECIALTY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </FormSelect>
                </td>
                <td className="px-4 py-3">
                  <FormInput
                    className="text-xs"
                    value={d.medicalCouncilNumber || ""}
                    onChange={(e) => updateDentist(index, { medicalCouncilNumber: e.target.value })}
                    placeholder="شماره نظام"
                  />
                </td>
                <td className="px-4 py-3">
                  <DayHoursEditor
                    compact
                    value={dayHoursFromDentist(d)}
                    onChange={(dayHours) => updateDentist(index, applyDayHoursToDentist(d, dayHours))}
                  />
                  <p className="mt-2 text-[0.7rem] text-slate-500">{d.hours}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={d.status}
                    onChange={(e) =>
                      updateDentist(index, {
                        status: e.target.value as Dentist["status"],
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <ImageUploadField
                    value={d.image}
                    onChange={(path) => updateDentist(index, { image: path })}
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => deleteDentist(index)}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </AdminTable>
        </>
      ) : (
        <>
          <Card hover={false} className="bg-white p-6">
            <h2 className="mb-4 font-bold">افزودن متخصص پزشکی</h2>
            <form onSubmit={addPhysician} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormInput
                value={physicianName}
                onChange={(e) => setPhysicianName(e.target.value)}
                placeholder="نام"
                required
              />
              <FormInput
                value={physicianSpecialty}
                onChange={(e) => setPhysicianSpecialty(e.target.value)}
                placeholder="تخصص — قلب و عروق"
                required
              />
              <FormInput
                value={physicianSpecialtyId}
                onChange={(e) => setPhysicianSpecialtyId(e.target.value)}
                placeholder="شناسه تخصص (اختیاری) — cardiology"
              />
              <FormInput
                value={physicianMedicalCouncilNumber}
                onChange={(e) => setPhysicianMedicalCouncilNumber(e.target.value)}
                placeholder="شماره نظام پزشکی"
              />
              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-bold text-slate-600">روز و ساعت حضور</p>
                <DayHoursEditor value={physicianDayHours} onChange={setPhysicianDayHours} />
              </div>
              <ImageUploadField value={physicianImage} onChange={setPhysicianImage} className="md:col-span-2" />
              <Button type="submit" className="md:col-span-2">
                افزودن
              </Button>
            </form>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">لیست متخصصین</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetPhysicians}
                className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white"
              >
                بازنشانی به پیش‌فرض
              </button>
              <Button type="button" onClick={savePhysicians}>
                ذخیره تغییرات
              </Button>
            </div>
          </div>

          <AdminTable headers={["نام", "تخصص", "شناسه", "نظام پزشکی", "روز / ساعت", "وضعیت", "تصویر", "عملیات"]} empty="متخصصی ثبت نشده.">
            {physicians.map((p, index) => (
              <tr key={p.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3">
                  <FormInput
                    className="text-xs"
                    value={p.name}
                    onChange={(e) => updatePhysician(index, { name: e.target.value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <FormInput
                    className="text-xs"
                    value={p.specialty}
                    onChange={(e) => updatePhysician(index, { specialty: e.target.value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <FormInput
                    className="text-xs"
                    value={p.specialtyId || ""}
                    onChange={(e) => updatePhysician(index, { specialtyId: e.target.value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <FormInput
                    className="text-xs"
                    value={p.medicalCouncilNumber || ""}
                    onChange={(e) => updatePhysician(index, { medicalCouncilNumber: e.target.value })}
                    placeholder="شماره نظام"
                  />
                </td>
                <td className="px-4 py-3">
                  <DayHoursEditor
                    compact
                    value={dayHoursFromDentist(p)}
                    onChange={(dayHours) => updatePhysician(index, applyDayHoursToPhysician(p, dayHours))}
                  />
                  <p className="mt-2 text-[0.7rem] text-slate-500">{p.hours}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    onChange={(e) =>
                      updatePhysician(index, {
                        status: e.target.value as Physician["status"],
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <ImageUploadField
                    value={p.image}
                    onChange={(path) => updatePhysician(index, { image: path })}
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => deletePhysician(index)}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </AdminTable>
        </>
      )}
    </div>
  );
}
