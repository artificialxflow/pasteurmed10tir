import { ConsultationTrack } from "@/components/consultation/ConsultationTrack";
import { AppShell } from "@/components/app/AppShell";
import { ROUTES } from "@/lib/routes";

export default async function ConsultationTrackAppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell title="پیگیری مشاوره" backHref={ROUTES.app.account} showNav>
      <ConsultationTrack id={id} variant="app" />
    </AppShell>
  );
}
