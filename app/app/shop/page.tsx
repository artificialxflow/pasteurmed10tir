"use client";

import { AppShell } from "@/components/app/AppShell";
import { ShopHome } from "@/components/shop/ShopHome";
import { ROUTES } from "@/lib/routes";

export default function AppShopPage() {
  return (
    <AppShell title="فروشگاه" backHref={ROUTES.app.home}>
      <ShopHome variant="app" />
    </AppShell>
  );
}
