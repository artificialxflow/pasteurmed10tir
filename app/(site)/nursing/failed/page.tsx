import { NursingPaymentFailed } from "@/components/nursing/NursingPayment";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پرداخت ناموفق پرستاری",
};

export default function NursingFailedPage() {
  return <NursingPaymentFailed basePath="/nursing" />;
}
