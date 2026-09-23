"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel } from "@/components/ui/Card";
import { fetchAdminCommerce, postAdminCommerce } from "@/lib/commerce/client";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type OrgRow = {
  id: string;
  name: string;
  contractDiscountPercent: number;
  representativeName: string;
  representativePhone: string;
  memberCount: number;
  paidCount: number;
};

export default function AdminOrganizationsPage() {
  const [items, setItems] = useState<OrgRow[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [discount, setDiscount] = useState("0");

  const reload = useCallback(async () => {
    const data = await fetchAdminCommerce<{ items: OrgRow[] }>("/api/admin/commerce/organizations");
    setItems(data.items);
  }, []);

  useEffect(() => {
    void reload()
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [reload]);

  async function createOrg() {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      await postAdminCommerce("/api/admin/commerce/organizations", {
        name: name.trim(),
        representativePhone: phone.trim(),
        contractDiscountPercent: Number(discount),
      });
      setName("");
      setPhone("");
      setDiscount("0");
      await reload();
      setSuccess("سازمان ثبت شد.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ثبت ناموفق");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        قرارداد مجموعه، تخفیف، اعضا، حق عضویت و اقساط از اینجا کنترل می‌شود. نماینده از حساب کاربری با
        «ورود سازمان» اعضا را می‌بیند و پرداخت گروهی می‌کند.
      </p>
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
      {success ? <p className="text-sm font-bold text-teal-800">{success}</p> : null}

      <Card hover={false} className="space-y-3 p-4">
        <p className="text-sm font-bold">ثبت سازمان جدید</p>
        <div className="grid gap-2 md:grid-cols-3">
          <div>
            <FormLabel>نام سازمان</FormLabel>
            <FormInput value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <FormLabel>موبایل نماینده (ثبت‌شده در سامانه)</FormLabel>
            <FormInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <FormLabel>تخفیف قرارداد ٪</FormLabel>
            <FormInput
              type="number"
              min={0}
              max={50}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
        </div>
        <Button type="button" disabled={busy} onClick={() => void createOrg()}>
          {busy ? "…" : "ثبت سازمان"}
        </Button>
      </Card>

      {loading ? <p className="text-sm text-slate-500">در حال بارگذاری…</p> : null}

      <AdminTable
        headers={["سازمان", "نماینده", "اعضا / پرداخت‌شده", "تخفیف قرارداد", ""]}
        empty={loading ? "…" : "هنوز سازمانی ثبت نشده است."}
      >
        {items.map((row) => (
          <tr key={row.id} className="border-t border-slate-100">
            <td className="px-4 py-3 font-bold">{row.name}</td>
            <td className="px-4 py-3 text-xs">
              <div>{row.representativeName}</div>
              <div className="font-mono" dir="ltr">
                {row.representativePhone}
              </div>
            </td>
            <td className="px-4 py-3">
              {row.paidCount.toLocaleString("fa-IR")} از {row.memberCount.toLocaleString("fa-IR")}
            </td>
            <td className="px-4 py-3">
              <AdminBadge tone={row.contractDiscountPercent ? "info" : "neutral"}>
                {row.contractDiscountPercent
                  ? `${row.contractDiscountPercent.toLocaleString("fa-IR")}٪`
                  : "بدون تخفیف"}
              </AdminBadge>
            </td>
            <td className="px-4 py-3">
              <Link
                href={`${ROUTES.admin.organizations}/${row.id}`}
                className="text-sm font-semibold text-cyan-700"
              >
                جزئیات
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
