"use client";

import { AccountPage } from "@/components/account/AccountPage";
import { AppShell } from "@/components/app/AppShell";
import { ROUTES } from "@/lib/routes";
import { Suspense } from "react";

export default function AppAccountPage() {
  return (
    <AppShell title="پنل کاربری" backHref={ROUTES.app.home} showNav>
      <Suspense
        fallback={<p className="p-4 text-center text-sm text-slate-500">در حال بارگذاری…</p>}
      >
        <AccountPage variant="app" />
      </Suspense>
    </AppShell>
  );
}
