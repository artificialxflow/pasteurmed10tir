import { AppShell } from "@/components/app/AppShell";
import { WalletPage } from "@/components/wallet/WalletPage";
import { ROUTES } from "@/lib/routes";

export default function AppWalletPage() {
  return (
    <AppShell title="کیف اعتبار" backHref={ROUTES.app.home} showNav>
      <WalletPage variant="app" />
    </AppShell>
  );
}
