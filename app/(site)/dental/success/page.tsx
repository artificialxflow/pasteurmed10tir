import { PaymentSuccess } from "@/components/dental/PaymentResult";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "رزرو موفق",
  description: "رزرو نوبت دندانپزشکی با موفقیت ثبت شد.",
};

export default function DentalSuccessPage() {
  return <PaymentSuccess basePath="/dental" />;
}
