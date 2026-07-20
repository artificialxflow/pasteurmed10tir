"use client";

import { AppShell } from "@/components/app/AppShell";
import { ShopFacility } from "@/components/shop/ShopFacility";
import { ROUTES } from "@/lib/routes";

export default function AppShopFacilityPage() {
  return (
    <AppShell title="تسهیلات" backHref={ROUTES.app.shopCatalog} showNav={false}>
      <ShopFacility variant="app" />
    </AppShell>
  );
}
