import { MedicalHub } from "@/components/medical/MedicalHub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پزشکی",
  description: "بخش پزشکی — مشاوره و ویزیت پاستور پلاس",
};

export default function MedicalPage() {
  return <MedicalHub basePath="/medical" />;
}
