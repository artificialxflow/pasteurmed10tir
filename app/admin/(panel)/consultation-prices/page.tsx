"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput } from "@/components/ui/Card";
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
    void putAdmin("/api/admin/content/consultation-pricing", {
      consultationTypes: types.map((type) => ({
        ...type,
        priceNum: Number(type.priceNum || 0),
      })),
      specialtyTariffs: tariffs,
    })
      .then(() => reload())
      .catch((e) => setError(e instanceof Error ? e.message : "ذخیره ناموفق"));
  }

  function resetDefaults() {
    void putAdmin("/api/admin/content/consultation-pricing", {
      consultationTypes: PASTEUR_DATA.consultationTypes.map((t) => ({ ...t })),
      specialtyTariffs: { ...PASTEUR_DATA.specialtyTariffs },
    })
      .then(() => reload())
      .catch((e) => setError(e instanceof Error ? e.message : "بازنشانی ناموفق"));
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
                <FormInput
                  type="number"
                  min={0}
                  value={type.priceNum || 0}
                  onChange={(e) => updateType(index, Number(e.target.value || 0))}
                  className="max-w-[160px]"
                />
              </td>
              <td className="px-4 py-3">{formatPrice(Number(type.priceNum || 0))}</td>
            </tr>
          ))}
        </AdminTable>
      </div>

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
                      <FormInput
                        type="number"
                        min={0}
                        value={tariffs[String(specialty.id)]?.[type.id] || 0}
                        onChange={(e) =>
                          updateTariff(
                            String(specialty.id),
                            type.id,
                            Number(e.target.value || 0),
                          )
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

      <div className="flex flex-wrap gap-3">
        <Button onClick={saveAll}>ذخیره قیمت‌ها</Button>
        <Button variant="outline" onClick={resetDefaults}>
          بازگشت به پیش‌فرض
        </Button>
      </div>
    </div>
  );
}
