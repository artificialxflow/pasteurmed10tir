"use client";

import { Button } from "@/components/ui/Button";
import { FormLabel, FormSelect } from "@/components/ui/Card";
import {
  applyMembershipDiscounts,
  clampGroupDiscountPercent,
} from "@/lib/membership/group-discount";
import {
  formatToman,
  getDurationOptionsForTier,
  isMembershipDurationAllowed,
  getMembershipPlans,
  getMembershipPlansAsync,
  getUnitPrice,
  getValidityLabel,
  membershipDurationDiscountForPayment,
  normalizeMemberCount,
  membershipTierLabel,
  parseMembershipTier,
  type MembershipTier,
} from "@/lib/membership";
import { createMembershipApplicationApi, resolveReferralDiscount } from "@/lib/commerce/client";
import { readStoredReferralCode } from "@/lib/commerce/referral-ref";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import { normalizePhone } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function MembershipPaySection({
  variant,
  patientName,
  patientPhone,
  tier,
  onTierChange,
  paidForTier,
}: {
  variant: "web" | "app";
  patientName: string;
  patientPhone: string;
  tier: MembershipTier;
  onTierChange?: (tier: MembershipTier) => void;
  paidForTier: boolean;
}) {
  const router = useRouter();
  const app = variant === "app";
  const [planId, setPlanId] = useState("one-year");
  const [memberCount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState(() => getMembershipPlans());

  const durationOptions = useMemo(() => getDurationOptionsForTier(tier), [tier]);
  const confirmHref = app ? ROUTES.app.dentalConfirm : ROUTES.web.dentalConfirm;
  const accountReturn = app
    ? `${ROUTES.app.account}?panel=loan`
    : `${ROUTES.web.account}?panel=loan`;

  useEffect(() => {
    void getMembershipPlansAsync().then(setPlans);
  }, []);

  useEffect(() => {
    if (isMembershipDurationAllowed(tier, planId)) return;
    setPlanId("two-year");
  }, [tier, planId]);

  const amountToman = useMemo(() => {
    const plan = durationOptions.find((p) => p.id === planId);
    const unit = getUnitPrice(tier, planId);
    const count = normalizeMemberCount(memberCount);
    const durationDisc = membershipDurationDiscountForPayment(plan);
    return applyMembershipDiscounts({
      subtotal: unit * count,
      durationDiscountPercent: durationDisc,
      groupDiscountPercent: clampGroupDiscountPercent(0),
    });
  }, [durationOptions, memberCount, planId, tier]);

  const validityLabel = getValidityLabel(tier, planId);
  const tierLabel = membershipTierLabel(tier);
  const membershipMeta = plans.find((m) => m.id === tier);

  async function startPayment() {
    setError("");
    const name = patientName.trim();
    const phone = normalizePhone(patientPhone);
    if (name.length < 2 || phone.length < 10) {
      setError("پروفایل نام و موبایل معتبر ندارد.");
      return;
    }
    if (!isMembershipDurationAllowed(tier, planId) || !amountToman) {
      setError("این ترکیب طرح و مدت عضویت موجود نیست.");
      return;
    }
    const plan = durationOptions.find((p) => p.id === planId);
    const count = normalizeMemberCount(memberCount);
    const unit = getUnitPrice(tier, planId);
    const durationDisc = membershipDurationDiscountForPayment(plan);
    const subtotal = unit * count;
    const referralCode = readStoredReferralCode() || "";
    setBusy(true);
    try {
      const referral = await resolveReferralDiscount(
        applyMembershipDiscounts({
          subtotal,
          durationDiscountPercent: durationDisc,
          groupDiscountPercent: 0,
        }),
        referralCode,
      );
      if (referral.error) throw new Error(referral.error);
      const data = {
        id: PasteurStorage.generateId(),
        date: new Date().toLocaleDateString("fa-IR"),
        referralCode: referral.referralCode || referralCode,
        referralDiscountPercent: referral.referralDiscountPercent,
        referralDiscountAmount: referral.referralDiscountAmount,
        visitorName: "—",
        patientName: name,
        phone,
        planId: plan?.id,
        planTitle: plan ? `${plan.title} (${plan.duration})` : "—",
        validityLabel,
        membershipDurationLabel: validityLabel,
        discountPercent: durationDisc,
        groupDiscountPercent: 0,
        tier,
        tierLabel,
        memberCount: count,
        unitPriceToman: unit,
        subtotalToman: subtotal,
        amountRial: referral.payable * 10,
        amountToman: referral.payable,
        loanAmount: null,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      await createMembershipApplicationApi(data as Record<string, unknown>);
      PasteurStorage.setPendingPayment({
        kind: "membership",
        planId: tier,
        planName: `${membershipMeta?.name || tierLabel} — عضویت ${validityLabel}`,
        patientName: name,
        patientPhone: phone,
        amount: referral.payable,
        validityLabel,
        membershipDurationLabel: validityLabel,
        discountPercent: durationDisc,
        groupDiscountPercent: 0,
        referralCode: referral.referralCode || referralCode,
        referralDiscountPercent: referral.referralDiscountPercent,
        referralDiscountAmount: referral.referralDiscountAmount,
        successTo: accountReturn,
        returnTo: accountReturn,
      });
      router.push(confirmHref);
    } catch (e) {
      setError(e instanceof Error ? e.message : "شروع پرداخت ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  if (paidForTier) {
    return (
      <span className="inline-flex rounded-full border border-teal-300 bg-teal-50 px-3 py-1 text-xs font-extrabold text-teal-900">
        حق عضویت پرداخت شده ({tierLabel})
      </span>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/50 p-3">
      <p className="text-sm font-extrabold text-slate-900">پرداخت حق عضویت (الزامی)</p>
      <p className="text-xs leading-6 text-slate-600">
        تا پرداخت حق عضویت برای طرح {tierLabel}، ثبت درخواست وام امکان‌پذیر نیست.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {onTierChange ? (
          <div>
            <FormLabel>طرح عضویت</FormLabel>
            <FormSelect
              value={tier}
              onChange={(e) => onTierChange(parseMembershipTier(e.target.value))}
            >
              <option value="regular">عادی</option>
              <option value="vip">VIP</option>
              <option value="eco-plus">اکوپلاس</option>
            </FormSelect>
          </div>
        ) : null}
        <div>
          <FormLabel>مدت حق عضویت</FormLabel>
          <FormSelect value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {durationOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </FormSelect>
        </div>
      </div>
      <p className="text-sm font-bold text-violet-900">
        مبلغ قابل پرداخت: {formatToman(amountToman)} · {validityLabel}
      </p>
      {error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
      <Button type="button" disabled={busy} onClick={() => void startPayment()} className="w-full">
        {busy ? "در حال انتقال…" : "پرداخت حق عضویت"}
      </Button>
    </div>
  );
}