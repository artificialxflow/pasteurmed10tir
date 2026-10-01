import { ConsultationTrack } from "@/components/consultation/ConsultationTrack";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پیگیری مشاوره",
};

export default async function ConsultationTrackWebPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
      <ConsultationTrack id={id} variant="web" />
    </main>
  );
}
