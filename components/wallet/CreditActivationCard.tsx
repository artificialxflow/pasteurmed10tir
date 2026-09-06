"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel } from "@/components/ui/Card";
import {
  createCreditActivationApi,
  getMyCreditActivationApi,
} from "@/lib/commerce/client";
import { ROUTES } from "@/lib/routes";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type CreditRequest = {
  id?: string;
  requestedAmount?: number;
  status?: string;
  reviewNote?: string | null;
  createdAt?: string;
};

function statusLabel(status?: string) {
  if (status === "approved") return "تأیید شده — طرح اقساط در صفحه اقساط";
  if (status === "rejected") return "رد شده";
  return "در انتظار بررسی";
}

export function CreditActivationCard({
  ceiling,
  variant,
}: {
  ceiling: number;
  variant: "web" | "app";
}) {
  const [amount, setAmount] = useState(ceiling > 0 ? String(ceiling) : "");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<CreditRequest[]>([]);

  const reload = useCallback(() => {
    void getMyCreditActivationApi()
      .then((data) => setItems((data.items || []) as CreditRequest[]))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (ceiling > 0) setAmount(String(ceiling));
  }, [ceiling]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    const requestedAmount = Number(amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      setError("مبلغ درخواستی باید بیشتر از صفر باشد.");
      return;
    }
    if (requestedAmount > ceiling) {
      setError("مبلغ درخواستی نمی‌تواند از سقف اعتبار بیشتر باشد.");
      return;
    }
    setBusy(true);
    try {
      await createCreditActivationApi({ requestedAmount });
      setOk("درخواست فعال‌سازی ثبت شد. پس از تأیید ادمین، طرح اقساط در صفحه اقساط دیده می‌شود.");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  const installmentsHref =
    variant === "app" ? ROUTES.app.installments : ROUTES.web.installments;
  const membershipHref =
    variant === "app" ? ROUTES.app.dentalMembership : ROUTES.web.dentalMembership;
  const hasPending = items.some((item) => item.status === "pending");

  return (
    <Card hover={false} className="space-y-4 border-teal-100 bg-teal-50/40 p-4">
      <div>
        <p className="font-extrabold text-slate-900">فعال‌سازی کارت اعتباری</p>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          سقف اعتبار با خرید عضویت داده می‌شود، ولی اقساط اعتباری خودکار ساخته نمی‌شود.
          مبلغی تا سقف اعتبار درخواست کنید تا پس از تأیید ادمین قسط‌بندی شود. این کیف{" "}
          <strong>وام درمانی نیست</strong>.
        </p>
        <p className="mt-2 text-sm font-bold text-teal-800">
          سقف اعتبار فعلی: {formatPrice(ceiling)}
        </p>
      </div>

      {ceiling <= 0 ? (
        <p className="text-sm leading-7 text-slate-600">
          هنوز سقف اعتبار ندارید. ابتدا{" "}
          <Link href={membershipHref} className="font-bold text-teal-700 underline">
            طرح عضویت
          </Link>{" "}
          بخرید.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3">
          <div>
            <FormLabel>مبلغ درخواستی (تومان)</FormLabel>
            <FormInput
              type="number"
              min={1}
              max={ceiling}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              باید بیشتر از صفر و حداکثر برابر سقف اعتبار باشد.
            </p>
          </div>
          {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
          {ok ? <p className="text-sm font-bold text-teal-700">{ok}</p> : null}
          <Button type="submit" disabled={busy || hasPending}>
            {busy ? "در حال ثبت…" : hasPending ? "درخواست در انتظار بررسی است" : "ثبت درخواست فعال‌سازی"}
          </Button>
        </form>
      )}

      {items.length ? (
        <div className="space-y-2 border-t border-teal-100 pt-3">
          <p className="text-sm font-extrabold text-slate-900">درخواست‌های فعال‌سازی من</p>
          {items.map((item) => (
            <div
              key={String(item.id)}
              className="rounded-xl border border-white bg-white/80 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">{formatPrice(Number(item.requestedAmount || 0))}</span>
                <span
                  className={`text-xs font-bold ${
                    item.status === "rejected"
                      ? "text-rose-700"
                      : item.status === "approved"
                        ? "text-teal-700"
                        : "text-slate-600"
                  }`}
                >
                  {statusLabel(item.status)}
                </span>
              </div>
              {item.status === "rejected" && item.reviewNote ? (
                <p className="mt-2 rounded-lg border border-rose-100 bg-rose-50/80 px-2 py-1.5 text-xs leading-6 text-rose-900">
                  توضیح کارشناس: {item.reviewNote}
                </p>
              ) : null}
            </div>
          ))}
          <Link href={installmentsHref} className="inline-block text-xs font-bold text-teal-700 underline">
            مشاهده اقساط ←
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
