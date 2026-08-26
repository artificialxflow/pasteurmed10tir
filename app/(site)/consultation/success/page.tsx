import { ConsultationPaymentSuccess } from "@/components/consultation/ConsultationPayment";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پرداخت موفق",
};

export default function ConsultationSuccessPage() {
  return <ConsultationPaymentSuccess basePath="/consultation" />;
}
