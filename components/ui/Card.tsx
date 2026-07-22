import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
  vip,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  vip?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] border bg-gradient-to-b from-white to-white/95 p-4 shadow-[0_10px_32px_-26px_rgb(8_145_178_/_0.4)]",
        vip
          ? "border-amber-400/55 bg-gradient-to-br from-orange-50 via-white to-amber-50"
          : "border-sky-200/90",
        hover && "transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-[0_18px_40px_-28px_rgb(8_145_178_/_0.5)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  status,
}: {
  status: "available" | "busy" | "inactive" | string;
}) {
  const map: Record<string, { text: string; cls: string }> = {
    available: { text: "آزاد", cls: "bg-green-100 text-green-800 border-green-300" },
    busy: { text: "مشغول", cls: "bg-amber-100 text-amber-900 border-amber-300" },
    inactive: { text: "غیرفعال", cls: "bg-slate-100 text-slate-600 border-slate-300" },
  };
  const item = map[status] || map.inactive;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold", item.cls)}>
      {item.text}
    </span>
  );
}

export function FormLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-sm font-bold text-slate-700">{children}</label>;
}

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-right text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-cyan-100",
        props.className,
      )}
    />
  );
}

export function FormTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full min-h-[100px] rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-right text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-cyan-100",
        props.className,
      )}
    />
  );
}

export function FormSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-right text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-cyan-100",
        props.className,
      )}
    />
  );
}

export function EmptyState({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-10 text-center">
      <p className="font-bold text-slate-800">{title}</p>
      {desc ? <p className="mt-2 text-sm text-slate-500">{desc}</p> : null}
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="پاستور پلاس" className={cn("h-10 w-10 object-contain rounded-lg bg-white", className)} />
  );
}
