"use client";

import { ClubBrushWidget } from "@/components/club/ClubBrushWidget";
import { usePatientProfile } from "@/lib/auth/use-patient-profile";

export function HomeClubBrushFab() {
  const { profile, loading } = usePatientProfile();
  if (loading || !profile?.phone) return null;
  return <ClubBrushWidget phone={profile.phone} variant="web" layout="floating" />;
}