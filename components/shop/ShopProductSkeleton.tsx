import { cn } from "@/lib/utils";

export function ShopProductCardSkeleton({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white",
        className,
      )}
    >
      <div className={cn("bg-slate-200", compact ? "h-32" : "h-36")} />
      <div className="space-y-2 p-3">
        <div className="h-3 w-14 rounded-full bg-slate-200" />
        <div className="h-4 w-4/5 rounded bg-slate-200" />
        <div className="h-4 w-2/5 rounded bg-slate-200" />
        {!compact ? <div className="mt-2 h-9 w-full rounded-full bg-slate-200" /> : null}
      </div>
    </div>
  );
}

export function ShopProductGridSkeleton({
  count = 6,
  variant = "web",
  compact = false,
}: {
  count?: number;
  variant?: "web" | "app";
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        variant === "app"
          ? "grid-cols-2"
          : compact
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <ShopProductCardSkeleton key={i} compact={compact} />
      ))}
    </div>
  );
}

export function ShopCategorySectionsSkeleton({
  variant = "web",
  sectionCount = 2,
}: {
  variant?: "web" | "app";
  sectionCount?: number;
}) {
  return (
    <div className="space-y-10">
      {Array.from({ length: sectionCount }, (_, i) => (
        <section key={i}>
          <div className="mb-4 animate-pulse space-y-2">
            <div className="h-6 w-40 rounded bg-slate-200" />
            <div className="h-4 w-56 rounded bg-slate-100" />
          </div>
          <ShopProductGridSkeleton count={variant === "app" ? 4 : 4} variant={variant} compact />
        </section>
      ))}
    </div>
  );
}

export function ShopCartSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 2 }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-3"
        >
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/5 rounded bg-slate-200" />
            <div className="h-4 w-1/3 rounded bg-slate-100" />
          </div>
          <div className="h-8 w-24 rounded-lg bg-slate-200" />
        </div>
      ))}
      <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
        <div className="space-y-3">
          <div className="h-4 rounded bg-slate-100" />
          <div className="h-4 rounded bg-slate-100" />
          <div className="h-5 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function ShopStatSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-cyan-100 bg-white/85 p-4 text-center">
      <div className="mx-auto h-8 w-10 rounded bg-slate-200" />
      <div className="mx-auto mt-2 h-3 w-16 rounded bg-slate-100" />
    </div>
  );
}
