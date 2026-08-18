"use client";

import { AppShell } from "@/components/app/AppShell";
import { ShopFailed } from "@/components/shop/ShopFailed";
import { ROUTES } from "@/lib/routes";

export default function AppShopFailedPage() {
  return (
    <AppShell title="پرداخت ناموفق" backHref={ROUTES.app.shopCart}>
      <ShopFailed variant="app" />
    </AppShell>
  );
}
