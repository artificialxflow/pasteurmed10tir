import { Children, isValidElement, type ReactNode } from "react";

export function AdminTable({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: ReactNode;
  empty?: string;
}) {
  const hasRows = Children.toArray(children).some(isValidElement);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 text-right font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasRows ? (
            children
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-10 text-center text-slate-500">
                {empty || "موردی یافت نشد."}
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
