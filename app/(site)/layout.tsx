import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { MobileAppRedirect } from "@/components/layout/MobileAppRedirect";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <MobileAppRedirect />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
