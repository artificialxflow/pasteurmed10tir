import { ShopVip } from "@/components/shop/ShopVip";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VIP تجهیزات",
};

export default function ShopVipPage() {
  return <ShopVip variant="web" />;
}
