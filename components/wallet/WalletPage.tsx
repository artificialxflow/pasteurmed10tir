"use client";

import { Button } from "@/components/ui/Button";
import { Card, EmptyState, FormInput, FormLabel } from "@/components/ui/Card";
import { getWalletApi } from "@/lib/commerce/client";
import { formatToman } from "@/lib/membership";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage, type Wallet } from "@/lib/storage";
import { cn, normalizePhone } from "@/lib/utils";
import {
  DEFAULT_WALLET_SETTINGS,
  formatWalletRepaymentTerms,
  WALLET_KIND_LABELS,
  type WalletSettings,
} from "@/lib/wallet";
import { useEffect, useState } from "react";

type Variant = "web" | "app";

const statusLabels = {
  active: "فعال",
  suspended: "معلق",
  closed: "بسته",
} as const;

export function WalletPage({ variant = "web" }: { variant?: Variant }) {
  const isApp = variant === "app";

  const [phone, setPhone] = useState("");
  const [currentPhone, setCurrentPhone] = useState("");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [settings, setSettings] = useState<WalletSettings | null>(DEFAULT_WALLET_SETTINGS);
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { user?: { phone?: string } };
        if (data.user?.phone) setPhone(normalizePhone(data.user.phone));
      })
      .catch(() => {
        const lastPayment = PasteurStorage.getLastPayment() as { patientPhone?: string } | null;
        if (lastPayment?.patientPhone) setPhone(normalizePhone(String(lastPayment.patientPhone)));
      });

    void fetch("/api/content/settings")
      .then((res) => res.json())
      .then((data: { wallet?: WalletSettings }) => {
        if (data.wallet) setSettings(data.wallet);
      })
      .catch(() => setSettings(DEFAULT_WALLET_SETTINGS));
  }, []);

  function showMessage(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  }

  function loadWallet(rawPhone = phone) {
    const digits = normalizePhone(rawPhone);
    if (digits.length < 10) {
      showMessage(isApp ? "شماره موبایل معتبر نیست" : "شماره موبایل معتبر وارد کنید.");
      return;
    }
    setCurrentPhone(digits);
    setNeedsLogin(false);
    void getWalletApi(digits)
      .then((data) => {
        setWallet({ ...data.wallet });
        setSettings(data.settings);
      })
      .catch((err: Error) => {
        setWallet(null);
        if (String(err.message).includes("وارد") || String(err.message).includes("401")) {
          setNeedsLogin(true);
          showMessage("برای مشاهده کیف اعتبار وارد پنل کاربری شوید.");
        } else {
          showMessage(err.message || "خطا در دریافت کیف اعتبار");
        }
      });
  }

  const availableCredit = wallet ? Math.max(0, wallet.ceiling - wallet.balance) : 0;

  return (
    <div className={cn(isApp ? "space-y-4" : "mx-auto max-w-4xl space-y-8")}>
      {!isApp ? (
        <div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">💳 کیف اعتبار</h1>
          <p className="text-slate-600">
            اعتبار مصرفی برای خدمات درمانی و تجهیزات — جدا از امتیاز باشگاه مشتریان
          </p>
        </div>
      ) : null}

      <Card
        hover={false}
        className={cn(
          isApp ? "p-3" : "border-emerald-200 bg-gradient-to-bl from-emerald-50 to-cyan-50 p-6",
        )}
      >
        {!isApp ? <FormLabel>شماره موبایل</FormLabel> : null}
        <div className="flex gap-3">
          <FormInput
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={isApp ? "شماره موبایل" : "۰۹۱۲۱۲۳۴۵۶۷"}
            className="flex-1"
          />
          <Button type="button" className="shrink-0" onClick={() => loadWallet()}>
            {isApp ? "مشاهده" : "مشاهده کیف"}
          </Button>
        </div>
      </Card>

      {wallet && settings ? (
        <div className="space-y-6">
          <div
            className={cn(
              "grid gap-4",
              isApp ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
            )}
          >
            <Card hover={false} className="p-5 text-center">
              <p className="text-xl font-bold text-emerald-700">{formatToman(wallet.balance)}</p>
              <p className="text-sm text-slate-500">موجودی مصرف‌شده</p>
            </Card>
            <Card hover={false} className="p-5 text-center">
              <p className="text-xl font-bold text-teal-700">{formatToman(wallet.ceiling)}</p>
              <p className="text-sm text-slate-500">سقف اعتبار</p>
            </Card>
            <Card hover={false} className="p-5 text-center">
              <p className="text-xl font-bold text-blue-700">{formatToman(availableCredit)}</p>
              <p className="text-sm text-slate-500">اعتبار باقی‌مانده</p>
            </Card>
            <Card hover={false} className="p-5 text-center">
              <p className={cn("font-bold", isApp ? "text-sm" : "text-lg")}>
                {statusLabels[wallet.status]}
              </p>
              <p className="text-sm text-slate-500">وضعیت کیف</p>
            </Card>
          </div>

          <Card hover={false} className="p-5">
            <h2 className="mb-3 text-lg font-bold">نوع کاربر و سقف</h2>
            <div className="flex flex-wrap gap-2">
              {wallet.activeKinds.map((kind) => (
                <span
                  key={kind}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800"
                >
                  {WALLET_KIND_LABELS[kind]}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              در صورت فعال بودن چند نوع VIP، سقف اعتبار برابر با بیشترین سقف واجد شرایط محاسبه
              می‌شود.
            </p>
          </Card>

          <Card hover={false} className="border-cyan-200 bg-cyan-50 p-5">
            <h2 className="mb-2 text-lg font-bold text-cyan-900">شرایط بازپرداخت</h2>
            <p className="text-sm leading-7 text-slate-700">
              {formatWalletRepaymentTerms(settings)}
            </p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <div className="rounded-xl border border-white bg-white/70 p-3">
                عادی: {formatToman(settings.regularCap)}
              </div>
              <div className="rounded-xl border border-white bg-white/70 p-3">
                VIP عضویت: {formatToman(settings.membershipVipCap)}
              </div>
              <div className="rounded-xl border border-white bg-white/70 p-3">
                VIP تجهیزات: {formatToman(settings.shopVipCap)}
              </div>
            </div>
          </Card>

          <div>
            <h2 className="mb-4 text-lg font-bold">
              {isApp ? "تاریخچه" : "📜 تاریخچه تراکنش‌ها"}
            </h2>
            <div className="space-y-2">
              {wallet.transactions.length ? (
                (isApp ? wallet.transactions.slice(0, 10) : wallet.transactions).map((tx) => (
                  <Card
                    key={tx.id}
                    hover={false}
                    className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{tx.description}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.createdAt).toLocaleString("fa-IR")} — {tx.type}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-emerald-700">{formatToman(tx.amount)}</p>
                      <p className="text-xs text-slate-500">وضعیت: {tx.status}</p>
                    </div>
                  </Card>
                ))
              ) : (
                <EmptyState
                  title={
                    isApp
                      ? "هنوز تراکنشی ثبت نشده"
                      : "هنوز تراکنشی ثبت نشده — پس از فعال‌سازی عضویت یا VIP تجهیزات، سقف اعتبار به‌روز می‌شود."
                  }
                />
              )}
            </div>
          </div>

          {!isApp ? (
            <Card hover={false} className="border-amber-200 bg-amber-50 p-5 text-center">
              <p className="mb-3 text-slate-700">
                امتیاز باشگاه مشتریان ({currentPhone}) جدا از کیف اعتبار است.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button href={ROUTES.web.club}>باشگاه مشتریان</Button>
                <Button href={ROUTES.web.dentalMembership} variant="outline">
                  طرح‌های عضویت
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}

      {message ? (
        isApp ? (
          <div className="fixed inset-x-0 bottom-24 z-50 mx-auto max-w-[430px] px-6">
            <div className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white shadow-lg">
              {message}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm font-bold text-teal-700">{message}</p>
        )
      ) : null}

      {!wallet && isApp ? (
        <p className="text-center text-xs text-slate-500">
          شماره موبایل خود را وارد کنید یا از شماره ذخیره‌شده استفاده کنید.
        </p>
      ) : null}

      {!isApp && !wallet ? (
        <p className="text-center text-sm text-slate-500">
          {needsLogin
            ? "ابتدا از /account وارد شوید، سپس کیف اعتبار را با همان شماره مشاهده کنید."
            : "برای مشاهده کیف اعتبار، شماره موبایل ثبت‌شده در عضویت یا VIP را وارد کنید."}
        </p>
      ) : null}
    </div>
  );
}
