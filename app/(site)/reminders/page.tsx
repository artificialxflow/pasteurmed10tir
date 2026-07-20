import { RemindersPage } from "@/components/reminders/RemindersPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "یادآور هوشمند",
  description: "مدیریت یادآور نوبت‌های پاستور پلاس",
};

export default function RemindersSitePage() {
  return (
    <main className="flex-1 py-10">
      <div className="px-4 sm:px-6">
        <RemindersPage variant="web" />
      </div>
    </main>
  );
}
