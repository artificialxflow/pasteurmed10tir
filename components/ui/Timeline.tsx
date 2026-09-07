import type { TimelineItem } from "@/lib/home-visit/timeline";
import { cn } from "@/lib/utils";

export type { TimelineItem };

const stateDot: Record<TimelineItem["state"], string> = {
  done: "border-teal-600 bg-teal-600 text-white",
  current: "border-amber-500 bg-amber-50 text-amber-800 ring-4 ring-amber-100",
  upcoming: "border-slate-300 bg-white text-slate-400",
  cancelled: "border-rose-500 bg-rose-500 text-white",
};

const stateText: Record<TimelineItem["state"], string> = {
  done: "text-slate-800",
  current: "font-extrabold text-amber-900",
  upcoming: "text-slate-400",
  cancelled: "font-extrabold text-rose-800",
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-4 pr-1">
      {items.map((item, index) => (
        <li key={item.key} className="flex gap-3">
          <div className="flex w-6 shrink-0 flex-col items-center">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[0.65rem] font-extrabold",
                stateDot[item.state],
              )}
            >
              {item.state === "done" ? "✓" : item.state === "cancelled" ? "×" : index + 1}
            </span>
            {index < items.length - 1 ? (
              <span
                className={cn(
                  "mt-1 w-px flex-1 min-h-[1.25rem]",
                  item.state === "done" ? "bg-teal-300" : "bg-slate-200",
                )}
              />
            ) : null}
          </div>
          <div className={cn("min-w-0 pb-1", stateText[item.state])}>
            <p className="text-sm">{item.label}</p>
            {item.timeLabel ? <p className="mt-0.5 text-xs text-slate-500">{item.timeLabel}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
