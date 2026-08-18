"use client";

import type { PatientProfile } from "@/lib/patient";
import { useCallback, useEffect, useState } from "react";

export const PATIENT_AUTH_EVENT = "pasteur-patient-auth";

export function notifyPatientAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PATIENT_AUTH_EVENT));
}

export function usePatientProfile() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setProfile(null);
        return;
      }
      const data = (await res.json()) as { profile?: PatientProfile | null };
      setProfile(data.profile ?? null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onAuth = () => {
      void refresh();
    };
    window.addEventListener(PATIENT_AUTH_EVENT, onAuth);
    return () => window.removeEventListener(PATIENT_AUTH_EVENT, onAuth);
  }, [refresh]);

  return { profile, loading, refresh };
}
