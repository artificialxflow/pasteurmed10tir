import { ShopCartView } from "@/components/shop/ShopCart";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سبد خرید",
  description: "سبد خرید تجهیزات پزشکی پاستور پلاس.",
};

export default function ShopCartPage() {
  return <ShopCartView variant="web" />;
}
