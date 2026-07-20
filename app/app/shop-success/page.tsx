"use client";

import { AppShell } from "@/components/app/AppShell";
import { ShopSuccess } from "@/components/shop/ShopSuccess";
import { ROUTES } from "@/lib/routes";

export default function AppShopSuccessPage() {
  return (
    <AppShell title="تأیید سفارش" backHref={ROUTES.app.home}>
      <ShopSuccess variant="app" />
    </AppShell>
  );
}
