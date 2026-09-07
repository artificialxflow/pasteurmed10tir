"use client";

import { AssignedStaffCard } from "@/components/home-visit/AssignedStaffCard";
import { NearestStaffList, type NearbyStaff } from "@/components/home-visit/NearestStaffList";
import { ServiceReviewForm } from "@/components/home-visit/ServiceReviewForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Timeline } from "@/components/ui/Timeline";
import { homeVisitKindLabel, homeVisitStatusLabel } from "@/lib/home-visit/labels";
import { buildHomeVisitTimeline } from "@/lib/home-visit/timeline";
import { fetchPatientOps } from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import { useCallback, useEffect, useMemo, useState } from "react";

type TrackItem = {
  id: string;
  kind?: string;
  serviceTitle?: string;
  specialtyLabel?: string;
  status: string;
  createdAt: string;
  assignedAt?: string;
  patientAreaLabel?: string;
  assignedStaff?: {
    name?: string;
    kind?: string;
    image?: string;
    specialty?: string;
  } | null;
  nearbyStaff?: NearbyStaff[];
  statusEvents?: Array<{ status: string; createdAt: string }>;
  review?: { rating?: number; status?: string; comment?: string } | null;
};

export function HomeVisitTrack({
  id,
  variant,
}: {
  id: string;
  variant: "web" | "app";
}) {
  const [item, setItem] = useState<TrackItem | null>(null);
  const [error, setError] = useState("");
  const accountHref = variant === "app" ? ROUTES.app.account : ROUTES.web.account;

  const reload = useCallback(async () => {
    const data = await fetchPatientOps<{ item: TrackItem }>(
      `/api/operations/home-visits/${encodeURIComponent(id)}`,
    );
    setItem(data.item);
  }, [id]);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "بارگذاری ناموفق"));
  }, [reload]);

  const timeline = useMemo(
    () =>
      item
        ? buildHomeVisitTimeline({
            status: item.status,
            createdAt: item.createdAt,
            assignedAt: item.assignedAt,
            events: item.statusEvents,
          })
        : [],
    [item],
  );

  if (error) {
    return (
      <Card hover={false} className="p-5">
        <p className="text-sm font-bold text-red-600">{error}</p>
        <Button href={accountHref} variant="ghost" className="mt-4">
          بازگشت به پنل
        </Button>
      </Card>
    );
  }

  if (!item) {
    return <p className="text-sm text-slate-500">در حال بارگذاری...</p>;
  }

  return (
    <div className="space-y-4">
      <Card hover={false} className="p-5">
        <p className="text-xs font-bold text-slate-500">{homeVisitKindLabel(item.kind)}</p>
        <h1 className="mt-1 text-lg font-extrabold text-slate-900">
          {item.serviceTitle || item.specialtyLabel || "اعزام خانگی"}
        </h1>
        <p className="mt-1 text-xs text-slate-500">{homeVisitStatusLabel(item.status)}</p>
      </Card>

      <Card hover={false} className="p-5">
        <p className="mb-3 text-sm font-extrabold text-slate-900">نیروی اعزام‌شده</p>
        <AssignedStaffCard
          staff={item.assignedStaff || null}
          status={item.status}
          kind={item.kind}
          serviceTitle={item.serviceTitle || item.specialtyLabel}
          areaLabel={item.patientAreaLabel}
        />
      </Card>

      {item.nearbyStaff?.length ? (
        <Card hover={false} className="p-5">
          <NearestStaffList items={item.nearbyStaff} />
        </Card>
      ) : null}

      <Card hover={false} className="p-5">
        <p className="mb-4 text-sm font-extrabold text-slate-900">پیگیری درخواست</p>
        <Timeline items={timeline} />
      </Card>

      {item.status === "completed" && !item.review ? (
        <ServiceReviewForm requestId={item.id} onDone={() => void reload()} />
      ) : null}

      {item.review ? (
        <Card hover={false} className="border-teal-100 bg-teal-50/70 p-4">
          <p className="text-sm font-bold text-teal-900">امتیاز شما ثبت شد</p>
          <p className="mt-1 text-xs text-slate-600">
            {"★".repeat(Number(item.review.rating) || 0)}
            {item.review.status === "pending" ? " · در انتظار تأیید" : ""}
          </p>
          {item.review.comment ? <p className="mt-2 text-sm text-slate-700">{item.review.comment}</p> : null}
        </Card>
      ) : null}

      <Button href={accountHref} variant="outline" className="w-full">
        بازگشت به پنل کاربری
      </Button>
    </div>
  );
}
