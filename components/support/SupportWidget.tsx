"use client";

import { Button } from "@/components/ui/Button";
import { FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { usePatientProfile } from "@/lib/auth/use-patient-profile";
import { postPatientOps } from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import {
  isPaymentPath,
  SUPPORT_WIDGET_OPTIONS,
  SUPPORT_WIDGET_OTHER_SUBJECT,
  SUPPORT_WIDGET_TITLE,
  type SupportWidgetVariant,
} from "@/lib/support/widget";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

export function SupportWidget({
  variant,
  liftForNav = true,
}: {
  variant: SupportWidgetVariant;
  liftForNav?: boolean;
}) {
  const pathname = usePathname();
  const { profile } = usePatientProfile();
  const panelId = useId();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [askOther, setAskOther] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOpen(false);
    setAskOther(false);
    setError("");
    setOk("");
  }, [pathname]);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    if (profile?.phone) setPhone(profile.phone);
  }, [profile?.name, profile?.phone]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (isPaymentPath(pathname)) return null;

  const supportHref = variant === "app" ? ROUTES.app.support : ROUTES.web.support;
  const isApp = variant === "app";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedBody = body.trim();
    if (!trimmedName || !trimmedPhone) {
      setError("نام و موبایل الزامی است.");
      return;
    }
    if (!trimmedBody) {
      setError("متن سؤال را بنویسید.");
      return;
    }
    setBusy(true);
    try {
      await postPatientOps("/api/operations/support/tickets", {
        subject: SUPPORT_WIDGET_OTHER_SUBJECT,
        body: trimmedBody,
        name: trimmedName,
        phone: trimmedPhone,
      });
      setOk("تیکت ثبت شد. از صفحه پشتیبانی می‌توانید پیگیری کنید.");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          className={cn(isApp ? "absolute" : "fixed", "inset-0 z-20 cursor-default bg-transparent")}
          aria-label="بستن پشتیبانی"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div
        className={cn(
          isApp ? "absolute z-30" : "fixed z-30",
          "left-3",
          isApp
            ? liftForNav
              ? "bottom-[calc(0.75rem+var(--app-nav-height)+0.75rem)]"
              : "bottom-4"
            : liftForNav
              ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6"
              : "bottom-6",
        )}
      >
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            "mb-3 flex max-h-[min(28rem,70dvh)] w-[min(20.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-xl",
            "animate-[appEnter_0.18s_ease]",
          )}
        >
          <div className="flex items-start justify-between gap-2 border-b border-cyan-50 bg-cyan-50/70 px-3 py-2.5">
            <p id={titleId} className="text-sm font-extrabold text-slate-900">
              {SUPPORT_WIDGET_TITLE}
            </p>
            <button
              ref={closeRef}
              type="button"
              className="rounded-lg px-2 py-0.5 text-sm font-bold text-slate-500 hover:bg-white"
              aria-label="بستن پشتیبانی"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {!askOther ? (
              <>
                {SUPPORT_WIDGET_OPTIONS.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href[variant]}
                    className="flex items-start gap-2 rounded-xl px-2.5 py-2 text-sm font-bold text-slate-800 hover:bg-cyan-50"
                  >
                    <span aria-hidden className="text-base">
                      {item.emoji}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                <button
                  type="button"
                  className="flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-right text-sm font-bold text-teal-800 hover:bg-teal-50"
                  onClick={() => {
                    setAskOther(true);
                    setError("");
                    setOk("");
                  }}
                >
                  <span aria-hidden className="text-base">
                    🎫
                  </span>
                  <span>{SUPPORT_WIDGET_OTHER_SUBJECT}</span>
                </button>
              </>
            ) : (
              <form onSubmit={onSubmit} className="space-y-2 p-1">
                <button
                  type="button"
                  className="text-xs font-bold text-teal-700"
                  onClick={() => {
                    setAskOther(false);
                    setError("");
                    setOk("");
                  }}
                >
                  ← بازگشت به گزینه‌ها
                </button>
                <div>
                  <FormLabel>نام</FormLabel>
                  <FormInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
                <div>
                  <FormLabel>موبایل</FormLabel>
                  <FormInput
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>
                <div>
                  <FormLabel>سؤال شما</FormLabel>
                  <FormTextarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
                {error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
                {ok ? (
                  <p className="text-xs font-bold leading-6 text-teal-700">
                    {ok}{" "}
                    <Link href={supportHref} className="underline">
                      رفتن به پشتیبانی
                    </Link>
                  </p>
                ) : null}
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "در حال ثبت…" : "ثبت تیکت"}
                </Button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200 bg-cyan-700 text-2xl text-white shadow-lg shadow-cyan-900/20 hover:bg-cyan-800"
        aria-label={open ? "بستن پشتیبانی آنلاین" : "پشتیبانی آنلاین"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕" : "💬"}
      </button>
      </div>
    </>
  );
}
