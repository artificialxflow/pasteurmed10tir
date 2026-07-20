import { GalleryBrowser } from "@/components/gallery/GalleryBrowser";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "گالری نتایج",
  description: "گالری قبل و بعد — دندانپزشکی، لیزر و زیبایی",
};

export default function GalleryPage() {
  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">🖼️ گالری نتایج</h1>
        <p className="mb-6 text-slate-600">
          نمونه‌کارهای قبل و بعد — دندانپزشکی، لیزر و زیبایی
        </p>
        <GalleryBrowser />
      </div>
    </main>
  );
}
