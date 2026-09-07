"use client";

import { NearestStaffList, type NearbyStaff } from "@/components/home-visit/NearestStaffList";
import { fetchPublic } from "@/lib/content/client";
import { useEffect, useState } from "react";

export function NearestStaffFromCoords({
  kind,
  lat,
  lng,
}: {
  kind: "nurse" | "physician";
  lat?: number | null;
  lng?: number | null;
}) {
  const [items, setItems] = useState<NearbyStaff[]>([]);

  useEffect(() => {
    if (lat == null || lng == null) {
      setItems([]);
      return;
    }
    void fetchPublic<{ items: NearbyStaff[] }>(
      `/api/content/nearest-staff?kind=${kind}&lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
    )
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, [kind, lat, lng]);

  if (lat == null || lng == null) return null;
  return <NearestStaffList items={items} />;
}
