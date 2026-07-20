"use client";

import { PasteurStorage } from "@/lib/storage";
import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** On narrow screens, redirect to /app if user previously chose mobile view. */
export function MobileAppRedirect() {
  const router = useRouter();
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (window.innerWidth > 767) return;
      if (window.location.pathname.startsWith("/app") || window.location.pathname.startsWith("/admin")) return;
      if (PasteurStorage.getAppView() === "app") {
        router.replace(ROUTES.app.home);
      }
    } catch {
      /* ignore */
    }
  }, [router]);
  return null;
}
