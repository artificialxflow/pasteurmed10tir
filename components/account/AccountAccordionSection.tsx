"use client";

import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

export function AccountAccordionSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <span className="block text-sm font-extrabold text-slate-900">{title}</span>
          {summary ? <span className="mt-0.5 block text-xs text-slate-500">{summary}</span> : null}
        </span>
        <span
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition",
            open && "rotate-180 bg-teal-50 text-teal-800",
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open ? <div className="border-t border-slate-100 px-4 py-4">{children}</div> : null}
    </div>
  );
}
