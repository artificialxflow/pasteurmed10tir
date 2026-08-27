import { LaserCatalog } from "@/components/laser/LaserCatalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لیزر و زیبایی",
  description: "خدمات لیزر و زیبایی — پاستور پلاس",
};

export default function LaserPage() {
  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">✨ لیزر و زیبایی</h1>
        <p className="mb-8 text-slate-600">
          خدمت را انتخاب کنید و همان تعرفه را آنلاین بپردازید — جدا از مشاوره و ویزیت.
        </p>
        <LaserCatalog variant="site" />
      </div>
    </main>
  );
}
