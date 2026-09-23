"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel } from "@/components/ui/Card";
import {
  deleteAdminCommerce,
  fetchAdminCommerce,
  patchAdminCommerce,
  postAdminCommerce,
} from "@/lib/commerce/client";
import { ROUTES } from "@/lib/routes";
import { confirmAction } from "@/lib/ui/confirm-action";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type MemberRow = {
  id: string;
  name: string;
  phone: string;
  nationalId?: string | null;
  membershipPaid: boolean;
  membershipAmount?: number | null;
  lastPaidAt?: string | null;
  installment: {
    title: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
  } | null;
};

type Payload = {
  organization: {
    id: string;
    name: string;
    contractDiscountPercent: number;
    representativeName: string;
    representativePhone: string;
  };
  members: MemberRow[];
};

export default function AdminOrganizationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orgName, setOrgName] = useState("");
  const [discount, setDiscount] = useState("0");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const next = await fetchAdminCommerce<Payload>(`/api/admin/commerce/organizations/${id}`);
    setData(next);
    setOrgName(next.organization.name);
    setDiscount(String(next.organization.contractDiscountPercent));
  }, [id]);

  useEffect(() => {
    void reload().catch((e: Error) => setError(e.message));
  }, [reload]);

  async function saveOrg() {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      await patchAdminCommerce(`/api/admin/commerce/organizations/${id}`, {
        name: orgName.trim(),
        contractDiscountPercent: Number(discount),
      });
      await reload();
      setSuccess("قرارداد ذخیره شد.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ذخیره ناموفق");
    } finally {
      setBusy(false);
    }
  }

  async function addMember() {
    setError("");
    setBusy(true);
    try {
      await postAdminCommerce(`/api/admin/commerce/organizations/${id}/members`, {
        name: name.trim(),
        phone,
        nationalId: nationalId.trim() || undefined,
      });
      setName("");
      setPhone("");
      setNationalId("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "افزودن ناموفق");
    } finally {
      setBusy(false);
    }
  }

  async function togglePaid(member: MemberRow) {
    if (
      !confirmAction(
        member.membershipPaid
          ? "حق عضویت این نفر به‌عنوان پرداخت‌نشده ثبت شود؟"
          : "حق عضویت این نفر به‌عنوان پرداخت‌شده ثبت شود؟",
      )
    ) {
      return;
    }
    setError("");
    try {
      await patchAdminCommerce(`/api/admin/commerce/organizations/${id}/members/${member.id}`, {
        membershipPaid: !member.membershipPaid,
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "به‌روزرسانی ناموفق");
    }
  }

  async function removeMember(memberId: string) {
    if (!confirmAction("این عضو از سازمان حذف شود؟")) return;
    setError("");
    try {
      await deleteAdminCommerce(`/api/admin/commerce/organizations/${id}/members/${memberId}`);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حذف ناموفق");
    }
  }

  const org = data?.organization;

  return (
    <div className="space-y-4">
      <Link href={ROUTES.admin.organizations} className="text-sm font-semibold text-cyan-700">
        ← بازگشت به لیست سازمان‌ها
      </Link>
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
      {success ? <p className="text-sm font-bold text-teal-800">{success}</p> : null}

      {org ? (
        <Card hover={false} className="space-y-3 p-4">
          <p className="text-sm text-slate-500">
            نماینده: {org.representativeName}{" "}
            <span className="font-mono" dir="ltr">
              {org.representativePhone}
            </span>
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <FormLabel>نام سازمان</FormLabel>
              <FormInput value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div>
              <FormLabel>تخفیف قرارداد ٪ (روی پرداخت گروهی نماینده)</FormLabel>
              <FormInput
                type="number"
                min={0}
                max={50}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
          </div>
          <Button type="button" disabled={busy} onClick={() => void saveOrg()}>
            ذخیره قرارداد
          </Button>
        </Card>
      ) : (
        <p className="text-sm text-slate-500">در حال بارگذاری…</p>
      )}

      <Card hover={false} className="space-y-3 p-4">
        <p className="text-sm font-bold">افزودن عضو</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <FormLabel>نام</FormLabel>
            <FormInput value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <FormLabel>موبایل</FormLabel>
            <FormInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <FormLabel>کد ملی</FormLabel>
            <FormInput value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
          </div>
        </div>
        <Button type="button" disabled={busy} onClick={() => void addMember()}>
          افزودن
        </Button>
      </Card>

      <AdminTable
        headers={["عضو", "عضویت", "اقساط", "عملیات"]}
        empty="هنوز عضوی ثبت نشده."
      >
        {(data?.members || []).map((m) => (
          <tr key={m.id} className="border-t border-slate-100 align-top">
            <td className="px-4 py-3 text-sm">
              <div className="font-bold">{m.name}</div>
              <div className="font-mono text-xs" dir="ltr">
                {m.phone}
              </div>
              {m.nationalId ? <div className="text-xs text-slate-500">{m.nationalId}</div> : null}
            </td>
            <td className="px-4 py-3">
              <AdminBadge tone={m.membershipPaid ? "success" : "warn"}>
                {m.membershipPaid ? "پرداخت شده" : "پرداخت نشده"}
              </AdminBadge>
              {m.membershipAmount ? (
                <div className="mt-1 text-xs">{formatPrice(m.membershipAmount)}</div>
              ) : null}
            </td>
            <td className="px-4 py-3 text-xs">
              {m.installment
                ? `${m.installment.title} · ${formatPrice(m.installment.paidAmount)} از ${formatPrice(m.installment.totalAmount)}`
                : "—"}
            </td>
            <td className="px-4 py-3 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="px-3 py-1.5 text-xs"
                onClick={() => void togglePaid(m)}
              >
                {m.membershipPaid ? "علامت‌زدن پرداخت‌نشده" : "علامت‌زدن پرداخت‌شده"}
              </Button>
              <button
                type="button"
                className="block text-xs font-bold text-red-600"
                onClick={() => void removeMember(m.id)}
              >
                حذف عضو
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
