import { ShopFailed } from "@/components/shop/ShopFailed";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "خطا در پرداخت",
};

export default function ShopFailedPage() {
  return <ShopFailed variant="web" />;
}
