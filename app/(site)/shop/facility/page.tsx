import { ShopFacility } from "@/components/shop/ShopFacility";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسهیلات VIP",
  description: "درخواست تسهیلات خرید تجهیزات پزشکی از پاستور پلاس.",
};

export default function ShopFacilityPage() {
  return <ShopFacility variant="web" />;
}
