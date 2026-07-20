import { EducationList } from "@/components/dental/EducationList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "آموزش‌ها و نکات دندانپزشکی",
};

export default function DentalEducationPage() {
  return <EducationList basePath="/dental" />;
}
