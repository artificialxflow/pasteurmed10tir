import { ConfirmPayment } from "@/components/dental/ConfirmPayment";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تأیید و پرداخت",
  description: "تأیید و پرداخت رزرو نوبت دندانپزشکی پاستور پلاس.",
};

export default function DentalConfirmPage() {
  return <ConfirmPayment basePath="/dental" />;
}
