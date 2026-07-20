import { ShopCatalog } from "@/components/shop/ShopCatalog";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "کاتالوگ تجهیزات",
};

export default function ShopCatalogPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-slate-500">در حال بارگذاری...</p>}>
      <ShopCatalog variant="web" />
    </Suspense>
  );
}
