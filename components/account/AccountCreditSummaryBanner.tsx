"use client";

import { Card } from "@/components/ui/Card";
import { getMyMembershipApplicationsApi, getWalletApi } from "@/lib/commerce/client";
import { DEFAULT_WALLET_SETTINGS } from "@/lib/wallet";
import { formatToman } from "@/lib/membership";
import { useEffect, useState } from "react";

export function AccountCreditSummaryBanner({
  phone,
}: {
  phone: string;
}) {
  const [creditCap, setCreditCap] = useState<number | null>(null);
  const [creditAvailable, setCreditAvailable] = useState<number | null>(null);
  const [loanAmount, setLoanAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      getWalletApi(phone).catch(() => null),
      getMyMembershipApplicationsApi().catch(() => ({ items: [] })),
    ])
      .then(([walletRes, appsRes]) => {
        if (cancelled) return;
        const settings = walletRes?.settings;
        const wallet = walletRes?.wallet;
        const baseCap =
          wallet?.ceiling ?? settings?.membershipVipCap ?? DEFAULT_WALLET_SETTINGS.membershipVipCap;
        const available = wallet
          ? Math.max(0, wallet.ceiling - wallet.balance)
          : baseCap;
        setCreditCap(baseCap);
        setCreditAvailable(available);

        const items = (appsRes?.items || []) as Array<{
          loanAmount?: number | null;
          status?: string;
          source?: string | null;
        }>;
        const approvedLoan = items
          .filter(
            (a) =>
              (a.status === "approved" || a.status === "paid") &&
              (Number(a.loanAmount) > 0 || a.source === "loan-request"),
          )
          .map((a) => Number(a.loanAmount) || 0)
          .sort((a, b) => b - a)[0];
        setLoanAmount(approvedLoan && approvedLoan > 0 ? approvedLoan : null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [phone]);

  return (
    <Card
      hover={false}
      className="border-cyan-200 bg-gradient-to-l from-cyan-50/80 to-white p-4"
    >
      <p className="mb-3 text-sm font-extrabold text-slate-900">اعتبار و وام درمانی</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <CreditStatBlock
          label="کارت اعتباری شما"
          value={
            loading
              ? "…"
              : creditCap != null
                ? formatToman(creditAvailable ?? creditCap)
                : "—"
          }
          sub={
            !loading && creditCap != null && creditAvailable != null && creditAvailable !== creditCap
              ? `سقف ${formatToman(creditCap)}`
              : undefined
          }
        />
        <CreditStatBlock
          label="اعتبار درمانی (قابل استفاده)"
          value={loading ? "…" : creditAvailable != null ? formatToman(creditAvailable) : "—"}
        />
        <CreditStatBlock
          label="وام درمانی شما"
          value={loading ? "…" : loanAmount != null ? formatToman(loanAmount) : "ثبت نشده"}
        />
      </div>
    </Card>
  );
}

function CreditStatBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-0.5 text-base font-extrabold text-slate-900">{value}</p>
      {sub ? <p className="text-[10px] text-slate-500">{sub}</p> : null}
    </div>
  );
}