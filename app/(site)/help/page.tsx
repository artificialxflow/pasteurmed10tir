import { HelpPage } from "@/components/help/HelpPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "آموزش سامانه" };

export default function HelpWebPage() {
  return (
    <main className="flex-1">
      <HelpPage />
    </main>
  );
}
