"use client";

import { AppShell } from "@/components/app/AppShell";
import { HelpPage } from "@/components/help/HelpPage";
import { ROUTES } from "@/lib/routes";

export default function AppHelpPage() {
  return (
    <AppShell title="آموزش سامانه" backHref={ROUTES.app.home} showNav>
      <HelpPage variant="app" />
    </AppShell>
  );
}
