"use client";

import { FormInput, FormLabel } from "@/components/ui/Card";
import { REFERRAL_DISCOUNT_HINT } from "@/lib/commerce/referral-discount";
import { readStoredReferralCode } from "@/lib/commerce/referral-ref";
import { useEffect, useRef } from "react";

export function ReferralCodeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (value.trim()) return;
    const stored = readStoredReferralCode();
    if (stored) onChange(stored);
    // intentionally once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
