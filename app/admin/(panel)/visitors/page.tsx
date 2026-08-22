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
  const [rate, setRate] = useState("");
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
    const commissionRate = validateRate(rate);
    if (!trimmedName || !trimmedCode) {
      setError("نام و کد معرف الزامی است.");
      return;
    }
    if (commissionRate === null) {
      setError("درصد پورسانت باید بین ۰ تا ۱۰۰ باشد.");
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
          commissionRate,
          status: "active",
        },
      ],
      `ویزیتور ${trimmedName} با پورسانت ${commissionRate}٪ ثبت شد.`,
    );
    setName("");
    setCode("");
    setPhone("");
    setRate("");
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
    const rateNum = Number(v.commissionRate);
    if (!Number.isFinite(rateNum) || rateNum < 0 || rateNum > 100) {
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
              commissionRate: rateNum,
            }
          : item,
      ),
      `ویزیتور ${v.name.trim()} با پورسانت ${rateNum}٪ ذخیره شد.`,
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
        درصد پورسانت روی <strong>مبلغ تراکنش معرف‌شده</strong> اعمال می‌شود (رزرو = مبلغ درگاه؛ عضویت =
        حق عضویت). جزئیات در صفحه پورسانت‌ها.
      </Card>

      <Card hover={false} className="max-w-xl p-6">
        <h2 className="mb-4 font-bold">افزودن ویزیتور / معرف</h2>
        <form onSubmit={addVisitor} className="space-y-3">
          <div>
            <FormLabel>نام ویزیتور</FormLabel>
            <FormInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام کامل"
              required
            />
          </div>
          <div>
            <FormLabel>کد معرف</FormLabel>
            <FormInput
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="مثل PLUS300"
              required
            />
          </div>
          <div>
            <FormLabel>شماره تماس</FormLabel>
            <FormInput
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxxx"
            />
          </div>
          <div>
            <FormLabel>درصد پورسانت (٪)</FormLabel>
            <FormInput
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="مثلاً ۵"
              min={0}
              max={100}
              required
            />
          </div>
          <Button type="submit" className="w-full text-sm">
            ثبت ویزیتور
          </Button>
        </form>
      </Card>

      <AdminTable
        headers={["نام", "کد معرف", "تماس", "پورسانت (٪)", "وضعیت", "عملیات"]}
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
                value={v.commissionRate}
                onChange={(e) =>
                  updateVisitorField(i, { commissionRate: Number(e.target.value || 0) })
                }
                className="max-w-[80px] py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <AdminBadge tone={v.status === "active" ? "success" : "danger"}>
                {v.status === "active" ? "فعال" : "غیرفعال"}
              </AdminBadge>
            </td>
            <td className="px-4 py-3 space-x-2 space-x-reverse">
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
