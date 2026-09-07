import { EducationList } from "@/components/dental/EducationList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "آموزش‌ها و نکات دندانپزشکی",
  description: "آموزش‌ها و نکات مراقبت از دندان از پاستور پلاس.",
};

export default function DentalEducationPage() {
  return <EducationList basePath="/dental" />;
}
