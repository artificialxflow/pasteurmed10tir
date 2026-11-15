"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import { DocumentUploadField } from "@/components/account/DocumentUploadField";
import { MembershipPaySection } from "@/components/dental/MembershipPaySection";
import {
  createLoanApplicationApi,
  getMyLoanDocumentsApi,
  getMyMembershipApplicationsApi,
} from "@/lib/commerce/client";
import {
  LOAN_CHECK_GUIDE,
  LOAN_DOC_KIND_LABELS,
  LOAN_DOC_REQUIRED_KINDS,
  type LoanDocKind,
} from "@/lib/loan-documents/constants";
import {
  calculateLoan,
  formatToman,
  getLoanRequestTermOptionsForTier,
  getMembershipPlans,
  getMembershipPlansAsync,
  isAllowedLoanRequestTerm,
  loanTermInterestLabel,
  membershipTierLabel,
  parseMembershipTier,
  type MembershipTier,
} from "@/lib/membership";
import {
  clearLoanPanelDraft,
  readLoanPanelDraft,
  writeLoanPanelDraft,
} from "@/lib/membership/loan-panel-draft";
import { resolveAllowedTiersForLoan } from "@/lib/membership/loan-tier-rules";
import { hasPaidMembershipInItems } from "@/lib/membership/membership-paid-client";
import { ROUTES } from "@/lib/routes";
import { formatPrice } from "@/lib/utils";
import { isValidNationalId, normalizeNationalId } from "@/lib/validation/national-id";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type LoanApp = {
  id?: string;
  loanAmount?: number | null;
  status?: string;
  nationalId?: string | null;
  createdAt?: string;
  source?: string | null;
  reviewNote?: string | null;
  tier?: string | null;
  planId?: string | null;
};

function statusLabel(status?: string) {
  if (status === "approved") return "تأیید شده — طرح اقساط در صفحه اقساط";
  if (status === "rejected") return "رد شده";
  return "در انتظار بررسی";
}

const LOAN_DOC_KINDS_UI: LoanDocKind[] = [
  "birth-certificate",
  "national-id",
  "pay-stub",
  "credit-report",
  "guarantee-check",
  "other",
];

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
  const [tier, setTier] = useState<MembershipTier>("regular");
  const [months, setMonths] = useState("18");
  const [nationalId, setNationalId] = useState(profileNationalId || "");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<LoanApp[]>([]);
  const [membershipRows, setMembershipRows] = useState<Array<Record<string, unknown>>>([]);
  const [docs, setDocs] = useState<Record<string, unknown>[]>([]);

  const reload = useCallback(() => {
    void getMyMembershipApplicationsApi()
      .then((data) => {
        const list = (data.items || []) as LoanApp[];
        setMembershipRows((data.items || []) as Array<Record<string, unknown>>);
        setItems(
          list.filter((item) => Number(item.loanAmount || 0) > 0 || item.source === "loan-request"),
        );
      })
      .catch(() => {
        setItems([]);
        setMembershipRows([]);
      });
    void getMyLoanDocumentsApi()
      .then((data) => setDocs(data.items || []))
      .catch(() => setDocs([]));
  }, []);

  const [membershipPlans, setMembershipPlans] = useState(() => getMembershipPlans());

  useEffect(() => {
    void getMembershipPlansAsync().then(setMembershipPlans);
  }, []);

  useEffect(() => {
    const draft = readLoanPanelDraft();
    if (!draft) return;
    if (draft.amount) setAmount(draft.amount);
    if (draft.months) setMonths(draft.months);
    if (draft.tier) setTier(parseMembershipTier(draft.tier));
    if (draft.nationalId) setNationalId(draft.nationalId);
    clearLoanPanelDraft();
  }, []);

  const allowedTiers = useMemo(
    () =>
      resolveAllowedTiersForLoan({
        amount: Number(amount || 0),
        months: Number(months || 0),
        plans: membershipPlans,
      }),
    [amount, months, membershipPlans],
  );

  useEffect(() => {
    if (!allowedTiers.includes(tier)) {
      setTier(allowedTiers[allowedTiers.length - 1] || "vip");
    }
  }, [allowedTiers, tier]);

  const paidForTier = useMemo(
    () => hasPaidMembershipInItems(membershipRows, tier),
    [membershipRows, tier],
  );

  const termOptions = useMemo(
    () => getLoanRequestTermOptionsForTier(tier, membershipPlans),
    [tier, membershipPlans],
  );
  const loanPreview = useMemo(
    () =>
      calculateLoan({
        tier,
        amount,
        months: Number(months),
        plans: membershipPlans,
      }),
    [tier, amount, months, membershipPlans],
  );

  useEffect(() => {
    if (!termOptions.some((term) => String(term.months) === months)) {
      setMonths(String(termOptions[termOptions.length - 1]?.months ?? 12));
    }
  }, [termOptions, months]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (profileNationalId) setNationalId(profileNationalId);
  }, [profileNationalId]);

  useEffect(() => {
    writeLoanPanelDraft({
      amount,
      months,
      tier,
      nationalId,
    });
  }, [amount, months, tier, nationalId]);

  const docsReady = LOAN_DOC_REQUIRED_KINDS.every((k) =>
    docs.some((d) => !d.applicationId && d.kind === k),
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    if (!paidForTier) {
      setError("ابتدا حق عضویت طرح انتخابی را پرداخت کنید.");
      return;
    }
    const loanAmount = Number(amount);
    const loanMonths = Number(months);
    const nid = normalizeNationalId(nationalId);
    if (!loanAmount || loanAmount < 1_000_000) {
      setError("مبلغ وام معتبر نیست.");
      return;
    }
    if (!isAllowedLoanRequestTerm(loanMonths, tier, membershipPlans)) {
      setError("مدت بازپرداخت معتبر نیست.");
      return;
    }
    if (!nid || !isValidNationalId(nid)) {
      setError("کد ملی ۱۰ رقمی معتبر الزامی است.");
      return;
    }
    const draftDocs = docs.filter((d) => !d.applicationId);
    const kinds = new Set(draftDocs.map((d) => String(d.kind)));
    if (LOAN_DOC_REQUIRED_KINDS.some((k) => !kinds.has(k))) {
      setError("مدارک الزامی را آپلود کنید.");
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
        tier,
        loanTier: tier,
        source: "loan-request",
        planTitle: "درخواست وام درمانی",
        status: "pending",
        date: new Date().toLocaleDateString("fa-IR"),
        documentIds: draftDocs.map((d) => String(d.id)),
      });
      setOk("درخواست وام ثبت شد. پس از تأیید ادمین، طرح اقساط در صفحه اقساط دیده می‌شود.");
      setAmount("50000000");
      clearLoanPanelDraft();
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

  return (
    <Card hover={false} className="space-y-4 border-cyan-100 bg-cyan-50/40 p-4">
      <div>
        <p className="font-extrabold text-slate-900">درخواست وام درمانی</p>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          این وام جدا از <strong>سقف اعتبار عضویت</strong> در کیف پول است. برای{" "}
          <strong>تسهیلات تجهیزات</strong> به{" "}
          <Link href={facilityHref} className="font-bold text-teal-700 underline">
            درخواست تسهیلات
          </Link>{" "}
          بروید.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <FormLabel>نوع طرح وام</FormLabel>
          <FormSelect
            value={tier}
            onChange={(e) => setTier(parseMembershipTier(e.target.value))}
          >
            {allowedTiers.includes("regular") ? (
              <option value="regular">عادی (حداکثر ۱۸ ماه)</option>
            ) : null}
            {allowedTiers.includes("vip") ? (
              <option value="vip">VIP (حداکثر ۳۶ ماه)</option>
            ) : null}
            {allowedTiers.includes("eco-plus") ? (
              <option value="eco-plus">اکوپلاس (۱۸ ماه · سود ۲۰٪)</option>
            ) : null}
          </FormSelect>
          {!allowedTiers.includes("regular") ? (
            <p className="mt-1 text-[11px] text-amber-800">
              برای این مبلغ/مدت فقط VIP مجاز است.
            </p>
          ) : null}
        </div>
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
            {termOptions.map((term) => (
              <option key={term.months} value={term.months}>
                {loanTermInterestLabel(term.months, term.interestRate)}
              </option>
            ))}
          </FormSelect>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            سود ۱۲٪ سالانه × تعداد سال (مثلاً ۲۴ ماه ≈ ۲۴٪ ساده روی مانده پس از پیش‌پرداخت).
          </p>
        </div>
        <div className="sm:col-span-2 rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs leading-6 text-amber-950">
          پیش‌نمایش: پیش‌پرداخت {loanPreview.downPaymentPercent.toLocaleString("fa-IR")}٪ ={" "}
          {formatToman(loanPreview.downPaymentAmount)} · مانده {formatToman(loanPreview.remaining)}{" "}
          · جمع بازپرداخت {formatToman(loanPreview.totalRepayment)} (
          {loanPreview.months.toLocaleString("fa-IR")} قسط)
        </div>

        <div className="sm:col-span-2">
          <MembershipPaySection
            variant={variant}
            patientName={name}
            patientPhone={phone}
            tier={tier}
            paidForTier={paidForTier}
          />
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
        <div className="sm:col-span-2 space-y-2">
          <p className="text-sm font-extrabold text-slate-900">مدارک</p>
          {LOAN_DOC_KINDS_UI.map((kind) => (
            <DocumentUploadField
              key={kind}
              kind={kind}
              label={LOAN_DOC_KIND_LABELS[kind]}
              required={LOAN_DOC_REQUIRED_KINDS.includes(kind)}
              hint={kind === "guarantee-check" ? LOAN_CHECK_GUIDE.hint : undefined}
              items={
                docs.filter((d) => !d.applicationId) as {
                  id?: string;
                  kind?: string;
                  filename?: string;
                  mime?: string;
                }[]
              }
              onChange={reload}
            />
          ))}
        </div>
        {error ? <p className="sm:col-span-2 text-sm font-bold text-rose-600">{error}</p> : null}
        {ok ? <p className="sm:col-span-2 text-sm font-bold text-teal-700">{ok}</p> : null}
        <Button
          type="submit"
          disabled={busy || !paidForTier || !docsReady}
          className="sm:col-span-2"
        >
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
                <span className="font-bold">{formatPrice(Number(item.loanAmount || 0))}</span>
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