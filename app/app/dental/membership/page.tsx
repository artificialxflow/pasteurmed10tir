"use client";

import { AppShell } from "@/components/app/AppShell";
import { MembershipPage } from "@/components/dental/MembershipPage";
import { ROUTES } from "@/lib/routes";

export default function AppDentalMembershipPage() {
  return (
    <AppShell title="عضویت" backHref={ROUTES.app.dental} showNav={false}>
      <MembershipPage basePath="/app/dental" />
    </AppShell>
  );
}
