import { AccountPage } from "@/components/account/AccountPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پنل کاربری",
};

export default function AccountWebPage() {
  return (
    <main className="flex-1">
      <AccountPage variant="web" />
    </main>
  );
}
