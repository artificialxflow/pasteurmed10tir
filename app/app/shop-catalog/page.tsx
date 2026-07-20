"use client";

import { AppShell } from "@/components/app/AppShell";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { ROUTES } from "@/lib/routes";
import { Suspense } from "react";

export default function AppShopCatalogPage() {
  return (
    <AppShell title="محصولات" backHref={ROUTES.app.shop}>
      <Suspense fallback={<p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>}>
        <ShopCatalog variant="app" />
      </Suspense>
    </AppShell>
  );
}
