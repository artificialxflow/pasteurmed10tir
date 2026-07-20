import { MembershipPage } from "@/components/dental/MembershipPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "طرح‌های عضویت",
  description: "عضویت عادی و VIP دندانپزشکی پاستور پلاس",
};

export default function DentalMembershipPage() {
  return <MembershipPage basePath="/dental" />;
}
