import { DentalHub } from "@/components/dental/DentalHub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "دندانپزشکی",
};

export default function DentalPage() {
  return <DentalHub basePath="/dental" />;
}
