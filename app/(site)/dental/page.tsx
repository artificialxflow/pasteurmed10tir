import { DentalHub } from "@/components/dental/DentalHub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "دندانپزشکی",
  description: "نوبت دندانپزشکی، تخصص‌ها و تعرفه‌های درمانگاه پاستور پلاس در تبریز.",
};

export default function DentalPage() {
  return <DentalHub basePath="/dental" />;
}
