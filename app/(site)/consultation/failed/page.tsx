import { ConsultationPaymentFailed } from "@/components/consultation/ConsultationPayment";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پرداخت ناموفق",
};

export default function ConsultationFailedPage() {
  return <ConsultationPaymentFailed basePath="/consultation" />;
}
