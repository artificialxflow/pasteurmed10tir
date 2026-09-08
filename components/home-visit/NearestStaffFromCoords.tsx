"use client";

import { NearestStaffList, type NearbyStaff } from "@/components/home-visit/NearestStaffList";
import { fetchPublic } from "@/lib/content/client";
import { useEffect, useState } from "react";

export function NearestStaffFromCoords({
  kind,
  lat,
  lng,
  preferredGender,
}: {
  kind: "nurse" | "physician";
  lat?: number | null;
  lng?: number | null;
  preferredGender?: string;
}) {
  const [items, setItems] = useState<NearbyStaff[]>([]);

  useEffect(() => {
    if (lat == null || lng == null) {
      setItems([]);
      return;
    }
    const qs = new URLSearchParams({
      kind,
      lat: String(lat),
      lng: String(lng),
    });
    if (preferredGender && preferredGender !== "any") {
      qs.set("preferredGender", preferredGender);
    }
    void fetchPublic<{ items: NearbyStaff[] }>(`/api/content/nearest-staff?${qs.toString()}`)
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, [kind, lat, lng, preferredGender]);

  if (lat == null || lng == null) return null;
  return <NearestStaffList items={items} />;
}
