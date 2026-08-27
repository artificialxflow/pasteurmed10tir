"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel } from "@/components/ui/Card";
import { DraftNumberInput } from "@/components/ui/DraftNumberInput";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import {
  PASTEUR_DATA,
  type ConsultationType,
  type SpecialtyTariffs,
} from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

export default function AdminConsultationPricesPage() {
  const [types, setTypes] = useState<ConsultationType[]>([]);
  const [tariffs, setTariffs] = useState<SpecialtyTariffs>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newId, setNewId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("💬");
  const [newPrice, setNewPrice] = useState("");

  const reload = useCallback(async () => {
    const data = await fetchAdmin<{
      consultationTypes: ConsultationType[];
      specialtyTariffs: SpecialtyTariffs;
    }>("/api/admin/content/consultation-pricing");
    setTypes(data.consultationTypes.map((type) => ({ ...type })));
    setTariffs({ ...data.specialtyTariffs });
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  function updateType(index: number, priceNum: number) {
    setTypes((prev) =>
      prev.map((type, i) =>
        i === index
          ? {
              ...type,
              priceNum,
              price: `${priceNum.toLocaleString("fa-IR")} تومان`,
            }
          : type,
      ),
    );
  }

  function updateTariff(specialtyId: string, typeId: string, priceNum: number) {
    setTariffs((prev) => ({
      ...prev,
      [specialtyId]: {
        ...(prev[specialtyId] || {}),
        [typeId]: priceNum,
      },
    }));
  }

  function saveAll() {
    setSuccess("");
    void putAdmin("/api/admin/content/consultation-pricing", {
      consultationTypes: types.map((type) => ({
        ...type,
        priceNum: Number(type.priceNum || 0),
      })),
      specialtyTariffs: tariffs,
    })
      .then(() => reload())
      .then(() => setSuccess("قیمت‌ها ذخیره شد."))
      .catch((e) => setError(e instanceof Error ? e.message : "ذخیره ناموفق"));
  }

  function seedDefaultTypes() {
    setSuccess("");
    void putAdmin("/api/admin/content/consultation-pricing", {
      consultationTypes: PASTEUR_DATA.consultationTypes.map((t) => ({ ...t })),
      specialtyTariffs: tariffs,
    })
      .then(() => reload())
      .then(() => setSuccess("انواع پیش‌فرض مشاوره ایجاد شد."))
      .catch((e) => setError(e instanceof Error ? e.message : "ایجاد ناموفق"));
  }

  function resetDefaults() {
    setSuccess("");
    void putAdmin("/api/admin/content/consultation-pricing", {
      consultationTypes: PASTEUR_DATA.consultationTypes.map((t) => ({ ...t })),
      specialtyTariffs: { ...PASTEUR_DATA.specialtyTariffs },
    })
      .then(() => reload())
      .then(() => setSuccess("همه قیمت‌ها به پیش‌فرض بازگشت."))
      .catch((e) => setError(e instanceof Error ? e.message : "بازنشانی ناموفق"));
  }

  function addType() {
    const id = newId.trim().toLowerCase().replace(/\s+/g, "-");
    const label = newLabel.trim();
    const priceNum = Number(newPrice || 0);
    if (!id || !label) {
      setError("شناسه و عنوان نوع مشاوره الزامی است.");
      return;
    }
    if (types.some((t) => t.id === id)) {
      setError("این شناسه قبلاً ثبت شده است.");
      return;
    }
    setTypes((prev) => [
      ...prev,
      {
        id,
        label,
        emoji: newEmoji.trim() || "💬",
        desc: "",
        priceNum,
        price: `${priceNum.toLocaleString("fa-IR")} تومان`,
      },
    ]);
    setNewId("");
    setNewLabel("");
    setNewEmoji("💬");
    setNewPrice("");
    setError("");
    setSuccess("نوع به لیست اضافه شد — برای ذخیره دائمی «ذخیره قیمت‌ها» را بزنید.");
  }

  const hasTypes = types.length > 0;

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-teal-700">{success}</p> : null}

      {!hasTypes ? (
        <Card hover={false} className="border-amber-200 bg-amber-50/80 p-5">
          <p className="font-bold text-amber-900">انواع مشاوره تعریف نشده</p>
          <p className="mt-2 text-sm leading-7 text-amber-900/90">
            پس از wipe دیتابیس، جدول <strong>ConsultationType</strong> خالی است. برای فعال‌سازی
            فرم مشاوره، انواع پیش‌فرض را ایجاد کنید یا نوع جدید اضافه کنید.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={seedDefaultTypes}>
              ایجاد انواع پیش‌فرض
            </Button>
          </div>
        </Card>
      ) : null}

      <div>
        <h2 className="mb-4 text-lg font-bold">قیمت پایه انواع مشاوره</h2>
        <AdminTable headers={["نوع", "شناسه", "قیمت (تومان)", "نمایش"]} empty="نوعی ثبت نشده.">
          {types.map((type, index) => (
            <tr key={type.id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                {type.emoji} {type.label}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{type.id}</td>
              <td className="px-4 py-3">
                <DraftNumberInput
                  min={0}
                  max={100_000_000}
                  value={Number(type.priceNum || 0)}
                  onCommit={(priceNum) => updateType(index, priceNum)}
                  className="max-w-[160px]"
                />
              </td>
              <td className="px-4 py-3">{formatPrice(Number(type.priceNum || 0))}</td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <Card hover={false} className="max-w-xl p-5">
        <h3 className="mb-3 font-bold">افزودن نوع مشاوره</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FormLabel>شناسه (انگلیسی)</FormLabel>
            <FormInput
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="مثلاً video"
            />
          </div>
          <div>
            <FormLabel>عنوان</FormLabel>
            <FormInput
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="مثلاً ویزیت ویدیویی"
            />
          </div>
          <div>
            <FormLabel>ایموجی</FormLabel>
            <FormInput value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} />
          </div>
          <div>
            <FormLabel>قیمت پایه (تومان)</FormLabel>
            <FormInput
              type="number"
              min={0}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </div>
        </div>
        <Button type="button" className="mt-4 text-sm" onClick={addType}>
          افزودن به لیست
        </Button>
      </Card>

      {hasTypes ? (
        <div>
          <h2 className="mb-4 text-lg font-bold">تعرفه تخصص × نوع ویزیت</h2>
          <Card hover={false} className="overflow-x-auto p-0">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-right">
                <tr>
                  <th className="px-4 py-3 font-bold">تخصص</th>
                  {types.map((type) => (
                    <th key={type.id} className="px-4 py-3 font-bold">
                      {type.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PASTEUR_DATA.medicalSpecialties.map((specialty) => (
                  <tr key={String(specialty.id)} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold">{specialty.name}</td>
                    {types.map((type) => (
                      <td key={type.id} className="px-4 py-3">
                        <DraftNumberInput
                          min={0}
                          max={100_000_000}
                          value={Number(tariffs[String(specialty.id)]?.[type.id] || 0)}
                          onCommit={(priceNum) =>
                            updateTariff(String(specialty.id), type.id, priceNum)
                          }
                          className="min-w-[120px]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        <Card hover={false} className="border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          پس از تعریف حداقل یک نوع مشاوره، جدول تعرفه تخصصی نمایش داده می‌شود.
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={saveAll} disabled={!hasTypes}>
          ذخیره قیمت‌ها
        </Button>
        <Button variant="outline" onClick={resetDefaults} disabled={!hasTypes}>
          بازگشت به پیش‌فرض (قیمت + تعرفه)
        </Button>
        {!hasTypes ? (
          <Button variant="outline" onClick={seedDefaultTypes}>
            ایجاد انواع پیش‌فرض
          </Button>
        ) : null}
      </div>
    </div>
  );
}
