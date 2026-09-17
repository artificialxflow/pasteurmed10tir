"use client";

import { FormLabel } from "@/components/ui/Card";
import {
  JALALI_MONTHS,
  JALALI_WEEKDAYS_SHORT,
  gregorianToJalali,
  isoToJalali,
  jalaliMonthLength,
  jalaliToIso,
  jalaliWeekdaySat0,
} from "@/lib/date/jalali";
import { formatJalaliDate } from "@/lib/patient";
import { useEffect, useMemo, useRef, useState } from "react";

function todayJalali() {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function JalaliCalendarField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (iso: string) => void;
  label: string;
}) {
  const selected = isoToJalali(value);
  const today = todayJalali();
  const [open, setOpen] = useState(false);
  const [viewJy, setViewJy] = useState(selected?.jy || today.jy);
  const [viewJm, setViewJm] = useState(selected?.jm || today.jm);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (selected) {
      setViewJy(selected.jy);
      setViewJm(selected.jm);
    }
  }, [open, selected?.jy, selected?.jm]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const cells = useMemo(() => {
    const length = jalaliMonthLength(viewJy, viewJm);
    const start = jalaliWeekdaySat0(viewJy, viewJm, 1);
    const blanks = Array.from({ length: start }, () => null as number | null);
    const days = Array.from({ length }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [viewJy, viewJm]);

  function shiftMonth(delta: number) {
    let jm = viewJm + delta;
    let jy = viewJy;
    if (jm < 1) {
      jm = 12;
      jy -= 1;
    } else if (jm > 12) {
      jm = 1;
      jy += 1;
    }
    setViewJy(jy);
    setViewJm(jm);
  }

  function pick(day: number) {
    const iso = jalaliToIso(viewJy, viewJm, day);
    if (iso) onChange(iso);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <FormLabel>{label}</FormLabel>
      <div className="mt-1 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-right text-sm font-bold text-slate-800"
          onClick={() => setOpen((v) => !v)}
        >
          {value ? formatJalaliDate(value) : "انتخاب از تقویم"}
        </button>
        {value ? (
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500"
            onClick={() => onChange("")}
          >
            پاک
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="absolute z-30 mt-2 w-72 rounded-2xl border border-cyan-100 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm font-bold text-cyan-800 hover:bg-cyan-50"
              onClick={() => shiftMonth(-1)}
            >
              ‹
            </button>
            <p className="text-sm font-extrabold text-slate-900">
              {JALALI_MONTHS[viewJm - 1]} {viewJy.toLocaleString("fa-IR")}
            </p>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm font-bold text-cyan-800 hover:bg-cyan-50"
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {JALALI_WEEKDAYS_SHORT.map((d) => (
              <span key={d} className="text-[0.65rem] font-bold text-slate-400">
                {d}
              </span>
            ))}
            {cells.map((day, idx) => {
              if (!day) {
                return <span key={`e-${idx}`} />;
              }
              const isSelected =
                selected?.jy === viewJy && selected?.jm === viewJm && selected?.jd === day;
              const isToday = today.jy === viewJy && today.jm === viewJm && today.jd === day;
              return (
                <button
                  key={day}
                  type="button"
                  className={`rounded-lg py-1.5 text-xs font-bold ${
                    isSelected
                      ? "bg-cyan-600 text-white"
                      : isToday
                        ? "bg-cyan-50 text-cyan-900"
                        : "text-slate-800 hover:bg-slate-50"
                  }`}
                  onClick={() => pick(day)}
                >
                  {day.toLocaleString("fa-IR")}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
