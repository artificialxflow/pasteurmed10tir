import { ComplaintsPage } from "@/components/account/ComplaintsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "شکایات",
  description: "ثبت شکایت و پیگیری آن در پاستور پلاس.",
};

export default function ComplaintsWebPage() {
  return (
    <main className="flex-1">
      <ComplaintsPage />
    </main>
  );
}
