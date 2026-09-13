"use client";

import { captureReferralRefFromLocation } from "@/lib/commerce/referral-ref";
import { useEffect } from "react";

/** Captures ?ref= into sessionStorage on every public page load. */
export function CaptureReferralRef() {
  useEffect(() => {
    captureReferralRefFromLocation();
  }, []);
  return null;
}
