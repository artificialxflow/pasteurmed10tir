"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormLabel } from "@/components/ui/Card";
import { DraftNumberInput } from "@/components/ui/DraftNumberInput";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import { fetchAdminCommerce, patchAdminCommerce } from "@/lib/commerce/client";
import { formatToman } from "@/lib/membership";
import {
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
  const [error, setError] = useState("");

  function reload() {
    void fetchAdmin<{ wallet: WalletSettings }>("/api/admin/content/settings")
      .then((data) => setSettings(data.wallet))
      .catch(() => setSettings(DEFAULT_WALLET_SETTINGS));
    void fetchAdminCommerce<{ items: Wallet[] }>("/api/admin/commerce/wallets")
      .then((data) => setWallets(data.items))
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    reload();
  }, []);

  const selected = selectedPhone
    ? wallets.find((w) => w.phone === selectedPhone) || null
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
    void patchAdminCommerce("/api/admin/commerce/wallets", { phone, status })
      .then(() => reload())
      .catch((e: Error) => setError(e.message));
  }

  function updateTxStatus(phone: string, txId: string, status: WalletTransactionStatus) {
    void patchAdminCommerce("/api/admin/commerce/wallets", {
      phone,
      transactionId: txId,
      transactionStatus: status,
    })
      .then(() => reload())
      .catch((e: Error) => setError(e.message));
  }

  function kindSummary(kinds: WalletKind[]) {
    return kinds.map((k) => WALLET_KIND_LABELS[k]).join("، ") || "—";
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Card hover={false} className="border-amber-200 bg-amber-50/80 p-4 text-sm leading-7 text-amber-950">
        <p className="font-bold">راهنمای کیف</p>
        <ul className="mt-2 list-disc space-y-1 pr-5">
          <li>
            <strong>سقف</strong> — حداکثر اعتبار بسته عضویت/VIP
          </li>
          <li>
            <strong>موجودی مصرف‌شده</strong> — مبلغ استفاده‌شده؛ صفر تا اولین مصرف طبیعی است
          </li>
          <li>
            <strong>تراکنش‌ها</strong> — انواع: upgrade (ارتقای سقف) · credit · debit · adjustment
          </li>
          <li>وام درمانی و تسهیلات تجهیزات در این صفحه نیستند — به اقساط / تسهیلات مراجعه کنید</li>
        </ul>
      </Card>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
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
            <DraftNumberInput
              min={0}
              max={999_999_999_999}
              value={settings.regularCap}
              onCommit={(regularCap) => setSettings((prev) => ({ ...prev, regularCap }))}
            />
          </div>
          <div>
            <FormLabel>سقف VIP عضویت (تومان)</FormLabel>
            <DraftNumberInput
              min={0}
              max={999_999_999_999}
              value={settings.membershipVipCap}
              onCommit={(membershipVipCap) =>
                setSettings((prev) => ({ ...prev, membershipVipCap }))
              }
            />
          </div>
          <div>
            <FormLabel>سقف VIP تجهیزات (تومان)</FormLabel>
            <DraftNumberInput
              min={0}
              max={999_999_999_999}
              value={settings.shopVipCap}
              onCommit={(shopVipCap) => setSettings((prev) => ({ ...prev, shopVipCap }))}
            />
          </div>
          <div>
            <FormLabel>فرجه (ماه)</FormLabel>
            <DraftNumberInput
              min={0}
              max={24}
              value={settings.graceMonths}
              onCommit={(graceMonths) => setSettings((prev) => ({ ...prev, graceMonths }))}
            />
          </div>
          <div>
            <FormLabel>حداقل اقساط (ماه)</FormLabel>
            <DraftNumberInput
              min={1}
              max={60}
              value={settings.installmentMin}
              onCommit={(installmentMin) =>
                setSettings((prev) => ({ ...prev, installmentMin }))
              }
            />
          </div>
          <div>
            <FormLabel>حداکثر اقساط (ماه)</FormLabel>
            <DraftNumberInput
              min={1}
              max={60}
              value={settings.installmentMax}
              onCommit={(installmentMax) =>
                setSettings((prev) => ({ ...prev, installmentMax }))
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
