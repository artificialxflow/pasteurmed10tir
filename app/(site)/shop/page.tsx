import { ShopHome } from "@/components/shop/ShopHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "فروشگاه تجهیزات",
  description: "فروشگاه تجهیزات پزشکی و دندانپزشکی پاستور پلاس",
};

export default function ShopPage() {
  return <ShopHome variant="web" />;
}
