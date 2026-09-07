import { ShopVip } from "@/components/shop/ShopVip";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VIP تجهیزات",
  description: "عضویت VIP فروشگاه تجهیزات پزشکی پاستور پلاس.",
};

export default function ShopVipPage() {
  return <ShopVip variant="web" />;
}
