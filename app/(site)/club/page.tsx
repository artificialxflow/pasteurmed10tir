import { ClubPage } from "@/components/club/ClubPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "باشگاه مشتریان",
  description: "امتیاز، پاداش و سطح وفاداری باشگاه مشتریان پاستور پلاس",
};

export default function ClubSitePage() {
  return (
    <main className="flex-1 py-10">
      <div className="px-4 sm:px-6">
        <ClubPage variant="web" />
      </div>
    </main>
  );
}
