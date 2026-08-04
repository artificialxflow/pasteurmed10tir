"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel } from "@/components/ui/Card";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import { formatToman } from "@/lib/membership";
import {
  PasteurStorage,
  type Wallet,
  type WalletSettings,
  type WalletStatus,
  type WalletTransactionStatus,
} from "@/lib/storage";
import {
  DEFAULT_WALLET_SETTINGS,
  WALLET_KIND_LABELS,
  type WalletKind,
} from "@/lib/wallet";
import { useEffect, useState } from "react";

const statusLabels: Record<WalletStatus, string> = {
  active: "فعال",
  suspended: "معلق",
  closed: "بسته",
};

const txStatusLabels: Record<WalletTransactionStatus, string> = {
  pending: "در انتظار",
  completed: "تکمیل",
  cancelled: "لغو",
};

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [settings, setSettings] = useState<WalletSettings>(DEFAULT_WALLET_SETTINGS);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  function reload() {
    PasteurStorage.initWalletsIfNeeded();
    void fetchAdmin<{ wallet: WalletSettings }>("/api/admin/content/settings")
      .then((data) => setSettings(data.wallet))
      .catch(() => setSettings(PasteurStorage.getWalletSettings()));
    setWallets(PasteurStorage.listWallets());
  }

  useEffect(() => {
    reload();
  }, []);

  const selected = selectedPhone
    ? wallets.find((w) => w.phone === selectedPhone) || PasteurStorage.getOrCreateWallet(selectedPhone)
    : null;

  function saveSettings() {
    void putAdmin<{ wallet: WalletSettings }>("/api/admin/content/settings", {
      wallet: settings,
    }).then((data) => setSettings(data.wallet));
  }

  function resetSettings() {
    void putAdmin<{ wallet: WalletSettings }>("/api/admin/content/settings", {
      wallet: DEFAULT_WALLET_SETTINGS,
    }).then((data) => setSettings(data.wallet));
  }

  function updateWalletStatus(phone: string, status: WalletStatus) {
    PasteurStorage.updateWalletStatus(phone, status);
    reload();
  }

  function updateTxStatus(phone: string, txId: string, status: WalletTransactionStatus) {
    PasteurStorage.updateWalletTransactionStatus(phone, txId, status);
    reload();
  }

  function kindSummary(kinds: WalletKind[]) {
    return kinds.map((k) => WALLET_KIND_LABELS[k]).join("، ") || "—";
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-extrabold text-slate-900">تنظیمات سقف و بازپرداخت</h2>
          <p className="mt-1 text-sm text-slate-500">
            سقف اعتبار بر اساس نوع کاربر؛ هنگام چند VIP فعال، سقف برابر بیشترین مقدار است.
          </p>
        </div>
        <Card hover={false} className="grid gap-4 border-cyan-100 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FormLabel>سقف بیمار عادی (تومان)</FormLabel>
            <FormInput
              type="number"
              value={settings.regularCap}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, regularCap: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <FormLabel>سقف VIP عضویت (تومان)</FormLabel>
            <FormInput
              type="number"
              value={settings.membershipVipCap}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, membershipVipCap: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <FormLabel>سقف VIP تجهیزات (تومان)</FormLabel>
            <FormInput
              type="number"
              value={settings.shopVipCap}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, shopVipCap: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <FormLabel>فرجه (ماه)</FormLabel>
            <FormInput
              type="number"
              value={settings.graceMonths}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, graceMonths: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <FormLabel>حداقل اقساط (ماه)</FormLabel>
            <FormInput
              type="number"
              value={settings.installmentMin}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, installmentMin: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <FormLabel>حداکثر اقساط (ماه)</FormLabel>
            <FormInput
              type="number"
              value={settings.installmentMax}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, installmentMax: Number(e.target.value) }))
              }
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="button" onClick={saveSettings}>
              ذخیره تنظیمات
            </Button>
            <Button type="button" variant="outline" onClick={resetSettings}>
              بازنشانی پیش‌فرض
            </Button>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">لیست کیف‌های اعتبار</h2>
        <AdminTable
          headers={["موبایل", "موجودی", "سقف", "نوع", "وضعیت", "عملیات"]}
          empty="هنوز کیف اعتباری ثبت نشده است."
        >
          {wallets.map((wallet) => (
            <tr key={wallet.phone} className="border-t border-slate-100">
              <td className="px-4 py-3 font-mono">{wallet.phone}</td>
              <td className="px-4 py-3">{formatToman(wallet.balance)}</td>
              <td className="px-4 py-3">{formatToman(wallet.ceiling)}</td>
              <td className="px-4 py-3 text-xs">{kindSummary(wallet.activeKinds)}</td>
              <td className="px-4 py-3">
                <AdminBadge tone={wallet.status === "active" ? "success" : "warn"}>
                  {statusLabels[wallet.status]}
                </AdminBadge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="px-2 py-1 text-xs"
                    variant="outline"
                    onClick={() => setSelectedPhone(wallet.phone)}
                  >
                    تراکنش‌ها
                  </Button>
                  <select
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    value={wallet.status}
                    onChange={(e) =>
                      updateWalletStatus(wallet.phone, e.target.value as WalletStatus)
                    }
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      {selected ? (
        <div>
          <h2 className="mb-4 text-lg font-bold">تراکنش‌های {selected.phone}</h2>
          <AdminTable
            headers={["تاریخ", "نوع", "مبلغ", "موجودی بعد", "توضیح", "وضعیت"]}
            empty="تراکنشی ثبت نشده است."
          >
            {selected.transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-xs">
                  {new Date(tx.createdAt).toLocaleString("fa-IR")}
                </td>
                <td className="px-4 py-3">{tx.type}</td>
                <td className="px-4 py-3">{formatToman(tx.amount)}</td>
                <td className="px-4 py-3">{formatToman(tx.balanceAfter)}</td>
                <td className="px-4 py-3 text-sm">{tx.description}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    value={tx.status}
                    onChange={(e) =>
                      updateTxStatus(
                        selected.phone,
                        tx.id,
                        e.target.value as WalletTransactionStatus,
                      )
                    }
                  >
                    {Object.entries(txStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </AdminTable>
        </div>
      ) : null}
    </div>
  );
}
