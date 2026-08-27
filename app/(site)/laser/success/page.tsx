import { LaserPaymentSuccess } from "@/components/laser/LaserPayment";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پرداخت موفق لیزر",
};

export default function LaserSuccessPage() {
  return <LaserPaymentSuccess basePath="/laser" />;
}
