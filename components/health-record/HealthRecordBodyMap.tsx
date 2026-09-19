"use client";

import {
  HEALTH_BODY_HOTSPOTS,
  HEALTH_BODY_IMAGE,
  HEALTH_BODY_IMAGE_SIZE,
  HEALTH_BODY_PANEL_BOTTOM,
  HEALTH_BODY_PANEL_LEFT,
  HEALTH_BODY_PANEL_RIGHT,
  hotspotStyle,
  renalDisplayLabel,
  sectionLabel,
  sectionMeta,
} from "@/lib/health-record/body-map";
import type { HealthSectionId } from "@/lib/health-record/sections";
import { cn } from "@/lib/utils";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

function displayLabel(id: HealthSectionId): string {
  return id === "renal" ? renalDisplayLabel() : sectionLabel(id);
}

function PanelPill({
  sectionId,
  previewId,
  committedSection,
  onTap,
  variant = "side",
}: {
  sectionId: HealthSectionId;
  previewId: HealthSectionId;
  committedSection: HealthSectionId;
  onTap: (id: HealthSectionId) => void;
  variant?: "side" | "bottom";
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
        "rounded-full border bg-white/95 shadow-sm transition",
        variant === "side"
          ? "flex w-full items-center justify-center md:justify-start md:gap-1.5 md:px-2 md:py-1.5"
          : "flex min-w-[2.75rem] flex-col items-center gap-0.5 px-1 py-1 sm:min-w-[3.25rem] sm:px-1.5 sm:py-1.5 md:min-w-[4.5rem]",
        isPreview
          ? "border-amber-400 bg-amber-50 ring-2 ring-amber-300/80"
          : isCommitted
            ? "border-cyan-500 bg-cyan-50/90"
            : "border-slate-200/90 hover:border-cyan-300 hover:bg-white",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-sky-200",
          variant === "side"
            ? "h-10 w-10 text-base md:h-9 md:w-9 md:text-sm"
            : "h-9 w-9 text-sm sm:h-10 sm:w-10",
          isPreview && "from-amber-100 to-amber-200",
        )}
      >
        {meta.emoji}
      </span>
      {variant === "side" ? (
        <span className="hidden min-w-0 max-w-[6.5rem] flex-1 truncate text-xs font-bold leading-tight text-slate-800 md:block">
          {label}
        </span>
      ) : (
        <span className="max-w-[4.5rem] truncate text-center text-[9px] font-bold leading-tight text-slate-700 sm:text-[10px] md:max-w-[5.5rem] md:text-xs">
          {label}
        </span>
      )}
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
    <div className="flex w-11 shrink-0 flex-col gap-1 sm:w-12 md:w-[8.5rem] md:gap-1.5">
      <p className="mb-0.5 hidden text-center text-xs font-extrabold leading-tight text-cyan-900/90 sm:block">
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

function BottomPanel({
  sectionIds,
  previewId,
  committedSection,
  onTap,
}: {
  sectionIds: HealthSectionId[];
  previewId: HealthSectionId;
  committedSection: HealthSectionId;
  onTap: (id: HealthSectionId) => void;
}) {
  return (
    <div className="mt-2 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px]">
      <div className="flex flex-wrap items-start justify-center gap-1 sm:gap-1.5">
        {sectionIds.map((id) => (
          <PanelPill
            key={id}
            variant="bottom"
            sectionId={id}
            previewId={previewId}
            committedSection={committedSection}
            onTap={onTap}
          />
        ))}
      </div>
    </div>
  );
}

function useBodyFigureLayout() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [imageSize, setImageSize] = useState(HEALTH_BODY_IMAGE_SIZE);

  useLayoutEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ w: rect.width, h: rect.height });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { boxRef, size, imageSize, setImageSize };
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
  const previewLabel = displayLabel(previewId);
  const { boxRef, size, imageSize, setImageSize } = useBodyFigureLayout();

  return (
    <div className="relative mx-auto w-full min-w-[140px] max-w-[220px] select-none sm:max-w-[280px] md:max-w-[340px] lg:max-w-[380px]">
      <div
        className="mb-1.5 rounded-full border border-amber-200/80 bg-amber-50/95 px-3 py-1.5 text-center shadow-sm md:hidden"
        aria-live="polite"
      >
        <p className="text-xs font-extrabold text-amber-950">{previewLabel}</p>
      </div>

      <div ref={boxRef} className="relative aspect-[3/5] w-full">
        {!imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={HEALTH_BODY_IMAGE}
            alt=""
            className="pointer-events-none h-full w-full object-contain drop-shadow-lg"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
              }
            }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <svg viewBox="0 0 200 340" className="h-full w-full" aria-hidden>
            <defs>
              <radialGradient id="bodyBg" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.15" />
              </radialGradient>
            </defs>
            <ellipse cx="100" cy="170" rx="72" ry="155" fill="url(#bodyBg)" />
          </svg>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 hidden text-center md:block">
          <span className="inline-block rounded-full border border-amber-200/90 bg-amber-50/95 px-4 py-1 text-sm font-extrabold text-amber-950 shadow-sm">
            {previewLabel}
          </span>
        </div>

        {HEALTH_BODY_HOTSPOTS.map((spot) => {
          const isPreview = previewId === spot.sectionId;
          const isCommitted = committedSection === spot.sectionId;
          const pos = hotspotStyle(
            spot,
            size?.w,
            size?.h,
            imageSize.width,
            imageSize.height,
          );
          return (
            <button
              key={spot.id}
              type="button"
              title={spot.label}
              aria-label={spot.label}
              onClick={() => onTap(spot.sectionId)}
              className={cn(
                "absolute z-[1] cursor-pointer rounded-2xl border-0 bg-transparent p-0 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-500",
                isPreview
                  ? "z-[3] bg-amber-400/25 ring-2 ring-amber-400/90"
                  : isCommitted
                    ? "z-[2] bg-cyan-400/10 ring-1 ring-cyan-400/50"
                    : "opacity-0 hover:z-[2] hover:opacity-100 hover:bg-cyan-400/10 focus-visible:opacity-100",
              )}
              style={pos}
            />
          );
        })}
      </div>
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
        <p className="text-sm font-extrabold text-cyan-950 sm:text-base">پرونده سلامت پاستور پلاس</p>
        <p className="text-xs leading-5 text-cyan-800/85">
          یک‌بار بزنید: پیش‌نمایش · دوباره همان گزینه: ورود به بخش
        </p>
      </div>

      <div className="mx-auto flex w-fit max-w-full items-start justify-center gap-0.5 sm:gap-1 md:gap-2">
        <SidePanel
          title="گزینه‌های پرونده"
          sectionIds={HEALTH_BODY_PANEL_LEFT}
          previewId={previewId}
          committedSection={committedSection}
          onTap={handleTap}
        />
        <div className="flex min-w-0 flex-col items-center">
          <BodyFigure previewId={previewId} committedSection={committedSection} onTap={handleTap} />
          <BottomPanel
            sectionIds={HEALTH_BODY_PANEL_BOTTOM}
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

      <div className="mx-auto mt-3 max-w-md rounded-xl border border-white/60 bg-white/75 px-3 py-2.5 text-center shadow-sm">
        <p className="text-sm text-slate-700">
          پیش‌نمایش: <span className="font-extrabold text-cyan-950">{previewLabel}</span>
        </p>
        {canEnter ? (
          <button
            type="button"
            onClick={() => onCommit(previewId)}
            className="mt-1.5 text-sm font-bold text-teal-800 underline-offset-2 hover:underline"
          >
            ورود به «{previewLabel}» ↓
          </button>
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            در حال ثبت این بخش — برای مرور، گزینه دیگری را بزنید
          </p>
        )}
      </div>
    </div>
  );
}
