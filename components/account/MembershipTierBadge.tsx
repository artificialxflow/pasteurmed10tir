"use client";

import { getMyMembershipApplicationsApi } from "@/lib/commerce/client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export type ActiveMembershipTier = "regular" | "vip" | null;

function resolveTierFromApplications(
  items: Array<Record<string, unknown>>,
): ActiveMembershipTier {
  const paid = items.filter((a) => {
    const status = String(a.status || "").toLowerCase();
    return status === "paid" || status === "approved";
  });
  if (!paid.length) return null;
  const hasVip = paid.some((a) => {
    const tier = String(a.planId || a.tier || a.loanTier || "").toLowerCase();
    const name = String(a.planName || a.planTitle || "").toLowerCase();
    return tier.includes("vip") || name.includes("vip");
  });
  if (hasVip) return "vip";
  const hasRegular = paid.some((a) => Number(a.memberCount || a.amount || 0) > 0 || a.planId);
  return hasRegular ? "regular" : null;
}

export function MembershipTierBadge({
  phone,
  className,
  showName,
  name,
}: {
  phone: string;
  className?: string;
  showName?: boolean;
  name?: string;
}) {
  const [tier, setTier] = useState<ActiveMembershipTier>(null);

  useEffect(() => {
    void getMyMembershipApplicationsApi()
      .then((data) => setTier(resolveTierFromApplications(data.items || [])))
      .catch(() => setTier(null));
  }, [phone]);

  if (!tier && !showName) return null;

  const tierLabel = tier === "vip" ? "عضو VIP" : tier === "regular" ? "عضو عادی" : null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {showName && name ? (
        <span
          className={cn(
            "text-lg font-extrabold",
            tier === "vip" && "bg-gradient-to-l from-amber-600 to-amber-400 bg-clip-text text-transparent",
            tier === "regular" && "text-slate-500",
            !tier && "text-slate-900",
          )}
        >
          {name}
        </span>
      ) : null}
      {tierLabel ? (
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-extrabold",
            tier === "vip" && "border-amber-300 bg-amber-50 text-amber-900",
            tier === "regular" && "border-slate-300 bg-slate-100 text-slate-700",
          )}
        >
          {tierLabel}
        </span>
      ) : null}
    </div>
  );
}