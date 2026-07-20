import { ShopSuccess } from "@/components/shop/ShopSuccess";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سفارش ثبت شد",
};

export default function ShopSuccessPage() {
  return <ShopSuccess variant="web" />;
}
