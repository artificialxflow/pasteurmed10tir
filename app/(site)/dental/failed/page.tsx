import { PaymentFailed } from "@/components/dental/PaymentResult";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "خطا در پرداخت",
};

export default function DentalFailedPage() {
  return <PaymentFailed basePath="/dental" />;
}
