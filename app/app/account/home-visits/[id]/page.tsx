import { HomeVisitTrack } from "@/components/home-visit/HomeVisitTrack";
import { AppShell } from "@/components/app/AppShell";
import { ROUTES } from "@/lib/routes";

export default async function HomeVisitTrackAppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell title="پیگیری اعزام" backHref={ROUTES.app.account} showNav>
      <HomeVisitTrack id={id} variant="app" />
    </AppShell>
  );
}
