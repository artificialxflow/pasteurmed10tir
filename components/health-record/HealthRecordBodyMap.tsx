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
import { useEffect, useState } from "react";

function displayLabel(id: HealthSectionId): string {
  return id === "renal" ? renalDisplayLabel() : sectionLabel(id);
}

function PanelPill({
  sectionId,
  previewId,
  committedSection,
  onTap,
}: {
  sectionId: HealthSectionId;
  previewId: HealthSectionId;
  committedSection: HealthSectionId;
  onTap: (id: HealthSectionId) => void;
}) {
  const meta = sectionMeta(sectionId);
  if (!meta) return null;
  const label = displayLabel(sectionId);
  const isPreview = previewId === sectionId;
  const isCommitted = committedSection === sectionId;

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isPreview}
      onClick={() => onTap(sectionId)}
      className={cn(
        "flex w-full items-center justify-center rounded-full border bg-white/95 shadow-sm transition md:justify-start md:gap-1 md:px-1.5 md:py-1",
        isPreview
          ? "border-amber-400 bg-amber-50 ring-2 ring-amber-300/80"
          : isCommitted
            ? "border-cyan-500 bg-cyan-50/90"
            : "border-slate-200/90 hover:border-cyan-300 hover:bg-white",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-sky-200 text-sm md:h-7 md:w-7",
          isPreview && "from-amber-100 to-amber-200",
        )}
      >
        {meta.emoji}
      </span>
      <span className="hidden min-w-0 max-w-[5.5rem] flex-1 truncate text-[0.58rem] font-bold leading-tight text-slate-800 md:block">
        {label}
      </span>
    </button>
  );
}

function SidePanel({
  title,
  sectionIds,
  previewId,
  committedSection,
  onTap,
}: {
  title: string;
  sectionIds: HealthSectionId[];
  previewId: HealthSectionId;
  committedSection: HealthSectionId;
  onTap: (id: HealthSectionId) => void;
}) {
  return (
    <div className="flex w-10 shrink-0 flex-col gap-1 sm:w-11 md:w-[7.25rem] md:gap-1.5">
      <p className="mb-0.5 hidden text-center text-[0.6rem] font-extrabold leading-tight text-cyan-900/80 sm:block md:text-[0.65rem]">
        {title}
      </p>
      {sectionIds.map((id) => (
        <PanelPill
          key={id}
          sectionId={id}
          previewId={previewId}
          committedSection={committedSection}
          onTap={onTap}
        />
      ))}
    </div>
  );
}

function BodyFigure({
  previewId,
  committedSection,
  onTap,
}: {
  previewId: HealthSectionId;
  committedSection: HealthSectionId;
  onTap: (id: HealthSectionId) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="relative mx-auto aspect-[3/5] w-full min-w-0 max-w-none select-none sm:max-w-[300px] md:max-w-[360px] lg:max-w-[400px]">
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
        const isPreview = previewId === spot.sectionId;
        const isCommitted = committedSection === spot.sectionId;
        return (
          <button
            key={spot.id}
            type="button"
            title={spot.label}
            aria-label={spot.label}
            onClick={() => onTap(spot.sectionId)}
            className={cn(
              "absolute cursor-pointer rounded-2xl border-0 bg-transparent p-0 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-500",
              isPreview
                ? "bg-amber-400/25 ring-2 ring-amber-400/90"
                : isCommitted
                  ? "bg-cyan-400/10 ring-1 ring-cyan-400/50"
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
  committedSection,
  onCommit,
}: {
  committedSection: HealthSectionId;
  onCommit: (section: HealthSectionId) => void;
}) {
  const [previewId, setPreviewId] = useState<HealthSectionId>(committedSection);

  useEffect(() => {
    setPreviewId(committedSection);
  }, [committedSection]);

  function handleTap(id: HealthSectionId) {
    if (previewId === id) {
      onCommit(id);
      return;
    }
    setPreviewId(id);
  }

  const previewLabel = displayLabel(previewId);
  const canEnter = previewId !== committedSection;

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-sky-200/80 bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 p-3 shadow-inner sm:p-4">
      <div className="mb-2 text-center sm:mb-3">
        <p className="text-sm font-extrabold text-cyan-950">پرونده سلامت پاستور پلاس</p>
        <p className="text-[0.62rem] leading-5 text-cyan-800/80 sm:text-[0.65rem]">
          یک‌بار بزنید: پیش‌نمایش · دوباره همان گزینه: ورود به بخش
        </p>
      </div>

      <div className="flex items-start justify-center gap-1 sm:gap-2 md:gap-4">
        <SidePanel
          title="گزینه‌های پرونده"
          sectionIds={HEALTH_BODY_PANEL_LEFT}
          previewId={previewId}
          committedSection={committedSection}
          onTap={handleTap}
        />
        <div className="min-w-0 flex-1">
          <BodyFigure
            previewId={previewId}
            committedSection={committedSection}
            onTap={handleTap}
          />
        </div>
        <SidePanel
          title="تخصص‌ها"
          sectionIds={HEALTH_BODY_PANEL_RIGHT}
          previewId={previewId}
          committedSection={committedSection}
          onTap={handleTap}
        />
      </div>

      <div className="mt-3 rounded-xl border border-white/60 bg-white/75 px-3 py-2.5 text-center shadow-sm">
        <p className="text-xs text-slate-700">
          پیش‌نمایش: <span className="font-extrabold text-cyan-950">{previewLabel}</span>
        </p>
        {canEnter ? (
          <button
            type="button"
            onClick={() => onCommit(previewId)}
            className="mt-1.5 text-xs font-bold text-teal-800 underline-offset-2 hover:underline"
          >
            ورود به «{previewLabel}» ↓
          </button>
        ) : (
          <p className="mt-1 text-[0.62rem] text-slate-500">
            در حال ثبت این بخش — برای مرور، گزینه دیگری را بزنید
          </p>
        )}
      </div>
    </div>
  );
}
