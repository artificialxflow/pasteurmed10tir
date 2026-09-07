import { HomeVisitTrack } from "@/components/home-visit/HomeVisitTrack";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پیگیری اعزام خانگی",
};

export default async function HomeVisitTrackWebPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
      <HomeVisitTrack id={id} variant="web" />
    </main>
  );
}
