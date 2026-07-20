import { ConfirmPayment } from "@/components/dental/ConfirmPayment";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تأیید و پرداخت",
};

export default function DentalConfirmPage() {
  return <ConfirmPayment basePath="/dental" />;
}
