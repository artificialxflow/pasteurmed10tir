"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput } from "@/components/ui/Card";
import { type Membership } from "@/lib/data";
import { formatToman } from "@/lib/membership";
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
  const [plans, setPlans] = useState<Membership[]>([]);

  function reloadPlans() {
    PasteurStorage.initMembershipPlansIfNeeded();
    setPlans(PasteurStorage.getMembershipPlans().map((p) => ({ ...p, features: [...p.features] })));
  }

  useEffect(() => {
    setMembers(PasteurStorage.getMembers());
    setApplications(PasteurStorage.getMembershipApplications() as Application[]);
    reloadPlans();
  }, []);

  function updatePlan(index: number, patch: Partial<Membership>) {
    setPlans((prev) =>
      prev.map((plan, i) => (i === index ? { ...plan, ...patch } : plan)),
    );
  }

  function savePlans() {
    const cleaned = plans.map((plan) => ({
      ...plan,
      loanLimit: Number(plan.loanLimit || 0),
      downPaymentPercent: Number(plan.downPaymentPercent || 0),
      loanTermLabel: String(plan.loanTermLabel || "").trim(),
    }));
    PasteurStorage.saveMembershipPlans(cleaned);
    reloadPlans();
  }

  function resetPlans() {
    PasteurStorage.resetMembershipPlans();
    reloadPlans();
  }

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">تنظیمات طرح‌های عضویت</h2>
          <button
            type="button"
            onClick={resetPlans}
            className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white"
          >
            بازنشانی به پیش‌فرض
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {plans.map((plan, index) => (
            <Card key={plan.id} hover={false} className="p-4">
              <h3 className="mb-3 font-bold">
                {plan.name} ({plan.id})
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs font-bold text-slate-500">مدت بازپرداخت وام</p>
                  <FormInput
                    value={plan.loanTermLabel || ""}
                    onChange={(e) => updatePlan(index, { loanTermLabel: e.target.value })}
                    placeholder="مثلاً ۱۵ ماهه"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold text-slate-500">سقف وام (تومان)</p>
                  <FormInput
                    type="number"
                    min={0}
                    value={plan.loanLimit ?? 0}
                    onChange={(e) =>
                      updatePlan(index, { loanLimit: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold text-slate-500">درصد پیش‌پرداخت</p>
                  <FormInput
                    type="number"
                    min={0}
                    max={100}
                    value={plan.downPaymentPercent ?? 0}
                    onChange={(e) =>
                      updatePlan(index, { downPaymentPercent: Number(e.target.value) })
                    }
                  />
                </div>
                <p className="text-xs text-slate-500">
                  حق عضویت: {plan.price} تومان — مثال پیش‌پرداخت برای ۵۰ میلیون:{" "}
                  {formatToman(Math.round(50000000 * (plan.downPaymentPercent || 0) / 100))}
                </p>
                <p className="text-xs text-slate-500">{plan.terms}</p>
              </div>
            </Card>
          ))}
        </div>
        <Button type="button" className="mt-4" onClick={savePlans}>
          ذخیره تنظیمات طرح‌ها
        </Button>
      </div>
    </div>
  );
}
