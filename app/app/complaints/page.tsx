"use client";

import { ComplaintsPage } from "@/components/account/ComplaintsPage";
import { AppShell } from "@/components/app/AppShell";
import { ROUTES } from "@/lib/routes";

export default function AppComplaintsPage() {
  return (
    <AppShell title="شکایات" backHref={ROUTES.app.account} showNav={false}>
      <ComplaintsPage variant="app" />
    </AppShell>
  );
}
