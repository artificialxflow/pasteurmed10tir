import { AppShell } from "@/components/app/AppShell";
import { NursingCatalog } from "@/components/nursing/NursingCatalog";
import { ROUTES } from "@/lib/routes";

export default function AppNursingPage() {
  return (
    <AppShell title="پرستاری" backHref={ROUTES.app.home} showNav>
      <p className="mb-4 text-sm leading-7 text-slate-600">
        خدمت و تعرفه را انتخاب کنید و همان مبلغ را آنلاین بپردازید — جدا از مشاوره و ویزیت.
      </p>
      <NursingCatalog variant="app" />
    </AppShell>
  );
}
