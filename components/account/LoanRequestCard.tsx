"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import {
  createLoanApplicationApi,
  getMyMembershipApplicationsApi,
} from "@/lib/commerce/client";
import {
  LOAN_REQUEST_TERM_OPTIONS,
  loanTermInterestLabel,
} from "@/lib/membership";
import { ROUTES } from "@/lib/routes";
import { formatPrice } from "@/lib/utils";
import { isValidNationalId, normalizeNationalId } from "@/lib/validation/national-id";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type LoanApp = {
  id?: string;
  loanAmount?: number | null;
  status?: string;
  nationalId?: string | null;
  createdAt?: string;
  source?: string | null;
  reviewNote?: string | null;
};

function statusLabel(status?: string) {
  if (status === "approved") return "تأیید شده — طرح اقساط در صفحه اقساط";
  if (status === "rejected") return "رد شده";
  return "در انتظار بررسی";
}

export function LoanRequestCard({
  phone,
  name,
  nationalId: profileNationalId,
  variant,
}: {
  phone: string;
  name: string;
  nationalId?: string;
  variant: "web" | "app";
}) {
  const [amount, setAmount] = useState("50000000");
  const [months, setMonths] = useState("12");
  const [nationalId, setNationalId] = useState(profileNationalId || "");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<LoanApp[]>([]);

  const reload = useCallback(() => {
    void getMyMembershipApplicationsApi()
      .then((data) => {
        const list = (data.items || []) as LoanApp[];
        setItems(
          list.filter((item) => Number(item.loanAmount || 0) > 0 || item.source === "loan-request"),
        );
      })
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (profileNationalId) setNationalId(profileNationalId);
  }, [profileNationalId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    const loanAmount = Number(amount);
    const loanMonths = Number(months);
    const nid = normalizeNationalId(nationalId);
    if (!loanAmount || loanAmount < 1_000_000) {
      setError("مبلغ وام معتبر نیست.");
      return;
    }
    if (!LOAN_REQUEST_TERM_OPTIONS.some((term) => term.months === loanMonths)) {
      setError("مدت بازپرداخت معتبر نیست.");
      return;
    }
    if (!nid || !isValidNationalId(nid)) {
      setError("کد ملی ۱۰ رقمی معتبر الزامی است.");
      return;
    }
    setBusy(true);
    try {
      await createLoanApplicationApi({
        patientName: name,
        phone,
        nationalId: nid,
        loanAmount,
        loanMonths,
        months: loanMonths,
        source: "loan-request",
        planTitle: "درخواست وام درمانی",
        status: "pending",
        date: new Date().toLocaleDateString("fa-IR"),
      });
      setOk("درخواست وام ثبت شد. پس از تأیید ادمین، طرح اقساط در صفحه اقساط دیده می‌شود.");
      setAmount("50000000");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  const installmentsHref =
    variant === "app" ? ROUTES.app.installments : ROUTES.web.installments;
  const facilityHref =
    variant === "app" ? ROUTES.app.shopFacility : ROUTES.web.shopFacility;
  const membershipHref =
    variant === "app" ? ROUTES.app.dentalMembership : ROUTES.web.dentalMembership;

  return (
    <Card hover={false} className="space-y-4 border-cyan-100 bg-cyan-50/40 p-4">
      <div>
        <p className="font-extrabold text-slate-900">درخواست وام درمانی</p>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          این وام جدا از <strong>سقف اعتبار عضویت</strong> در کیف پول است. برای عضویت به{" "}
          <Link href={membershipHref} className="font-bold text-teal-700 underline">
            فرم عضویت
          </Link>{" "}
          و برای <strong>تسهیلات تجهیزات</strong> به{" "}
          <Link href={facilityHref} className="font-bold text-teal-700 underline">
            درخواست تسهیلات
          </Link>{" "}
          بروید.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <FormLabel>مبلغ وام (تومان)</FormLabel>
          <FormInput
            type="number"
            min={1000000}
            step={1000000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <FormLabel>مدت بازپرداخت</FormLabel>
          <FormSelect value={months} onChange={(e) => setMonths(e.target.value)}>
            {LOAN_REQUEST_TERM_OPTIONS.map((term) => (
              <option key={term.months} value={term.months}>
                {loanTermInterestLabel(term.months, term.interestRate)}
              </option>
            ))}
          </FormSelect>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            گزینه‌های ۱ تا ۳ ماهه بدون سود برای بدهی‌های کوچک تا سر برج است.
          </p>
        </div>
        <div className="sm:col-span-2">
          <FormLabel>کد ملی (الزامی)</FormLabel>
          <FormInput
            inputMode="numeric"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            placeholder="۱۰ رقم"
            required
          />
        </div>
        {error ? <p className="sm:col-span-2 text-sm font-bold text-rose-600">{error}</p> : null}
        {ok ? <p className="sm:col-span-2 text-sm font-bold text-teal-700">{ok}</p> : null}
        <Button type="submit" disabled={busy} className="sm:col-span-2">
          {busy ? "در حال ثبت…" : "ثبت درخواست وام"}
        </Button>
      </form>

      {items.length ? (
        <div className="space-y-2 border-t border-cyan-100 pt-3">
          <p className="text-sm font-extrabold text-slate-900">درخواست‌های وام من</p>
          {items.map((item) => (
            <div
              key={String(item.id)}
              className="rounded-xl border border-white bg-white/80 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">
                  {formatPrice(Number(item.loanAmount || 0))}
                </span>
                <span
                  className={`text-xs font-bold ${
                    item.status === "rejected"
                      ? "text-rose-700"
                      : item.status === "approved"
                        ? "text-teal-700"
                        : "text-slate-600"
                  }`}
                >
                  {statusLabel(item.status)}
                </span>
              </div>
              {item.status === "rejected" && item.reviewNote ? (
                <p className="mt-2 rounded-lg border border-rose-100 bg-rose-50/80 px-2 py-1.5 text-xs leading-6 text-rose-900">
                  توضیح کارشناس: {item.reviewNote}
                </p>
              ) : null}
              {item.status === "rejected" && !item.reviewNote ? (
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  درخواست رد شده است. برای جزئیات با پشتیبانی تماس بگیرید.
                </p>
              ) : null}
            </div>
          ))}
          <Link href={installmentsHref} className="inline-block text-xs font-bold text-teal-700 underline">
            مشاهده اقساط ←
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
