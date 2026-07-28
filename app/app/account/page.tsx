"use client";

import { AccountPage } from "@/components/account/AccountPage";
import { AppShell } from "@/components/app/AppShell";
import { ROUTES } from "@/lib/routes";

export default function AppAccountPage() {
  return (
    <AppShell title="پنل کاربری" backHref={ROUTES.app.home} showNav>
      <AccountPage variant="app" />
    </AppShell>
  );
}
