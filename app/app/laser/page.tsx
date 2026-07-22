import { AppShell } from "@/components/app/AppShell";
import { LaserCatalog } from "@/components/laser/LaserCatalog";
import { ROUTES } from "@/lib/routes";

export default function AppLaserPage() {
  return (
    <AppShell title="لیزر و زیبایی" backHref={ROUTES.app.home} showNav>
      <p className="mb-4 text-sm leading-7 text-slate-600">خدمات لیزر و زیبایی</p>
      <LaserCatalog variant="app" />
    </AppShell>
  );
}
