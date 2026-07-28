import { InstallmentsPage } from "@/components/account/InstallmentsPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "اقساط من" };

export default function InstallmentsWebPage() {
  return (
    <main className="flex-1">
      <InstallmentsPage />
    </main>
  );
}
