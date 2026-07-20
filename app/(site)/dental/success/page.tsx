import { PaymentSuccess } from "@/components/dental/PaymentResult";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "رزرو موفق",
};

export default function DentalSuccessPage() {
  return <PaymentSuccess basePath="/dental" />;
}
