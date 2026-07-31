"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import {
  patientStatusLabel,
  resolveFranchisePercent,
  type PatientProfile,
  type PatientStatus,
} from "@/lib/patient";
import { PasteurStorage } from "@/lib/storage";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminPatientsPage() {
  const [items, setItems] = useState<PatientProfile[]>([]);

  function reload() {
    PasteurStorage.initPatientDomainIfNeeded();
    setItems(
      PasteurStorage.listPatientProfiles().sort((a, b) =>
        String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
      ),
    );
  }

  useEffect(() => {
    reload();
  }, []);

  function setStatus(phone: string, status: PatientStatus) {
    PasteurStorage.setPatientStatus(phone, status);
    reload();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-slate-600">
        این صف معادل «پنل کاربری» بیماران است: پروفایل، بیمه تکمیلی و درصد فرانشیز.
        پس از تأیید، همان درصد روی هزینه ویزیت (وب و اپ) اعمال می‌شود.{" "}
        <Link href="/admin/insurances" className="font-bold text-teal-700 underline-offset-2 hover:underline">
          استعلام بیمه پرداخت →
        </Link>
      </p>
      <AdminTable
        headers={["نام", "موبایل", "فرانشیز٪", "بیمه تکمیلی", "وضعیت", "عملیات"]}
        empty="هنوز پروفایل بیماری ثبت نشده است."
      >
        {items.map((p) => (
          <tr key={p.phone} className="border-t border-slate-100">
            <td className="px-4 py-3">{p.name}</td>
            <td className="px-4 py-3">{p.phone}</td>
            <td className="px-4 py-3">{resolveFranchisePercent(p).toLocaleString("fa-IR")}٪</td>
            <td className="px-4 py-3">{p.complementaryInsuranceId || "—"}</td>
            <td className="px-4 py-3">
              <AdminBadge
                tone={
                  p.status === "approved" ? "success" : p.status === "rejected" ? "danger" : "warn"
                }
              >
                {patientStatusLabel(p.status)}
              </AdminBadge>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="text-xs"
                  onClick={() => setStatus(p.phone, "approved")}
                >
                  تأیید
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setStatus(p.phone, "rejected")}
                >
                  رد
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setStatus(p.phone, "pending")}
                >
                  در بررسی
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
