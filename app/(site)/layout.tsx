import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { MobileAppRedirect } from "@/components/layout/MobileAppRedirect";
import { clinicJsonLd } from "@/lib/seo";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clinicJsonLd()) }}
      />
      <MobileAppRedirect />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
