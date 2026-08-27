import { ConfirmLaserPayment } from "@/components/laser/LaserPayment";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تأیید پرداخت لیزر",
};

export default function LaserConfirmPage() {
  return <ConfirmLaserPayment basePath="/laser" />;
}
