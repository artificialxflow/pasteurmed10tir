import { AccountPage } from "@/components/account/AccountPage";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "پنل کاربری",
  description: "ورود به پنل کاربری پاستور پلاس برای نوبت، وام و پرونده.",
};

export default function AccountWebPage() {
  return (
    <main className="flex-1">
      <Suspense
        fallback={
          <p className="px-4 py-10 text-center text-sm text-slate-500">در حال بارگذاری…</p>
        }
      >
        <AccountPage variant="web" />
      </Suspense>
    </main>
  );
}
