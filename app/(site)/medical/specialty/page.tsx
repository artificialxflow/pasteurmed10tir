import { MedicalSpecialtyList } from "@/components/medical/MedicalSpecialtyList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تخصص‌های پزشکی",
  description: "تخصص‌های پزشکی و نوبت ویزیت در پاستور پلاس.",
};

export default function MedicalSpecialtyPage() {
  return <MedicalSpecialtyList basePath="/medical" />;
}
