"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Card, FormInput } from "@/components/ui/Card";
import { daysToInput, parseDaysInput } from "@/lib/content/doctor-mappers";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import { PASTEUR_DATA, type Dentist, type Physician } from "@/lib/data";
import { cn } from "@/lib/utils";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Tab = "dentists" | "physicians";

const STATUS_OPTIONS = [
  { value: "available", label: "در دسترس" },
  { value: "busy", label: "مشغول" },
  { value: "inactive", label: "غیرفعال" },
] as const;

function nextIntId(items: { id: number }[]): number {
  const max = items.reduce((m, item) => (Number.isFinite(item.id) ? Math.max(m, item.id) : m), 0);
  return max + 1;
}

export default function AdminDoctorsPage() {
  const [tab, setTab] = useState<Tab>("dentists");
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [error, setError] = useState("");

  const [dentistName, setDentistName] = useState("");
  const [dentistSpecialty, setDentistSpecialty] = useState("دندانپزشکی عمومی");
  const [dentistDays, setDentistDays] = useState("");
  const [dentistHours, setDentistHours] = useState("۹ تا ۱۷");
  const [dentistImage, setDentistImage] = useState("");

  const [physicianName, setPhysicianName] = useState("");
  const [physicianSpecialty, setPhysicianSpecialty] = useState("");
  const [physicianSpecialtyId, setPhysicianSpecialtyId] = useState("");
  const [physicianDays, setPhysicianDays] = useState("");
  const [physicianImage, setPhysicianImage] = useState("");

  const reloadDentists = useCallback(async () => {
    const data = await fetchAdmin<{ items: Dentist[] }>("/api/admin/content/dentists");
    setDentists(data.items.map((d) => ({ ...d, days: [...(d.days || [])], schedule: { ...(d.schedule || {}) } })));
  }, []);

  const reloadPhysicians = useCallback(async () => {
    const data = await fetchAdmin<{ items: Physician[] }>("/api/admin/content/physicians");
    setPhysicians(data.items.map((p) => ({ ...p, days: [...(p.days || [])] })));
  }, []);

  useEffect(() => {
    void reloadDentists().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
    void reloadPhysicians().catch(() => {});
  }, [reloadDentists, reloadPhysicians]);

  async function persistDentists(next: Dentist[]) {
    const cleaned = next
      .map((item) => ({
        ...item,
        id: Number(item.id) || nextIntId(next),
        name: String(item.name || "").trim(),
        specialty: String(item.specialty || "").trim() || "دندانپزشکی عمومی",
        image: String(item.image || "").trim() || "/uploads/placeholder.svg",
        days: Array.isArray(item.days) ? item.days.filter(Boolean) : parseDaysInput(String(item.days || "")),
        hours: String(item.hours || "").trim() || "۹ تا ۱۷",
        status: item.status || "available",
        schedule: item.schedule || {},
      }))
      .filter((item) => item.name);
    await putAdmin("/api/admin/content/dentists", { items: cleaned });
    await reloadDentists();
  }

  async function persistPhysicians(next: Physician[]) {
    const cleaned = next
      .map((item) => ({
        ...item,
        id: Number(item.id) || nextIntId(next),
        name: String(item.name || "").trim(),
        specialty: String(item.specialty || "").trim(),
        specialtyId: item.specialtyId?.trim() || undefined,
        image: String(item.image || "").trim() || "/uploads/placeholder.svg",
        days: Array.isArray(item.days) ? item.days.filter(Boolean) : parseDaysInput(String(item.days || "")),
        status: item.status || "available",
      }))
      .filter((item) => item.name && item.specialty);
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
    void persistDentists([
      ...dentists,
      {
        id: nextIntId(dentists),
        name: dentistName.trim(),
        specialty: dentistSpecialty.trim() || "دندانپزشکی عمومی",
        image: dentistImage.trim() || "/uploads/placeholder.svg",
        days: parseDaysInput(dentistDays),
        hours: dentistHours.trim() || "۹ تا ۱۷",
        status: "available",
        schedule: {},
      },
    ])
      .then(() => {
        setDentistName("");
        setDentistSpecialty("دندانپزشکی عمومی");
        setDentistDays("");
        setDentistHours("۹ تا ۱۷");
        setDentistImage("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "افزودن ناموفق"));
  }

  function addPhysician(e: FormEvent) {
    e.preventDefault();
    void persistPhysicians([
      ...physicians,
      {
        id: nextIntId(physicians),
        name: physicianName.trim(),
        specialty: physicianSpecialty.trim(),
        specialtyId: physicianSpecialtyId.trim() || undefined,
        image: physicianImage.trim() || "/uploads/placeholder.svg",
        days: parseDaysInput(physicianDays),
        status: "available",
      },
    ])
      .then(() => {
        setPhysicianName("");
        setPhysicianSpecialty("");
        setPhysicianSpecialtyId("");
        setPhysicianDays("");
        setPhysicianImage("");
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
    void persistDentists(PASTEUR_DATA.dentists.map((d) => ({ ...d, days: [...d.days], schedule: { ...d.schedule } }))).catch(
      (e) => setError(e instanceof Error ? e.message : "بازنشانی ناموفق"),
    );
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
              <FormInput
                value={dentistSpecialty}
                onChange={(e) => setDentistSpecialty(e.target.value)}
                placeholder="تخصص"
              />
              <FormInput
                value={dentistDays}
                onChange={(e) => setDentistDays(e.target.value)}
                placeholder="روزها — شنبه، دوشنبه، ..."
                className="md:col-span-2"
              />
              <FormInput
                value={dentistHours}
                onChange={(e) => setDentistHours(e.target.value)}
                placeholder="ساعات — ۹ تا ۱۷"
              />
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
            headers={["نام", "تخصص", "روزها", "ساعات", "وضعیت", "تصویر", "عملیات"]}
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
                  <FormInput
                    className="text-xs"
                    value={d.specialty}
                    onChange={(e) => updateDentist(index, { specialty: e.target.value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <FormInput
                    className="text-xs"
                    value={daysToInput(d.days || [])}
                    onChange={(e) => updateDentist(index, { days: parseDaysInput(e.target.value) })}
                  />
                </td>
                <td className="px-4 py-3">
                  <FormInput
                    className="text-xs"
                    value={d.hours || ""}
                    onChange={(e) => updateDentist(index, { hours: e.target.value })}
                  />
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
                value={physicianDays}
                onChange={(e) => setPhysicianDays(e.target.value)}
                placeholder="روزها — شنبه، سه‌شنبه"
              />
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

          <AdminTable headers={["نام", "تخصص", "روزها", "وضعیت", "تصویر", "عملیات"]} empty="متخصصی ثبت نشده.">
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
                    value={daysToInput(p.days || [])}
                    onChange={(e) => updatePhysician(index, { days: parseDaysInput(e.target.value) })}
                  />
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
