"use client";

import { AppShell } from "@/components/app/AppShell";
import { ShopCartView } from "@/components/shop/ShopCart";
import { ROUTES } from "@/lib/routes";

export default function AppShopCartPage() {
  return (
    <AppShell title="سبد خرید" backHref={ROUTES.app.shopCatalog} showNav={false}>
      <ShopCartView variant="app" />
    </AppShell>
  );
}
