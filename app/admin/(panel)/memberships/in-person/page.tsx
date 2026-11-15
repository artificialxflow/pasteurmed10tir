"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import { postAdminCommerce } from "@/lib/commerce/client";
import { fetchAdminOps } from "@/lib/operations/client";
import { formatToman, getDurationOptions, parseMembershipTier, type MembershipTier } from "@/lib/membership";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { type ReactNode, useCallback, useState } from "react";

type PatientRow = { phone?: string; name?: string; userId?: string };

export default function MembershipInPersonPage() {
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [selected, setSelected] = useState<PatientRow | null>(null);
  const [tier, setTier] = useState<MembershipTier>("regular");
  const [planId, setPlanId] = useState("one-year");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const durationOptions = getDurationOptions();

  const search = useCallback(() => {
    const query = q.trim();
    if (query.length < 3) return;
    void fetchAdminOps<{ items?: PatientRow[] }>("/api/admin/operations/patients")
      .then((data) => {
        const items = (data.items || []).filter((p) => {
          const phone = String(p.phone || "");
          const name = String(p.name || "");
          return phone.includes(query) || name.includes(query);
        });
        setPatients(items.slice(0, 30));
      })
      .catch(() => setPatients([]));
  }, [q]);

  async function startOnBehalf() {
    if (!selected?.phone) {
      setMessage("ابتدا بیمار را انتخاب کنید.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const data = await postAdminCommerce<{
        application?: Record<string, unknown>;
        payment?: { amountToman?: number };
      }>("/api/admin/commerce/membership-applications/on-behalf", {
        patientPhone: selected.phone,
        patientUserId: selected.userId,
        patientName: selected.name,
        tier,
        membershipPlanId: planId,
        memberCount: 1,
      });
      const amount = Number(data.payment?.amountToman || 0);
      setMessage(
        `درخواست عضویت ثبت شد (${String(data.application?.id || "").slice(0, 8)}…). مبلغ ${formatToman(amount)} — پرداخت درگاه را از فرم عضویت با شماره بیمار تکمیل کنید یا درگاه سازمانی متصل کنید.`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "ثبت ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <PageIntro>
        <Link href={ROUTES.admin.memberships} className="text-sm font-bold text-teal-700 underline">
          ← بازگشت به عضویت‌ها
        </Link>
        <h1 className="mt-2 text-xl font-extrabold text-slate-900">پرداخت حق عضویت حضوری</h1>
        <p className="mt-1 text-sm text-slate-600">
          جستجوی بیمار و ثبت درخواست عضویت به نام او (channel: in_person).
        </p>
      </PageIntro>

      <Card hover={false} className="space-y-3 p-4">
        <FormLabel>جستجوی بیمار (نام یا موبایل)</FormLabel>
        <div className="flex gap-2">
          <FormInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="0912…" />
          <Button type="button" variant="outline" onClick={search}>
            جستجو
          </Button>
        </div>
        {patients.length ? (
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
            {patients.map((p) => (
              <li key={p.phone}>
                <button
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2 text-right ${
                    selected?.phone === p.phone
                      ? "border-teal-400 bg-teal-50"
                      : "border-slate-200 bg-white"
                  }`}
                  onClick={() => setSelected(p)}
                >
                  {p.name || "—"} · {p.phone}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card hover={false} className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FormLabel>طرح عضویت</FormLabel>
            <FormSelect
              value={tier}
              onChange={(e) => setTier(parseMembershipTier(e.target.value))}
            >
              <option value="regular">عادی</option>
              <option value="vip">VIP</option>
              <option value="eco-plus">اکوپلاس</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>مدت حق عضویت</FormLabel>
            <FormSelect value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {durationOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>
        <Button type="button" disabled={busy || !selected} onClick={() => void startOnBehalf()}>
          {busy ? "در حال ثبت…" : "ثبت درخواست عضویت برای بیمار"}
        </Button>
        {message ? <p className="text-sm font-bold text-slate-800">{message}</p> : null}
      </Card>
    </div>
  );
}

function PageIntro({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}