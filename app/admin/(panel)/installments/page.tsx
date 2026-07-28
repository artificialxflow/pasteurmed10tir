"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { remainingInstallment, type InstallmentPlan } from "@/lib/patient";
import { PasteurStorage } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function AdminInstallmentsPage() {
  const [items, setItems] = useState<InstallmentPlan[]>([]);

  useEffect(() => {
    PasteurStorage.initPatientDomainIfNeeded();
    setItems(PasteurStorage.getInstallmentPlans());
  }, []);

  return (
    <AdminTable
      headers={["بیمار", "عنوان", "کل", "پرداخت‌شده", "مانده", "منبع"]}
      empty="طرح اقساطی نیست."
    >
      {items.map((p) => (
        <tr key={p.id} className="border-t border-slate-100">
          <td className="px-4 py-3">
            {p.patientName || "—"}
            <div className="text-xs text-slate-500">{p.phone}</div>
          </td>
          <td className="px-4 py-3">{p.title}</td>
          <td className="px-4 py-3">{formatPrice(p.totalAmount)}</td>
          <td className="px-4 py-3">{formatPrice(p.paidAmount)}</td>
          <td className="px-4 py-3">{formatPrice(remainingInstallment(p))}</td>
          <td className="px-4 py-3">{p.source}</td>
        </tr>
      ))}
    </AdminTable>
  );
}
