"use client";

import { FormInput, FormLabel } from "@/components/ui/Card";
import { REFERRAL_DISCOUNT_HINT } from "@/lib/commerce/referral-discount";

export function ReferralCodeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <FormLabel>کد معرف ویزیتور (اختیاری)</FormLabel>
      <FormInput
        value={value}
        onChange={(e) => onChange(e.target.value.trim().toUpperCase())}
        autoComplete="off"
      />
      <p className="mt-1 text-xs text-slate-500">{REFERRAL_DISCOUNT_HINT}</p>
    </div>
  );
}
