"use client";

import { AssistantChat } from "@/components/ai/AssistantChat";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AssistantWidget({ variant }: { variant: "web" | "app" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const assistantHref = variant === "app" ? ROUTES.app.assistant : ROUTES.web.assistant;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname === assistantHref) return null;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-label="دستیار هوشمند"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-700 text-2xl text-white shadow-lg",
          /* RTL: start = راست فیزیکی؛ پشتیبانی چپ (left-3) می‌ماند */
          variant === "app" ? "bottom-24 start-4" : "bottom-6 start-6",
        )}
      >
        🤖
      </button>
      {open ? (
        <div
          className={cn(
            "fixed z-40 flex w-[min(100vw-1.5rem,24rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
            variant === "app" ? "bottom-40 start-3" : "bottom-24 start-6",
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
            <span className="text-sm font-bold text-slate-800">دستیار پاستور پلاس</span>
            <div className="flex gap-2">
              <Link href={assistantHref} className="text-xs font-bold text-cyan-800 underline">
                صفحه کامل
              </Link>
              <button type="button" className="text-xs text-slate-500" onClick={() => setOpen(false)}>
                بستن
              </button>
            </div>
          </div>
          <AssistantChat compact className="border-0 shadow-none" />
        </div>
      ) : null}
    </>
  );
}
