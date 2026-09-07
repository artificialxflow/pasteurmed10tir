import { HelpPage } from "@/components/help/HelpPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "آموزش سامانه",
  description: "راهنمای استفاده از سامانه نوبت‌دهی و خدمات پاستور پلاس.",
};

export default function HelpWebPage() {
  return (
    <main className="flex-1">
      <HelpPage />
    </main>
  );
}
