import { AccountPage } from "@/components/account/AccountPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پنل کاربری",
  description: "ورود به پنل کاربری پاستور پلاس برای نوبت، وام و پرونده.",
};

export default function AccountWebPage() {
  return (
    <main className="flex-1">
      <AccountPage variant="web" />
    </main>
  );
}
