"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel } from "@/components/ui/Card";
import { fetchAdminCommerce, putAdminCommerce } from "@/lib/commerce/client";
import { type Visitor } from "@/lib/data";
import { FormEvent, useEffect, useState } from "react";

export default function AdminVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [rateClinical, setRateClinical] = useState("5");
  const [rateShop, setRateShop] = useState("5");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function reload() {
    void fetchAdminCommerce<{ items: Visitor[] }>("/api/admin/commerce/visitors")
      .then((data) => setVisitors(data.items.map((v) => ({ ...v }))))
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    reload();
  }, []);

  function persist(next: Visitor[], successMsg?: string) {
    void putAdminCommerce<{ items: Visitor[] }>("/api/admin/commerce/visitors", { items: next })
      .then((data) => {
        setVisitors(data.items.map((v) => ({ ...v })));
        if (successMsg) setSuccess(successMsg);
      })
      .catch((e: Error) => setError(e.message));
  }

  function validateRate(value: string): number | null {
    if (value.trim() === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 100) return null;
    return n;
  }

  function addVisitor(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const clinical = validateRate(rateClinical);
    const shop = validateRate(rateShop);
    if (!trimmedName || !trimmedCode) {
      setError("نام و کد معرف الزامی است.");
      return;
    }
    if (clinical === null || shop === null) {
      setError("درصد پورسانت بالینی و فروشگاه باید بین ۰ تا ۱۰۰ باشد.");
      return;
    }
    const nextId = Math.max(0, ...visitors.map((v) => Number(v.id) || 0)) + 1;
    persist(
      [
        ...visitors,
        {
          id: nextId,
          name: trimmedName,
          code: trimmedCode,
          phone: phone.trim(),
          commissionRate: clinical,
          commissionRateClinical: clinical,
          commissionRateShop: shop,
          status: "active",
        },
      ],
      `ویزیتور ${trimmedName} ثبت شد (بالینی ${clinical}٪ · فروشگاه ${shop}٪).`,
    );
    setName("");
    setCode("");
    setPhone("");
    setRateClinical("5");
    setRateShop("5");
  }

  function updateVisitorField(index: number, patch: Partial<Visitor>) {
    const next = visitors.map((v, i) => (i === index ? { ...v, ...patch } : v));
    setVisitors(next);
  }

  function saveVisitor(index: number) {
    const v = visitors[index];
    if (!v.name.trim() || !v.code.trim()) {
      setError("نام و کد معرف الزامی است.");
      return;
    }
    const clinical = Number(v.commissionRateClinical ?? v.commissionRate);
    const shop = Number(v.commissionRateShop ?? v.commissionRate);
    if (
      !Number.isFinite(clinical) ||
      clinical < 0 ||
      clinical > 100 ||
      !Number.isFinite(shop) ||
      shop < 0 ||
      shop > 100
    ) {
      setError("درصد پورسانت باید بین ۰ تا ۱۰۰ باشد.");
      return;
    }
    setError("");
    persist(
      visitors.map((item, i) =>
        i === index
          ? {
              ...item,
              name: item.name.trim(),
              code: item.code.trim().toUpperCase(),
              commissionRate: clinical,
              commissionRateClinical: clinical,
              commissionRateShop: shop,
            }
          : item,
      ),
      `ویزیتور ${v.name.trim()} ذخیره شد.`,
    );
  }

  function toggleVisitor(index: number) {
    const next = visitors.map((v) => ({ ...v }));
    next[index].status = next[index].status === "active" ? "inactive" : "active";
    persist(next);
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-teal-700">{success}</p> : null}
      <Card hover={false} className="border-cyan-100 bg-cyan-50/60 p-4 text-sm leading-7 text-slate-700">
        دو نرخ جدا: <strong>بالینی</strong> (رزرو دندان/پزشکی · عضویت) و <strong>فروشگاه</strong>{" "}
        (VIP فروشگاه و سفارش‌های shop). جزئیات در صفحه پورسانت‌ها.
      </Card>

      <Card hover={false} className="max-w-xl p-6">
        <h2 className="mb-4 font-bold">افزودن ویزیتور / معرف</h2>
        <form onSubmit={addVisitor} className="space-y-3">
          <div>
            <FormLabel>نام ویزیتور</FormLabel>
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <FormLabel>کد معرف</FormLabel>
            <FormInput value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div>
            <FormLabel>شماره تماس</FormLabel>
            <FormInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>پورسانت بالینی (٪)</FormLabel>
              <FormInput
                type="number"
                value={rateClinical}
                onChange={(e) => setRateClinical(e.target.value)}
                min={0}
                max={100}
                required
              />
            </div>
            <div>
              <FormLabel>پورسانت فروشگاه (٪)</FormLabel>
              <FormInput
                type="number"
                value={rateShop}
                onChange={(e) => setRateShop(e.target.value)}
                min={0}
                max={100}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full text-sm">
            ثبت ویزیتور
          </Button>
        </form>
      </Card>

      <AdminTable
        headers={["نام", "کد", "تماس", "بالینی ٪", "فروشگاه ٪", "وضعیت", "عملیات"]}
        empty="ویزیتوری ثبت نشده است."
      >
        {visitors.map((v, i) => (
          <tr key={`${v.id}-${i}`} className="border-t border-slate-100">
            <td className="px-4 py-3">
              <FormInput
                value={v.name}
                onChange={(e) => updateVisitorField(i, { name: e.target.value })}
                className="min-w-[120px] py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                value={v.code}
                onChange={(e) => updateVisitorField(i, { code: e.target.value.toUpperCase() })}
                className="min-w-[100px] py-1 font-mono text-sm font-bold text-teal-700"
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                value={v.phone || ""}
                onChange={(e) => updateVisitorField(i, { phone: e.target.value })}
                className="min-w-[120px] py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                type="number"
                min={0}
                max={100}
                value={v.commissionRateClinical ?? v.commissionRate}
                onChange={(e) =>
                  updateVisitorField(i, {
                    commissionRateClinical: Number(e.target.value || 0),
                    commissionRate: Number(e.target.value || 0),
                  })
                }
                className="max-w-[80px] py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                type="number"
                min={0}
                max={100}
                value={v.commissionRateShop ?? v.commissionRate}
                onChange={(e) =>
                  updateVisitorField(i, { commissionRateShop: Number(e.target.value || 0) })
                }
                className="max-w-[80px] py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <AdminBadge tone={v.status === "active" ? "success" : "danger"}>
                {v.status === "active" ? "فعال" : "غیرفعال"}
              </AdminBadge>
            </td>
            <td className="space-x-2 space-x-reverse px-4 py-3">
              <button
                type="button"
                className="text-xs font-semibold text-cyan-800"
                onClick={() => saveVisitor(i)}
              >
                ذخیره
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-teal-700"
                onClick={() => toggleVisitor(i)}
              >
                {v.status === "active" ? "غیرفعال" : "فعال"}
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
