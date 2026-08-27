import { LaserPaymentFailed } from "@/components/laser/LaserPayment";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پرداخت ناموفق لیزر",
};

export default function LaserFailedPage() {
  return <LaserPaymentFailed basePath="/laser" />;
}
