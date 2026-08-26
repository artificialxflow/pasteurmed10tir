import { ConfirmConsultationPayment } from "@/components/consultation/ConsultationPayment";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تأیید و پرداخت مشاوره",
};

export default function ConsultationConfirmPage() {
  return <ConfirmConsultationPayment basePath="/consultation" />;
}
