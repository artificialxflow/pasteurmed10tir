import { PaymentFailed } from "@/components/dental/PaymentResult";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "خطا در پرداخت",
  description: "پرداخت رزرو نوبت ناموفق بود. دوباره تلاش کنید.",
};

export default function DentalFailedPage() {
  return <PaymentFailed basePath="/dental" />;
}
