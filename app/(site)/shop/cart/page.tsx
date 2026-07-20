import { ShopCartView } from "@/components/shop/ShopCart";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سبد خرید",
};

export default function ShopCartPage() {
  return <ShopCartView variant="web" />;
}
