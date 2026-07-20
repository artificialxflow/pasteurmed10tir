"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput } from "@/components/ui/Card";
import { type Visitor } from "@/lib/data";
import { PasteurStorage } from "@/lib/storage";
import { FormEvent, useEffect, useState } from "react";

export default function AdminVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [rate, setRate] = useState("5");

  function reload() {
    setVisitors(PasteurStorage.getVisitors().map((v) => ({ ...v })));
  }

  useEffect(() => {
    reload();
  }, []);

  function addVisitor(e: FormEvent) {
    e.preventDefault();
    const next = [
      ...PasteurStorage.getVisitors(),
      {
        id: Date.now(),
        name: name.trim(),
        code: code.trim().toUpperCase(),
        phone: phone.trim(),
        commissionRate: Number(rate || 0),
        status: "active" as const,
      },
    ];
    PasteurStorage.saveVisitors(next);
    setName("");
    setCode("");
    setPhone("");
    setRate("5");
    reload();
  }

  function toggleVisitor(index: number) {
    const next = PasteurStorage.getVisitors().map((v) => ({ ...v }));
    next[index].status = next[index].status === "active" ? "inactive" : "active";
    PasteurStorage.saveVisitors(next);
    reload();
  }

  return (
    <div className="space-y-8">
      <AdminTable
        headers={["نام", "کد معرف", "تماس", "پورسانت", "وضعیت", "عملیات"]}
        empty="ویزیتوری ثبت نشده است."
      >
        {visitors.map((v, i) => (
          <tr key={`${v.id}-${i}`} className="border-t border-slate-100">
            <td className="px-4 py-3">{v.name}</td>
            <td className="px-4 py-3 font-mono font-bold text-teal-700">{v.code}</td>
            <td className="px-4 py-3">{v.phone || "—"}</td>
            <td className="px-4 py-3">{v.commissionRate}%</td>
            <td className="px-4 py-3">
              <AdminBadge tone={v.status === "active" ? "success" : "danger"}>
                {v.status === "active" ? "فعال" : "غیرفعال"}
              </AdminBadge>
            </td>
            <td className="px-4 py-3">
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

      <Card hover={false} className="max-w-xl p-6">
        <h2 className="mb-4 font-bold">افزودن ویزیتور / معرف</h2>
        <form onSubmit={addVisitor} className="space-y-3">
          <FormInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام ویزیتور"
            required
          />
          <FormInput
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="کد معرف مثل PLUS300"
            required
          />
          <FormInput
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="شماره تماس"
          />
          <FormInput
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="درصد پورسانت"
            min={0}
            max={100}
          />
          <Button type="submit" className="w-full text-sm">
            ثبت ویزیتور
          </Button>
        </form>
      </Card>
    </div>
  );
}
