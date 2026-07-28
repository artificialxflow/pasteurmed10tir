"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel } from "@/components/ui/Card";
import type { InsuranceCompany, InsuranceInquiry } from "@/lib/patient";
import { PasteurStorage } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import { FormEvent, useEffect, useState } from "react";

export default function AdminInsurancesPage() {
  const [base, setBase] = useState<InsuranceCompany[]>([]);
  const [comp, setComp] = useState<InsuranceCompany[]>([]);
  const [inquiries, setInquiries] = useState<InsuranceInquiry[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"base" | "comp">("comp");

  function reload() {
    PasteurStorage.initPatientDomainIfNeeded();
    setBase(PasteurStorage.getBaseInsurances());
    setComp(PasteurStorage.getComplementaryInsurances());
    setInquiries(PasteurStorage.getInsuranceInquiries());
  }

  useEffect(() => {
    reload();
  }, []);

  function addCompany(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const item = { id: `ins-${Date.now().toString(36)}`, name: name.trim(), active: true };
    if (kind === "base") PasteurStorage.saveBaseInsurances([...base, item]);
    else PasteurStorage.saveComplementaryInsurances([...comp, item]);
    setName("");
    reload();
  }

  return (
    <div className="space-y-8">
      <Card hover={false} className="p-5">
        <h2 className="mb-3 font-extrabold">افزودن شرکت بیمه</h2>
        <form onSubmit={addCompany} className="flex flex-wrap gap-3">
          <FormInput
            className="max-w-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام بیمه"
            required
          />
          <select
            className="rounded-xl border border-sky-200 px-3 py-2 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as "base" | "comp")}
          >
            <option value="comp">تکمیلی</option>
            <option value="base">پایه</option>
          </select>
          <Button type="submit" className="text-sm">
            افزودن
          </Button>
        </form>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <FormLabel>پایه</FormLabel>
            <ul className="space-y-1 text-sm">
              {base.map((i) => (
                <li key={i.id}>{i.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <FormLabel>تکمیلی</FormLabel>
            <ul className="space-y-1 text-sm">
              {comp.map((i) => (
                <li key={i.id}>{i.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-extrabold">درخواست‌های استعلام</h2>
        <AdminTable headers={["بیمار", "موبایل", "فرانشیز", "وضعیت", "عملیات"]} empty="استعلامی نیست.">
          {inquiries.map((inq) => (
            <tr key={inq.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{inq.patientName || "—"}</td>
              <td className="px-4 py-3">{inq.phone}</td>
              <td className="px-4 py-3">{formatPrice(inq.franchiseAmount)}</td>
              <td className="px-4 py-3">
                <AdminBadge
                  tone={
                    inq.status === "approved"
                      ? "success"
                      : inq.status === "rejected"
                        ? "danger"
                        : "warn"
                  }
                >
                  {inq.status}
                </AdminBadge>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2 text-xs font-bold">
                  <button
                    type="button"
                    className="text-teal-700"
                    onClick={() => {
                      PasteurStorage.updateInsuranceInquiry(inq.id, "approved");
                      reload();
                    }}
                  >
                    تأیید
                  </button>
                  <button
                    type="button"
                    className="text-red-700"
                    onClick={() => {
                      PasteurStorage.updateInsuranceInquiry(inq.id, "rejected");
                      reload();
                    }}
                  >
                    رد
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}
