import { cn } from "@/lib/utils";
import { Children, isValidElement, type ReactNode } from "react";

export function AdminTable({
  headers,
  children,
  empty,
  compact,
  colWidths,
  minTableWidth,
}: {
  headers: string[];
  children: ReactNode;
  empty?: string;
  /** فشرده‌تر برای جدول‌های پرستون */
  compact?: boolean;
  /** با table-fixed — مثلاً ["14%","22%",...] */
  colWidths?: string[];
  minTableWidth?: string;
}) {
  const hasRows = Children.toArray(children).some(isValidElement);
  const thPad = compact ? "px-2 py-2 text-xs" : "px-4 py-3.5";

  return (
    <div className="overflow-x-auto rounded-2xl border border-cyan-100 bg-white shadow-[0_10px_32px_-28px_rgb(8_145_178_/_0.35)]">
      <table
        className={cn(
          "w-full text-sm",
          colWidths?.length ? "table-fixed" : "min-w-full",
          minTableWidth,
        )}
      >
        {colWidths?.length ? (
          <colgroup>
            {colWidths.map((w, i) => (
              <col key={`${w}-${i}`} style={{ width: w }} />
            ))}
          </colgroup>
        ) : null}
        <thead className="border-b border-cyan-100 bg-gradient-to-l from-cyan-50/80 to-slate-50 text-slate-600">
          <tr>
            {headers.map((h) => (
              <th key={h} className={cn("whitespace-nowrap text-right font-bold", thPad)}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {hasRows ? (
            children
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-14 text-center">
                <p className="text-sm font-bold text-slate-500">{empty || "موردی یافت نشد."}</p>
                <p className="mt-1 text-xs text-slate-400">پس از ثبت داده در سایت، اینجا نمایش داده می‌شود.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AdminBadge({
  tone = "neutral",
  children,
}: {
  tone?: "success" | "warn" | "danger" | "neutral" | "info";
  children: ReactNode;
}) {
  const tones = {
    success: "bg-green-100 text-green-800 border-green-300",
    warn: "bg-amber-100 text-amber-900 border-amber-300",
    danger: "bg-slate-100 text-slate-600 border-slate-300",
    neutral: "bg-slate-100 text-slate-700 border-slate-300",
    info: "bg-blue-100 text-blue-800 border-blue-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
