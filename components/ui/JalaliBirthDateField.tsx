"use client";

import { FormLabel } from "@/components/ui/Card";
import { JALALI_MONTHS, isoToJalali, jalaliToIso } from "@/lib/date/jalali";

const YEARS = Array.from({ length: 90 }, (_, i) => 1410 - i);

export function JalaliBirthDateField({
  value,
  onChange,
  label = "تاریخ تولد (شمسی)",
}: {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
}) {
  const parts = isoToJalali(value);
  const jy = parts?.jy ?? 0;
  const jm = parts?.jm ?? 0;
  const jd = parts?.jd ?? 0;

  function commit(nextY: number, nextM: number, nextD: number) {
    if (!nextY || !nextM || !nextD) {
      onChange("");
      return;
    }
    onChange(jalaliToIso(nextY, nextM, nextD) || "");
  }

  return (
    <div>
      <FormLabel>{label}</FormLabel>
      <div className="mt-1 grid grid-cols-3 gap-2">
        <select
          className="rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-sm"
          value={jd || ""}
          onChange={(e) => commit(jy || 1400, jm || 1, Number(e.target.value) || 0)}
        >
          <option value="">روز</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d.toLocaleString("fa-IR")}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-sm"
          value={jm || ""}
          onChange={(e) => commit(jy || 1400, Number(e.target.value) || 0, jd || 1)}
        >
          <option value="">ماه</option>
          {JALALI_MONTHS.map((name, idx) => (
            <option key={name} value={idx + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-sm"
          value={jy || ""}
          onChange={(e) => commit(Number(e.target.value) || 0, jm || 1, jd || 1)}
        >
          <option value="">سال</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y.toLocaleString("fa-IR")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
