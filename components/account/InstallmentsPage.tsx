"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getInstallmentsApi, postPatientCommerce } from "@/lib/commerce/client";
import {
  formatJalaliDate,
  installmentSourceLabel,
  nextInstallmentDue,
  remainingInstallment,
  type InstallmentPlan,
  type InstallmentScheduleItem,
} from "@/lib/patient";
import { formatPrice } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

function itemStatusLabel(status: string): string {
  if (status === "paid") return "پرداخت‌شده";
  if (status === "overdue") return "معوقه";
  if (status === "due") return "سررسید امروز";
  if (status === "partial") return "پرداخت جزئی";
  return "در انتظار";
}

function itemStatusClass(status: string): string {
  if (status === "paid") return "bg-teal-50 text-teal-800";
  if (status === "overdue") return "bg-rose-50 text-rose-700";
  if (status === "due") return "bg-amber-50 text-amber-800";
  return "bg-slate-50 text-slate-600";
}

export function InstallmentsPage({ variant = "web" }: { variant?: "web" | "app" }) {
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const reload = useCallback(async () => {
    const result = await getInstallmentsApi();
    setPlans(result.items as InstallmentPlan[]);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") setMessage("پرداخت قسط با موفقیت ثبت شد.");
    if (params.get("paid") === "0") setError("پرداخت قسط ناموفق یا لغو شد.");

    void fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          setPhone(null);
          return;
        }
        const data = (await res.json()) as { profile?: { phone?: string } };
        const p = data.profile?.phone || null;
        setPhone(p);
        if (!p) return;
        await reload();
      })
      .catch((e: Error) => setError(e.message || "خطا در دریافت اقساط"));
  }, [reload]);

  async function payItem(plan: InstallmentPlan, item: InstallmentScheduleItem) {
    setError("");
    setMessage("");
    setPayingId(item.id);
    try {
      const data = await postPatientCommerce<{ redirectUrl?: string }>(
        "/api/commerce/installments/pay",
        {
          planId: plan.id,
          scheduleItemId: item.id,
          basePath: variant === "app" ? "/app/installments" : "/installments",
        },
      );
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setError("آدرس درگاه دریافت نشد.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "شروع پرداخت ناموفق");
    } finally {
      setPayingId(null);
    }
  }

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
        صورتحساب اقساط: لیست قسط‌به‌قسط، معوقه، تاریخچه واریزی و پرداخت آنلاین.
      </p>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-teal-700">{message}</p> : null}
      {plans.map((plan) => {
        const remaining = remainingInstallment(plan);
        const nextDue = nextInstallmentDue(plan);
        const items = plan.items || [];
        const payments = (plan.payments || []).filter((p) => p.status === "completed");
        const overdueAmount = plan.overdueAmount || 0;
        return (
          <Card key={plan.id} hover={false} className="space-y-4 p-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-extrabold text-slate-900">{plan.title}</p>
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-bold text-cyan-800">
                {installmentSourceLabel(plan.source)}
              </span>
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              <p>کل: {formatPrice(plan.totalAmount)}</p>
              <p>پرداخت‌شده: {formatPrice(plan.paidAmount)}</p>
              <p className="font-bold text-teal-800">مانده: {formatPrice(remaining)}</p>
              <p>تعداد اقساط: {plan.installmentCount.toLocaleString("fa-IR")}</p>
              <p>سررسید بعدی: {formatJalaliDate(nextDue)}</p>
              {overdueAmount > 0 ? (
                <p className="font-bold text-rose-700">
                  جمع معوقه: {formatPrice(overdueAmount)}
                </p>
              ) : null}
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-slate-700">لیست اقساط</p>
              {items.length ? (
                <div className="space-y-2">
                  {items.map((item) => {
                    const canPay = item.status !== "paid" && item.remaining > 0;
                    return (
                      <div
                        key={item.id}
                        className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                          item.status === "overdue" ? "border-rose-200 bg-rose-50/40" : "border-slate-100"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            قسط {item.index.toLocaleString("fa-IR")} از{" "}
                            {plan.installmentCount.toLocaleString("fa-IR")}
                          </p>
                          <p className="text-xs text-slate-500">
                            سررسید {formatJalaliDate(item.dueDate)} · {formatPrice(item.amount)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${itemStatusClass(item.status)}`}
                          >
                            {itemStatusLabel(item.status)}
                          </span>
                          {canPay ? (
                            <Button
                              type="button"
                              className="px-3 py-1.5 text-xs"
                              disabled={payingId === item.id}
                              onClick={() => void payItem(plan, item)}
                            >
                              {payingId === item.id ? "…" : "پرداخت این قسط"}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500">لیست قسط هنوز ساخته نشده است.</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-slate-700">تاریخچه پرداخت</p>
              {payments.length ? (
                <ul className="space-y-1 text-xs text-slate-600">
                  {payments.map((p) => (
                    <li key={p.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-50 py-1">
                      <span>
                        {formatJalaliDate(p.paidAt || p.createdAt)} ·{" "}
                        {p.method === "zibal" ? "درگاه" : p.method === "manual" ? "دستی" : p.method}
                        {p.trackId ? ` · ${p.trackId}` : ""}
                      </span>
                      <span className="font-bold text-teal-800">{formatPrice(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">هنوز واریزی ثبت نشده.</p>
              )}
            </div>
          </Card>
        );
      })}
      {!plans.length ? (
        <p className="text-center text-sm text-slate-500">
          هنوز طرح اقساطی فعالی ندارید. اقساط بسته اعتباری پس از عضویت، وام درمانی پس از تأیید در
          ادمین عضویت‌ها، و تسهیلات تجهیزات پس از تأیید در ادمین تسهیلات اینجا دیده می‌شود.
        </p>
      ) : null}
    </div>
  );
}
