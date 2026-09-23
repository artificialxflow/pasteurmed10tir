"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import { fetchPatientOps, postPatientOps } from "@/lib/operations/client";
import {
  applyMembershipDiscounts,
  clampGroupDiscountPercent,
  GROUP_DISCOUNT_CHOICES,
} from "@/lib/membership/group-discount";
import { getDurationOptions, getUnitPrice, getValidityLabel, type MembershipTier } from "@/lib/membership";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import { formatPrice, normalizePhone } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type OrgMember = {
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

type OrgPayload = {
  organization: { id: string; name: string } | null;
  members: OrgMember[];
};

export function OrganizationPanel({
  variant,
  profileName,
  profilePhone,
}: {
  variant: "web" | "app";
  profileName: string;
  profilePhone: string;
}) {
  const router = useRouter();
  const confirmHref = variant === "app" ? ROUTES.app.dentalConfirm : ROUTES.web.dentalConfirm;
  const returnHref = variant === "app" ? ROUTES.app.account : ROUTES.web.account;
  const successHref = variant === "app" ? ROUTES.app.dentalSuccess : ROUTES.web.dentalSuccess;
  const durationOptions = useMemo(() => getDurationOptions(), []);

  const [data, setData] = useState<OrgPayload | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [tier, setTier] = useState<MembershipTier>("regular");
  const [planId, setPlanId] = useState("one-year");
  const [groupDiscount, setGroupDiscount] = useState("0");

  const reload = useCallback(async () => {
    const next = await fetchPatientOps<OrgPayload>("/api/operations/organization");
    setData(next);
  }, []);

  useEffect(() => {
    void reload().catch((e: Error) => setError(e.message));
  }, [reload]);

  const org = data?.organization;
  const members = data?.members || [];
  const selectedMembers = members.filter((m) => selected.includes(m.id));
  const count = Math.max(1, selectedMembers.length);
  const unit = getUnitPrice(tier, planId);
  const durationDisc = durationOptions.find((p) => p.id === planId)?.discountPercent || 0;
  const groupDisc = clampGroupDiscountPercent(groupDiscount);
  const payable = selectedMembers.length
    ? applyMembershipDiscounts({
        subtotal: unit * selectedMembers.length,
        durationDiscountPercent: durationDisc,
        groupDiscountPercent: groupDisc,
      })
    : 0;

  async function addMember() {
    setError("");
    setBusy(true);
    try {
      await postPatientOps("/api/operations/organization/members", {
        name: name.trim(),
        phone: normalizePhone(phone),
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

  async function removeMember(id: string) {
    setError("");
    try {
      await fetchPatientOps(`/api/operations/organization/members/${id}`, { method: "DELETE" });
      setSelected((prev) => prev.filter((x) => x !== id));
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حذف ناموفق");
    }
  }

  function paySelected() {
    if (!org || !selectedMembers.length) {
      setError("حداقل یک عضو را برای پرداخت انتخاب کنید.");
      return;
    }
    PasteurStorage.setPendingPayment({
      kind: "membership",
      planId: tier,
      planName: `عضویت سازمانی ${org.name} — ${selectedMembers.length} نفر`,
      patientName: profileName,
      patientPhone: profilePhone,
      amount: payable,
      validityLabel: getValidityLabel(tier, planId),
      membershipDurationLabel: getValidityLabel(tier, planId),
      discountPercent: durationDisc,
      groupDiscountPercent: groupDisc,
      organizationId: org.id,
      orgMemberIds: selectedMembers.map((m) => m.id),
      successTo: successHref,
      returnTo: returnHref,
    });
    router.push(confirmHref);
  }

  if (!org) {
    return (
      <Card hover={false} className="p-4 text-sm text-slate-600">
        این شماره نماینده سازمان نیست. از صفحه ورود، «ورود سازمان» را انتخاب کنید و نام سازمان را ثبت کنید.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
      <Card hover={false} className="p-4">
        <p className="text-sm font-extrabold text-slate-900">{org.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          اعضا را اضافه کنید، تخفیف را انتخاب کنید و حق عضویت گروهی را بپردازید.
        </p>
      </Card>

      <Card hover={false} className="space-y-3 p-4">
        <p className="text-sm font-extrabold">افزودن عضو مجموعه</p>
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
            <FormLabel>کد ملی (اختیاری)</FormLabel>
            <FormInput value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
          </div>
        </div>
        <Button type="button" disabled={busy} onClick={() => void addMember()}>
          {busy ? "…" : "افزودن عضو"}
        </Button>
      </Card>

      <Card hover={false} className="p-4">
        <p className="mb-3 text-sm font-extrabold">اعضای سازمان</p>
        {members.length === 0 ? (
          <p className="text-xs text-slate-500">هنوز عضوی ثبت نشده است.</p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-slate-100 p-3 text-sm"
              >
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={(e) =>
                      setSelected((prev) =>
                        e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id),
                      )
                    }
                  />
                  <span>
                    <span className="font-bold">{m.name}</span>
                    <span className="mt-0.5 block font-mono text-xs text-slate-500" dir="ltr">
                      {m.phone}
                    </span>
                    <span className="mt-1 block text-xs">
                      عضویت: {m.membershipPaid ? "پرداخت شده" : "پرداخت نشده"}
                      {m.installment
                        ? ` · اقساط: ${m.installment.title} (${formatPrice(m.installment.paidAmount)} از ${formatPrice(m.installment.totalAmount)})`
                        : ""}
                    </span>
                  </span>
                </label>
                <button
                  type="button"
                  className="text-xs font-bold text-red-600"
                  onClick={() => void removeMember(m.id)}
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card hover={false} className="space-y-3 p-4">
        <p className="text-sm font-extrabold">پرداخت حق عضویت گروهی</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <FormLabel>نوع پوشش</FormLabel>
            <FormSelect value={tier} onChange={(e) => setTier(e.target.value as MembershipTier)}>
              <option value="regular">عادی</option>
              <option value="vip">VIP</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>مدت</FormLabel>
            <FormSelect value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {durationOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </FormSelect>
          </div>
          <div>
            <FormLabel>تخفیف مجموعه</FormLabel>
            <FormSelect value={groupDiscount} onChange={(e) => setGroupDiscount(e.target.value)}>
              {GROUP_DISCOUNT_CHOICES.map((pct) => (
                <option key={pct} value={pct}>
                  {pct === 0 ? "بدون تخفیف" : `${pct}٪`}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>
        <p className="text-sm font-bold text-teal-800">
          {selectedMembers.length
            ? `${formatPrice(unit)} × ${count.toLocaleString("fa-IR")} نفر${
                groupDisc ? ` با ${groupDisc}٪ تخفیف` : ""
              } → ${formatPrice(payable)}`
            : "اعضا را از لیست بالا انتخاب کنید."}
        </p>
        <Button type="button" onClick={paySelected} disabled={!selectedMembers.length}>
          پرداخت حق عضویت انتخاب‌شده‌ها
        </Button>
      </Card>
    </div>
  );
}
