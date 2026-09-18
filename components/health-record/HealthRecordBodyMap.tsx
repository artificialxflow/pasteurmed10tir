"use client";

import {
  HEALTH_BODY_HOTSPOTS,
  HEALTH_BODY_IMAGE,
  HEALTH_BODY_PANEL_LEFT,
  HEALTH_BODY_PANEL_RIGHT,
  renalDisplayLabel,
  sectionLabel,
  sectionMeta,
} from "@/lib/health-record/body-map";
import type { HealthSectionId } from "@/lib/health-record/sections";
import { cn } from "@/lib/utils";
import { useState } from "react";

function PanelPill({
  sectionId,
  active,
  onSelect,
}: {
  sectionId: HealthSectionId;
  active: boolean;
  onSelect: (id: HealthSectionId) => void;
}) {
  const meta = sectionMeta(sectionId);
  if (!meta) return null;
  const label = sectionId === "renal" ? renalDisplayLabel() : meta.label;

  return (
    <button
      type="button"
      onClick={() => onSelect(sectionId)}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-full border bg-white/95 px-2 py-1.5 text-right shadow-sm transition",
        active
          ? "border-cyan-500 bg-cyan-50 text-cyan-950 ring-2 ring-cyan-200"
          : "border-slate-200/90 text-slate-800 hover:border-cyan-300 hover:bg-white",
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-sky-200 text-sm">
        {meta.emoji}
      </span>
      <span className="min-w-0 flex-1 text-[0.62rem] font-bold leading-tight">{label}</span>
    </button>
  );
}

function SidePanel({
  title,
  sectionIds,
  activeSection,
  onSelect,
}: {
  title: string;
  sectionIds: HealthSectionId[];
  activeSection: HealthSectionId;
  onSelect: (id: HealthSectionId) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <p className="mb-0.5 text-center text-[0.65rem] font-extrabold text-cyan-900/80">{title}</p>
      {sectionIds.map((id) => (
        <PanelPill key={id} sectionId={id} active={activeSection === id} onSelect={onSelect} />
      ))}
    </div>
  );
}

function BodyFigure({
  activeSection,
  onSelect,
}: {
  activeSection: HealthSectionId;
  onSelect: (id: HealthSectionId) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="relative mx-auto aspect-[3/5] w-full max-w-[200px] select-none">
      {!imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={HEALTH_BODY_IMAGE}
          alt=""
          className="pointer-events-none h-full w-full object-contain drop-shadow-lg"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <svg viewBox="0 0 200 340" className="h-full w-full" aria-hidden>
          <defs>
            <radialGradient id="bodyBg" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.15" />
            </radialGradient>
            <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.2" />
            </radialGradient>
            <radialGradient id="heartGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.2" />
            </radialGradient>
            <radialGradient id="kidneyGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0.25" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="170" rx="72" ry="155" fill="url(#bodyBg)" />
          <ellipse cx="100" cy="48" rx="28" ry="32" fill="#38bdf8" fillOpacity="0.35" stroke="#7dd3fc" strokeOpacity="0.4" />
          <path
            d="M72 78 Q100 92 128 78 L138 200 Q100 218 62 200 Z"
            fill="#38bdf8"
            fillOpacity="0.28"
            stroke="#7dd3fc"
            strokeOpacity="0.35"
          />
          <path d="M78 200 L72 310 Q100 322 128 310 L122 200 Z" fill="#38bdf8" fillOpacity="0.28" />
          <ellipse cx="100" cy="42" rx="14" ry="12" fill="url(#brainGlow)" />
          <ellipse cx="96" cy="118" rx="11" ry="10" fill="url(#heartGlow)" />
          <ellipse cx="78" cy="168" rx="9" ry="7" fill="url(#kidneyGlow)" />
          <ellipse cx="122" cy="168" rx="9" ry="7" fill="url(#kidneyGlow)" />
        </svg>
      )}

      {HEALTH_BODY_HOTSPOTS.map((spot) => {
        const active = activeSection === spot.sectionId;
        return (
          <button
            key={spot.id}
            type="button"
            title={spot.label}
            aria-label={spot.label}
            onClick={() => onSelect(spot.sectionId)}
            className={cn(
              "absolute cursor-pointer rounded-2xl border-0 bg-transparent p-0 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-500",
              active
                ? "bg-amber-400/20 ring-2 ring-amber-400/80"
                : "opacity-0 hover:opacity-100 hover:bg-cyan-400/10 focus-visible:opacity-100",
            )}
            style={{
              left: `${spot.left}%`,
              top: `${spot.top}%`,
              width: `${spot.width}%`,
              height: `${spot.height}%`,
            }}
          />
        );
      })}
    </div>
  );
}

export function HealthRecordBodyMap({
  activeSection,
  onSelect,
}: {
  activeSection: HealthSectionId;
  onSelect: (section: HealthSectionId) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-sky-200/80 bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 p-3 shadow-inner sm:p-4">
      <div className="mb-3 text-center">
        <p className="text-sm font-extrabold text-cyan-950">پرونده سلامت پاستور پلاس</p>
        <p className="text-[0.65rem] text-cyan-800/80">روی بدن یا گزینه‌های کنار بزنید</p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(130px,200px)_minmax(0,1fr)] items-start gap-2 sm:gap-3">
        <SidePanel
          title="گزینه‌های پرونده"
          sectionIds={HEALTH_BODY_PANEL_LEFT}
          activeSection={activeSection}
          onSelect={onSelect}
        />
        <BodyFigure activeSection={activeSection} onSelect={onSelect} />
        <SidePanel
          title="تخصص‌ها"
          sectionIds={HEALTH_BODY_PANEL_RIGHT}
          activeSection={activeSection}
          onSelect={onSelect}
        />
      </div>

      {activeSection ? (
        <p className="mt-3 text-center text-xs font-bold text-cyan-900">
          انتخاب‌شده:{" "}
          {activeSection === "renal" ? renalDisplayLabel() : sectionLabel(activeSection)}
        </p>
      ) : null}
    </div>
  );
}
