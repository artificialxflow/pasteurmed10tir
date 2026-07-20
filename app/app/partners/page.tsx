"use client";

import { AppShell } from "@/components/app/AppShell";
import { PartnerRequestForm } from "@/components/partners/PartnerRequestForm";
import { ROUTES } from "@/lib/routes";
import { useState } from "react";

export default function AppPartnersPage() {
  const [snack, setSnack] = useState("");

  return (
    <AppShell title="همکاری" backHref={ROUTES.app.home} showNav>
      <p className="mb-4 text-sm leading-7 text-slate-600">
        ثبت درخواست همکاری برای پرستاران، پزشکان و روانشناسان
      </p>
      <PartnerRequestForm
        variant="app"
        onSuccess={() => {
          setSnack("درخواست همکاری ثبت شد");
          window.setTimeout(() => setSnack(""), 2500);
        }}
      />
      {snack ? (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto max-w-[430px] px-6">
          <div className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white shadow-lg">
            {snack}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
