"use client";

import { Card } from "@/components/ui/Card";
import { getInstallmentsApi } from "@/lib/commerce/client";
import {
  formatJalaliDate,
  installmentSourceLabel,
  nextInstallmentDue,
  remainingInstallment,
  type InstallmentPlan,
} from "@/lib/patient";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";

export function InstallmentsPage({ variant = "web" }: { variant?: "web" | "app" }) {
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          setPhone(null);
          return;
        }
        const data = (await res.json()) as { user?: { phone?: string } };
        const p = data.user?.phone || null;
        setPhone(p);
        if (!p) return;
        const result = await getInstallmentsApi();
        setPlans(result.items as InstallmentPlan[]);
      })
      .catch((e: Error) => setError(e.message || "خطا در دریافت اقساط"));
  }, []);

  if (!phone) {
    return (
      <p className="py-10 text-center text-sm text-slate-600">
        برای مشاهده اقساط، ابتدا وارد پنل کاربری شوید.
      </p>
    );
  }

  return (
    <div className={variant === "app" ? "space-y-4" : "mx-auto max-w-2xl space-y-4 px-4 py-10"}>
      <h1 className="text-xl font-extrabold text-slate-900">اقساط من</h1>
      <p className="text-sm text-slate-600">
        مبلغ پرداخت‌شده، مانده و تاریخ سررسید بعدی — اعتبار و تسهیلات جداگانه
      </p>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {plans.map((plan) => {
        const remaining = remainingInstallment(plan);
        const nextDue = nextInstallmentDue(plan);
        return (
          <Card key={plan.id} hover={false} className="space-y-2 p-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-extrabold text-slate-900">{plan.title}</p>
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-bold text-cyan-800">
                {installmentSourceLabel(plan.source)}
              </span>
            </div>
            <p>کل: {formatPrice(plan.totalAmount)}</p>
            <p>پرداخت‌شده: {formatPrice(plan.paidAmount)}</p>
            <p className="font-bold text-teal-800">مانده: {formatPrice(remaining)}</p>
            <p>تعداد اقساط: {plan.installmentCount.toLocaleString("fa-IR")}</p>
            <p>سررسید بعدی: {formatJalaliDate(nextDue)}</p>
          </Card>
        );
      })}
      {!plans.length ? (
        <p className="text-center text-sm text-slate-500">
          هنوز طرح اقساطی فعالی ندارید. اقساط بسته اعتباری پس از فعال‌سازی اعتبار، و اقساط تسهیلات پس
          از تأیید وام در ادمین اینجا دیده می‌شود.
        </p>
      ) : null}
    </div>
  );
}
