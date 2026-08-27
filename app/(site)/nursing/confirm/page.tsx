import { ConfirmNursingPayment } from "@/components/nursing/NursingPayment";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تأیید پرداخت پرستاری",
};

export default function NursingConfirmPage() {
  return <ConfirmNursingPayment basePath="/nursing" />;
}
