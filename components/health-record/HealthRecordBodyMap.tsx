"use client";

import { HEALTH_BODY_MAP_REGIONS, sectionLabel } from "@/lib/health-record/body-map";
import type { HealthSectionId } from "@/lib/health-record/sections";

export function HealthRecordBodyMap({
  activeSection,
  onSelect,
}: {
  activeSection: HealthSectionId;
  onSelect: (section: HealthSectionId) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.25rem] border border-cyan-700/40 bg-gradient-to-b from-slate-900 via-cyan-950 to-slate-900 p-3 sm:p-4">
      <div className="mb-2 text-center">
        <p className="text-sm font-extrabold text-white">پاستور پلاس</p>
        <p className="text-[0.65rem] text-cyan-100/90">سلامت شما، اولویت ماست</p>
      </div>

      <svg
        viewBox="0 0 240 420"
        className="mx-auto h-auto w-full max-w-[280px]"
        role="img"
        aria-label="نقشه بدن — برای انتخاب بخش پرونده روی ناحیه بزنید"
      >
        <defs>
          <linearGradient id="healthBodyFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0e7490" stopOpacity="0.2" />
          </linearGradient>
          <filter id="healthBodyGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* سیلوئت ساده بدن */}
        <ellipse cx="120" cy="52" rx="30" ry="34" fill="url(#healthBodyFill)" stroke="#67e8f9" strokeOpacity="0.35" />
        <path
          d="M88 82 Q120 96 152 82 L162 210 Q120 228 78 210 Z"
          fill="url(#healthBodyFill)"
          stroke="#67e8f9"
          strokeOpacity="0.35"
        />
        <path
          d="M78 108 Q52 130 48 168 Q58 176 72 158 Q82 132 88 118 Z"
          fill="url(#healthBodyFill)"
          stroke="#67e8f9"
          strokeOpacity="0.25"
        />
        <path
          d="M162 108 Q188 130 192 168 Q182 176 168 158 Q158 132 152 118 Z"
          fill="url(#healthBodyFill)"
          stroke="#67e8f9"
          strokeOpacity="0.25"
        />
        <path
          d="M98 210 L92 330 Q120 342 148 330 L142 210 Z"
          fill="url(#healthBodyFill)"
          stroke="#67e8f9"
          strokeOpacity="0.35"
        />
        <path
          d="M92 330 L82 400 Q98 408 108 360 Z"
          fill="url(#healthBodyFill)"
          stroke="#67e8f9"
          strokeOpacity="0.25"
        />
        <path
          d="M148 330 L158 400 Q142 408 132 360 Z"
          fill="url(#healthBodyFill)"
          stroke="#67e8f9"
          strokeOpacity="0.25"
        />

        {HEALTH_BODY_MAP_REGIONS.map((region) => {
          const active = activeSection === region.sectionId;
          return (
            <g key={region.id}>
              <line
                x1={region.x}
                y1={region.y}
                x2={region.labelX + (region.labelX < region.x ? 28 : -28)}
                y2={region.labelY}
                stroke={active ? '#fbbf24' : '#67e8f9'}
                strokeOpacity={active ? 0.9 : 0.45}
                strokeWidth="1"
              />
              <foreignObject
                x={region.labelX < region.x ? region.labelX - 4 : region.labelX - 56}
                y={region.labelY - 12}
                width="60"
                height="24"
              >
                <button
                  type="button"
                  onClick={() => onSelect(region.sectionId)}
                  className={`w-full rounded-full px-2 py-0.5 text-[0.55rem] font-bold leading-tight transition ${
                    active
                      ? 'bg-amber-400 text-slate-900 shadow-md'
                      : 'bg-white/90 text-cyan-950 hover:bg-white'
                  }`}
                >
                  {region.label}
                </button>
              </foreignObject>
              <circle
                cx={region.x}
                cy={region.y}
                r={active ? 11 : 9}
                fill={active ? '#fbbf24' : '#22d3ee'}
                fillOpacity={active ? 0.95 : 0.75}
                stroke="#fff"
                strokeWidth="1.5"
                filter={active ? 'url(#healthBodyGlow)' : undefined}
                className="cursor-pointer"
                onClick={() => onSelect(region.sectionId)}
              />
              <circle
                cx={region.x}
                cy={region.y}
                r="18"
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelect(region.sectionId)}
              >
                <title>{region.label}</title>
              </circle>
            </g>
          );
        })}
      </svg>

      <p className="mx-auto mt-2 max-w-xs rounded-full bg-white/10 px-3 py-1.5 text-center text-[0.65rem] text-cyan-50">
        برای رفتن به بخش پرونده، روی ناحیه یا برچسب بزنید
      </p>
      {activeSection ? (
        <p className="mt-2 text-center text-xs font-bold text-amber-300">
          انتخاب‌شده: {sectionLabel(activeSection)}
        </p>
      ) : null}
    </div>
  );
}
