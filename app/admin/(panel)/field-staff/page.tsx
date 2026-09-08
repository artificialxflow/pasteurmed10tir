"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import { DraftNumberInput } from "@/components/ui/DraftNumberInput";
import { LocationPicker } from "@/components/home-visit/LocationPicker";
import { HOME_VISIT_SERVICE_AREAS, serviceAreaLabel } from "@/lib/home-visit/areas";
import { parseLatLng } from "@/lib/home-visit/geo";
import {
  FIELD_STAFF_KIND_OPTIONS,
  FIELD_STAFF_STATUS_OPTIONS,
  fieldStaffKindLabel,
  fieldStaffStatusLabel,
} from "@/lib/home-visit/labels";
import { staffGenderLabel } from "@/lib/home-visit/gender";
import type { FieldStaffAdmin } from "@/lib/home-visit/mappers";
import {
  deleteAdminOps,
  fetchAdminOps,
  patchAdminOps,
  postAdminOps,
} from "@/lib/operations/client";
import { FormEvent, useCallback, useEffect, useState } from "react";

const emptyForm = {
  name: "",
  kind: "nurse",
  phone: "",
  image: "",
  specialty: "",
  medicalCouncilNumber: "",
  gender: "",
  commissionPercent: 0,
  serviceAreas: [] as string[],
  status: "available",
  active: true,
  sortOrder: 0,
  latitude: null as number | null,
  longitude: null as number | null,
};

export default function AdminFieldStaffPage() {
  const [items, setItems] = useState<FieldStaffAdmin[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const data = await fetchAdminOps<{ items: FieldStaffAdmin[] }>("/api/admin/operations/field-staff");
    setItems(data.items);
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  function toggleArea(id: string) {
    setForm((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(id)
        ? prev.serviceAreas.filter((area) => area !== id)
        : [...prev.serviceAreas, id],
    }));
  }

  function startEdit(item: FieldStaffAdmin) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      kind: item.kind,
      phone: item.phone,
      image: item.image,
      specialty: item.specialty,
      medicalCouncilNumber: item.medicalCouncilNumber || "",
      gender: item.gender || "",
      commissionPercent: item.commissionPercent || 0,
      serviceAreas: [...item.serviceAreas],
      status: item.status,
      active: item.active,
      sortOrder: item.sortOrder,
      latitude: item.latitude,
      longitude: item.longitude,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (editingId) {
        await patchAdminOps(`/api/admin/operations/field-staff/${encodeURIComponent(editingId)}`, form);
      } else {
        await postAdminOps("/api/admin/operations/field-staff", form);
      }
      resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره ناموفق");
    } finally {
      setBusy(false);
    }
  }

  function onDelete(id: string) {
    if (!window.confirm("این نیرو حذف شود؟ درخواست‌های قبلی بدون نیرو می‌مانند.")) return;
    void deleteAdminOps(`/api/admin/operations/field-staff/${encodeURIComponent(id)}`)
      .then(() => reload())
      .catch((err) => setError(err instanceof Error ? err.message : "حذف ناموفق"));
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card hover={false} className="space-y-4 p-5">
        <p className="font-extrabold text-slate-900">
          {editingId ? "ویرایش نیرو" : "افزودن پرسنل میدانی"}
        </p>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormLabel>نام</FormLabel>
            <FormInput
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <FormLabel>نوع</FormLabel>
            <FormSelect
              value={form.kind}
              onChange={(e) => setForm((prev) => ({ ...prev, kind: e.target.value }))}
            >
              {FIELD_STAFF_KIND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </div>
          <div>
            <FormLabel>تخصص</FormLabel>
            <FormInput
              value={form.specialty}
              onChange={(e) => setForm((prev) => ({ ...prev, specialty: e.target.value }))}
              placeholder="مثلاً پرستاری عمومی یا داخلی"
            />
          </div>
          <div>
            <FormLabel>جنسیت</FormLabel>
            <FormSelect
              required
              value={form.gender}
              onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
            >
              <option value="">انتخاب کنید</option>
              <option value="male">آقا</option>
              <option value="female">خانم</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>شماره نظام پزشکی / پرستاری</FormLabel>
            <FormInput
              value={form.medicalCouncilNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, medicalCouncilNumber: e.target.value }))}
            />
          </div>
          <div>
            <FormLabel>پورسانت نیرو (٪)</FormLabel>
            <DraftNumberInput
              min={0}
              max={100}
              value={form.commissionPercent}
              onCommit={(commissionPercent) => setForm((prev) => ({ ...prev, commissionPercent }))}
            />
          </div>
          <div>
            <FormLabel>موبایل (فقط ادمین)</FormLabel>
            <FormInput
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div>
            <FormLabel>وضعیت</FormLabel>
            <FormSelect
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {FIELD_STAFF_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </div>
          <div>
            <FormLabel>ترتیب</FormLabel>
            <DraftNumberInput
              min={0}
              max={999}
              value={form.sortOrder}
              onCommit={(sortOrder) => setForm((prev) => ({ ...prev, sortOrder }))}
            />
          </div>
          <div className="sm:col-span-2">
            <FormLabel>عکس</FormLabel>
            <ImageUploadField
              value={form.image}
              onChange={(image) => setForm((prev) => ({ ...prev, image }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
            />
            فعال
          </label>
          <div className="sm:col-span-2">
            <FormLabel>مناطق پوشش</FormLabel>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {HOME_VISIT_SERVICE_AREAS.map((area) => (
                <label key={area.id} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.serviceAreas.includes(area.id)}
                    onChange={() => toggleArea(area.id)}
                  />
                  {area.label}
                </label>
              ))}
            </div>
          </div>
          <LocationPicker
            label="مختصات استقرار (اختیاری)"
            value={parseLatLng(form.latitude, form.longitude)}
            onChange={(next) =>
              setForm((prev) => ({
                ...prev,
                latitude: next?.lat ?? null,
                longitude: next?.lng ?? null,
              }))
            }
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {editingId ? "ذخیره تغییرات" : "افزودن نیرو"}
            </Button>
            {editingId ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                انصراف
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <AdminTable headers={["عکس", "نام", "نوع", "جنسیت", "نظام", "تخصص", "مناطق", "موقعیت", "وضعیت", "عملیات"]} empty="هنوز نیرویی ثبت نشده.">
        {items.map((item) => (
          <tr key={item.id} className="border-t border-slate-100">
            <td className="px-4 py-3">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                "—"
              )}
            </td>
            <td className="px-4 py-3 font-bold">{item.name}</td>
            <td className="px-4 py-3">{fieldStaffKindLabel(item.kind)}</td>
            <td className="px-4 py-3">{staffGenderLabel(item.gender)}</td>
            <td className="px-4 py-3 font-mono text-xs">{item.medicalCouncilNumber || "—"}</td>
            <td className="px-4 py-3">{item.specialty || "—"}</td>
            <td className="px-4 py-3 text-xs">
              {item.serviceAreas.length
                ? item.serviceAreas.map((id) => serviceAreaLabel(id)).join("، ")
                : "همه مناطق"}
            </td>
            <td className="px-4 py-3 text-xs">
              {item.latitude != null && item.longitude != null ? "ثبت شده" : "—"}
            </td>
            <td className="px-4 py-3">
              {item.active ? fieldStaffStatusLabel(item.status) : "غیرفعال"}
            </td>
            <td className="px-4 py-3">
              <button
                type="button"
                className="ml-3 text-xs font-semibold text-teal-700"
                onClick={() => startEdit(item)}
              >
                ویرایش
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-rose-700"
                onClick={() => onDelete(item.id)}
              >
                حذف
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
