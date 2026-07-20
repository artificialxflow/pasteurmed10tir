import { AppShell } from "@/components/app/AppShell";
import { GalleryBrowser } from "@/components/gallery/GalleryBrowser";
import { ROUTES } from "@/lib/routes";

export default function AppGalleryPage() {
  return (
    <AppShell title="گالری نتایج" backHref={ROUTES.app.home} showNav>
      <section className="mb-3 rounded-2xl border border-cyan-200 bg-gradient-to-bl from-cyan-50 to-amber-50 p-4">
        <p className="text-sm font-extrabold text-slate-950">🖼️ گالری نتایج</p>
        <p className="mt-1 text-xs text-slate-600">
          نمونه‌کارهای قبل و بعد — دندان، لیزر و زیبایی
        </p>
      </section>
      <GalleryBrowser compact />
    </AppShell>
  );
}
