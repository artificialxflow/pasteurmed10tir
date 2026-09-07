import { SpecialtyList } from "@/components/dental/SpecialtyList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تخصصی | دندانپزشکی",
  description: "تخصص‌های دندانپزشکی پاستور پلاس — ارتودنسی، ایمپلنت، زیبایی و درمان ریشه.",
};

export default function DentalSpecialtyPage() {
  return <SpecialtyList basePath="/dental" />;
}
