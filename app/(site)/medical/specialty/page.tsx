import { MedicalSpecialtyList } from "@/components/medical/MedicalSpecialtyList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تخصص‌های پزشکی",
};

export default function MedicalSpecialtyPage() {
  return <MedicalSpecialtyList basePath="/medical" />;
}
