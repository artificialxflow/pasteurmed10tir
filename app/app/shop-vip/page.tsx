"use client";

import { AppShell } from "@/components/app/AppShell";
import { ShopVip } from "@/components/shop/ShopVip";
import { ROUTES } from "@/lib/routes";

export default function AppShopVipPage() {
  return (
    <AppShell title="VIP تجهیزات" backHref={ROUTES.app.shop} showNav={false}>
      <ShopVip variant="app" />
    </AppShell>
  );
}
