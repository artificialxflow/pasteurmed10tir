import { ComplaintsPage } from "@/components/account/ComplaintsPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "شکایات" };

export default function ComplaintsWebPage() {
  return (
    <main className="flex-1">
      <ComplaintsPage />
    </main>
  );
}
