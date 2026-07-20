import { SpecialtyList } from "@/components/dental/SpecialtyList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تخصصی | دندانپزشکی",
};

export default function DentalSpecialtyPage() {
  return <SpecialtyList basePath="/dental" />;
}
