import { DentistList } from "@/components/dental/DentistList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "دندانپزشکان",
};

export default function DentalGeneralPage() {
  return <DentistList basePath="/dental" />;
}
