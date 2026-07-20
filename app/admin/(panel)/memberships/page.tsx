"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { PasteurStorage, type Member } from "@/lib/storage";
import { useEffect, useState } from "react";

type Application = Record<string, unknown> & {
  patientName?: string;
  planTitle?: string;
  tier?: string;
  tierLabel?: string;
  membershipDurationLabel?: string;
  validityLabel?: string;
  discountPercent?: number;
  amountRial?: number;
  referralCode?: string;
  visitorName?: string;
  phone?: string;
};

export default function AdminMembershipsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    setMembers(PasteurStorage.getMembers());
    setApplications(PasteurStorage.getMembershipApplications() as Application[]);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-lg font-bold">اعضا و پرداخت‌ها</h2>
        <AdminTable
          headers={["نام", "طرح", "مدت عضویت", "مبلغ", "وضعیت پرداخت"]}
          empty="هنوز عضوی ثبت نشده است."
        >
          {members.map((m) => (
            <tr key={m.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{m.patientName}</td>
              <td className="px-4 py-3">{m.planName}</td>
              <td className="px-4 py-3">
                {m.membershipDurationLabel || m.validityLabel || "—"}
              </td>
              <td className="px-4 py-3">{(m.amount || 0).toLocaleString("fa-IR")}</td>
              <td className="px-4 py-3">
                <AdminBadge tone={m.status === "paid" ? "success" : "warn"}>
                  {m.status === "paid" ? "موفق" : "در انتظار"}
                </AdminBadge>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">فرم‌های پیشنهاد صدور عضویت</h2>
        <AdminTable
          headers={[
            "مشتری",
            "طرح",
            "پوشش",
            "مدت عضویت",
            "مبلغ",
            "کد معرف",
            "نماینده",
            "تماس",
          ]}
          empty="فرم عضویتی ثبت نشده است."
        >
          {applications.map((app, index) => (
            <tr key={index} className="border-t border-slate-100">
              <td className="px-4 py-3">{String(app.patientName || "—")}</td>
              <td className="px-4 py-3">{String(app.planTitle || "—")}</td>
              <td className="px-4 py-3">
                <AdminBadge tone={app.tier === "vip" ? "warn" : "success"}>
                  {String(app.tierLabel || "—")}
                </AdminBadge>
              </td>
              <td className="px-4 py-3">
                {String(app.membershipDurationLabel || app.validityLabel || "—")}
                {app.discountPercent ? (
                  <>
                    <br />
                    <span className="text-xs text-amber-700">
                      تخفیف {Number(app.discountPercent).toLocaleString("fa-IR")}٪
                    </span>
                  </>
                ) : null}
              </td>
              <td className="px-4 py-3">
                {(Number(app.amountRial) || 0).toLocaleString("fa-IR")} ریال
              </td>
              <td className="px-4 py-3 font-mono">{String(app.referralCode || "—")}</td>
              <td className="px-4 py-3">{String(app.visitorName || "—")}</td>
              <td className="px-4 py-3">{String(app.phone || "—")}</td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">طرح‌های عضویت</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PASTEUR_DATA.memberships.map((m) => (
            <Card key={m.id} hover={false} className="p-4">
              <h3 className="font-bold">{m.name}</h3>
              <p className="my-2 font-bold text-teal-700">{m.price} تومان</p>
              <p className="mb-2 text-xs font-bold text-slate-500">
                بازپرداخت وام: {m.loanTermLabel || "—"}
              </p>
              <p className="text-xs text-slate-500">{m.terms}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
