import { NursingPaymentSuccess } from "@/components/nursing/NursingPayment";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پرداخت موفق پرستاری",
};

export default function NursingSuccessPage() {
  return <NursingPaymentSuccess basePath="/nursing" />;
}
