"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import type { MarketingReportPublic } from "@/lib/marketing/mappers";
import {
  MARKETING_FOLLOW_UP_KIND_OPTIONS,
  MARKETING_FOLLOW_UP_SLOT_COUNT,
  MARKETING_KIND_OPTIONS,
  MARKETING_NEW_CASE_OUTCOME_OPTIONS,
  MARKETING_UNSUCCESSFUL_REASON_OPTIONS,
  type MarketingContact,
} from "@/lib/marketing/types";
import { fetchPatientOps, patchPatientOps, postPatientOps } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type VisitorMe = { id: number; name: string; phone: string; code: string };

const emptyContacts = (): MarketingContact[] => [
  { name: "", phone: "", role: "" },
  { name: "", phone: "", role: "" },
  { name: "", phone: "", role: "" },
];

export function MarketingPanel() {
  const [visitor, setVisitor] = useState<VisitorMe | null | undefined>(undefined);
  const [items, setItems] = useState<MarketingReportPublic[]>([]);
  const [view, setView] = useState<"list" | "form" | "detail" | "followups">("list");
  const [listKind, setListKind] = useState<string>("all");
  const [detail, setDetail] = useState<MarketingReportPublic | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const [kind, setKind] = useState<string>("new_case");
  const [companyName, setCompanyName] = useState("");
  const [contacts, setContacts] = useState<MarketingContact[]>(emptyContacts);
  const [newCaseOutcome, setNewCaseOutcome] = useState("");
  const [successFlags, setSuccessFlags] = useState({
    request: false,
    contract: false,
    banner: false,
    skin: false,
    proforma: false,
    salesInvoice: false,
  });
  const [contractDate, setContractDate] = useState("");
  const [unsuccessfulReason, setUnsuccessfulReason] = useState("");
  const [unsuccessfulNotes, setUnsuccessfulNotes] = useState("");
  const [followUpKind, setFollowUpKind] = useState("");
  const [followUpDueDate, setFollowUpDueDate] = useState("");
  const [blockedNote, setBlockedNote] = useState("");

  const [slotForms, setSlotForms] = useState<Record<number, { date: string; note: string }>>({});

  const reload = useCallback(() => {
    void fetchPatientOps<{ visitor: VisitorMe; items: MarketingReportPublic[] }>(
      "/api/operations/marketing/reports",
    )
      .then((data) => {
        setVisitor(data.visitor);
        setItems(data.items);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    void fetchPatientOps<{ item: VisitorMe | null }>("/api/operations/marketing/me")
      .then((data) => {
        if (!data.item) setVisitor(null);
        else {
          setVisitor(data.item);
          reload();
        }
      })
      .catch(() => setVisitor(null));
  }, [reload]);

  function resetForm() {
    setKind("new_case");
    setCompanyName("");
    setContacts(emptyContacts());
    setNewCaseOutcome("");
    setSuccessFlags({
      request: false,
      contract: false,
      banner: false,
      skin: false,
      proforma: false,
      salesInvoice: false,
    });
    setContractDate("");
    setUnsuccessfulReason("");
    setUnsuccessfulNotes("");
    setFollowUpKind("");
    setFollowUpDueDate("");
    setBlockedNote("");
    setError("");
  }

  function openDetail(row: MarketingReportPublic) {
    setDetail(row);
    setView("detail");
    setSlotForms({});
  }

  async function submitReport(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await postPatientOps("/api/operations/marketing/reports", {
        kind,
        companyName,
        contacts,
        newCaseOutcome: kind === "new_case" ? newCaseOutcome : undefined,
        successRequest: successFlags.request,
        successContract: successFlags.contract,
        successBanner: successFlags.banner,
        successSkin: successFlags.skin,
        successProforma: successFlags.proforma,
        successSalesInvoice: successFlags.salesInvoice,
        contractDate: contractDate || undefined,
        unsuccessfulReason: unsuccessfulReason || undefined,
        unsuccessfulNotes: unsuccessfulNotes || undefined,
        followUpKind: followUpKind || undefined,
        followUpDueDate: followUpDueDate || undefined,
        blockedNote: blockedNote || undefined,
      });
      setSuccess("گزارش ثبت شد.");
      resetForm();
      reload();
      setView("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت ناموفق");
    } finally {
      setBusy(false);
    }
  }

  async function saveFollowUpSlot(slotIndex: number) {
    if (!detail) return;
    const f = slotForms[slotIndex];
    if (!f?.date) {
      setError("تاریخ پیگیری را انتخاب کنید.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await patchPatientOps<{ item: MarketingReportPublic }>(
        `/api/operations/marketing/reports/${encodeURIComponent(detail.id)}`,
        { action: "follow_up_slot", slotIndex, doneAt: f.date, note: f.note },
      );
      setDetail(data.item);
      setSuccess(`پیگیری ${slotIndex.toLocaleString("fa-IR")} ثبت شد.`);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  const followUpItems = items.filter(
    (row) =>
      row.kind === "follow_up" ||
      row.newCaseOutcome === "follow_up" ||
      Boolean(row.followUpKind),
  );

  if (visitor === undefined) {
    return <p className="text-sm text-slate-500">در حال بارگذاری…</p>;
  }

  if (!visitor) {
    return (
      <Card hover={false} className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        این بخش فقط برای ویزیتورهای فعال (موبایل ثبت‌شده در پنل ادمین) است.
      </Card>
    );
  }

  const showSuccessBranch =
    kind === "success" || (kind === "new_case" && newCaseOutcome === "success");
  const showUnsuccessfulBranch =
    kind === "unsuccessful" || (kind === "new_case" && newCaseOutcome === "unsuccessful");
  const showFollowUpBranch =
    kind === "follow_up" || (kind === "new_case" && newCaseOutcome === "follow_up");
  const showBlockedBranch =
    kind === "blocked" || (kind === "new_case" && newCaseOutcome === "blocked");

  return (
    <div className="space-y-4">
      <Card hover={false} className="border-teal-200 bg-teal-50/60 p-4">
        <p className="text-sm font-extrabold text-teal-950">بازاریابی — {visitor.name}</p>
        <p className="mt-1 font-mono text-xs text-teal-800">موبایل: {visitor.phone}</p>
      </Card>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">{success}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={view === "list" ? "primary" : "outline"} onClick={() => setView("list")}>
          گزارش‌های من
        </Button>
        <Button type="button" variant={view === "followups" ? "primary" : "outline"} onClick={() => setView("followups")}>
          نیاز به پیگیری
        </Button>
        <Button type="button" variant={view === "form" ? "primary" : "outline"} onClick={() => { resetForm(); setView("form"); }}>
          ثبت جدید
        </Button>
      </div>

      {view === "list" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="text-xs"
              variant={listKind === "all" ? "primary" : "outline"}
              onClick={() => setListKind("all")}
            >
              همه
            </Button>
            {MARKETING_KIND_OPTIONS.filter((o) => o.id !== "new_case").map((o) => (
              <Button
                key={o.id}
                type="button"
                className="text-xs"
                variant={listKind === o.id ? "primary" : "outline"}
                onClick={() => setListKind(o.id)}
              >
                {o.label}
              </Button>
            ))}
          </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-600">
              <tr>
                <th className="px-3 py-2 text-right">تاریخ</th>
                <th className="px-3 py-2 text-right">شرکت</th>
                <th className="px-3 py-2 text-right">وضعیت</th>
                <th className="px-3 py-2 text-right">جزئیات</th>
              </tr>
            </thead>
            <tbody>
              {items.filter((row) => listKind === "all" || row.kind === listKind).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                    هنوز گزارشی ثبت نکرده‌اید.
                  </td>
                </tr>
              ) : (
                items
                  .filter((row) => listKind === "all" || row.kind === listKind)
                  .map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-xs">{formatJalaliDate(row.createdAt.slice(0, 10))}</td>
                    <td className="px-3 py-2">{row.companyName || "—"}</td>
                    <td className="px-3 py-2 text-xs">{row.kindLabel}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-xs font-bold text-cyan-800 hover:underline"
                        onClick={() => openDetail(row)}
                      >
                        مشاهده
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      ) : null}

      {view === "followups" ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-amber-50 text-xs font-bold text-amber-950">
              <tr>
                <th className="px-3 py-2 text-right">شرکت</th>
                <th className="px-3 py-2 text-right">نوع پیگیری</th>
                <th className="px-3 py-2 text-right">سررسید</th>
                {[1, 2, 3, 4, 5].map((n) => (
                  <th key={n} className="px-2 py-2 text-right whitespace-nowrap">
                    پیگیری {n.toLocaleString("fa-IR")}
                  </th>
                ))}
                <th className="px-3 py-2 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {followUpItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                    مورد پیگیری باز ندارید.
                  </td>
                </tr>
              ) : (
                followUpItems.map((row) => {
                  const slotsByIndex = new Map(
                    row.followUpSlots.map((s) => [s.slotIndex, s]),
                  );
                  return (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{row.companyName || "—"}</td>
                      <td className="px-3 py-2 text-xs">{row.followUpKindLabel}</td>
                      <td className="px-3 py-2 text-xs">
                        {row.followUpDueDate ? formatJalaliDate(row.followUpDueDate) : "—"}
                      </td>
                      {[1, 2, 3, 4, 5].map((n) => {
                        const s = slotsByIndex.get(n);
                        return (
                          <td key={n} className="px-2 py-2 text-xs whitespace-nowrap">
                            {s?.doneAt ? formatJalaliDate(s.doneAt) : "—"}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="text-xs font-bold text-cyan-800"
                          onClick={() => openDetail(row)}
                        >
                          ثبت پیگیری
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {view === "form" ? (
        <Card hover={false} className="p-4">
          <form className="space-y-4" onSubmit={(e) => void submitReport(e)}>
            <FormLabel>نوع گزارش</FormLabel>
            <div className="flex flex-wrap gap-2">
              {MARKETING_KIND_OPTIONS.map((o) => (
                <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold">
                  <input type="radio" name="kind" checked={kind === o.id} onChange={() => setKind(o.id)} />
                  {o.label}
                </label>
              ))}
            </div>

            {(kind === "new_case" || companyName) && kind !== "blocked" ? (
              <>
                <FormLabel>نام شرکت / مؤسسه</FormLabel>
                <FormInput value={companyName} onChange={(e) => setCompanyName(e.target.value)} required={kind === "new_case"} />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="grid gap-2 rounded-xl border border-slate-100 p-3 sm:grid-cols-3">
                    <div>
                      <FormLabel>مسئول {String(i + 1)}</FormLabel>
                      <FormInput
                        value={contacts[i]?.name || ""}
                        onChange={(e) =>
                          setContacts((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], name: e.target.value };
                            return next;
                          })
                        }
                      />
                    </div>
                    <div>
                      <FormLabel>موبایل</FormLabel>
                      <FormInput
                        value={contacts[i]?.phone || ""}
                        onChange={(e) =>
                          setContacts((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], phone: e.target.value };
                            return next;
                          })
                        }
                      />
                    </div>
                    <div>
                      <FormLabel>سمت</FormLabel>
                      <FormInput
                        value={contacts[i]?.role || ""}
                        onChange={(e) =>
                          setContacts((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], role: e.target.value };
                            return next;
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </>
            ) : null}

            {kind === "new_case" ? (
              <>
                <FormLabel>نتیجه ویزیت</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {MARKETING_NEW_CASE_OUTCOME_OPTIONS.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 text-sm font-bold">
                      <input
                        type="radio"
                        name="newOutcome"
                        checked={newCaseOutcome === o.id}
                        onChange={() => setNewCaseOutcome(o.id)}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              </>
            ) : null}

            {showSuccessBranch ? (
              <div className="space-y-2 rounded-xl border border-teal-100 bg-teal-50/40 p-3">
                <p className="text-sm font-extrabold text-teal-900">اقدامات موفق</p>
                {(
                  [
                    ["request", "ارائه درخواست"],
                    ["contract", "ارائه قرارداد"],
                    ["banner", "ارائه بنر"],
                    ["skin", "ارائه پوستر"],
                    ["proforma", "ارائه پیش‌فاکتور"],
                    ["salesInvoice", "ارائه فاکتور فروش"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={successFlags[key]}
                      onChange={(e) => setSuccessFlags((f) => ({ ...f, [key]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
                <FormLabel>زمان قرارداد</FormLabel>
                <JalaliBirthDateField value={contractDate} onChange={(iso) => setContractDate(iso || "")} />
              </div>
            ) : null}

            {showUnsuccessfulBranch ? (
              <div className="space-y-2 rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                <p className="text-sm font-extrabold text-rose-900">دلایل ناموفق</p>
                {MARKETING_UNSUCCESSFUL_REASON_OPTIONS.map((o) => (
                  <label key={o.id} className="flex items-center gap-2 text-sm font-bold">
                    <input
                      type="radio"
                      name="unsuccess"
                      checked={unsuccessfulReason === o.id}
                      onChange={() => setUnsuccessfulReason(o.id)}
                    />
                    {o.label}
                  </label>
                ))}
                <FormLabel>توضیحات</FormLabel>
                <FormTextarea rows={3} value={unsuccessfulNotes} onChange={(e) => setUnsuccessfulNotes(e.target.value)} />
              </div>
            ) : null}

            {showFollowUpBranch ? (
              <div className="space-y-2 rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                <p className="text-sm font-extrabold text-amber-900">نیاز به پیگیری</p>
                {MARKETING_FOLLOW_UP_KIND_OPTIONS.map((o) => (
                  <label key={o.id} className="flex items-center gap-2 text-sm font-bold">
                    <input
                      type="radio"
                      name="fuk"
                      checked={followUpKind === o.id}
                      onChange={() => setFollowUpKind(o.id)}
                    />
                    {o.label}
                  </label>
                ))}
                <FormLabel>تاریخ پیگیری</FormLabel>
                <JalaliBirthDateField value={followUpDueDate} onChange={(iso) => setFollowUpDueDate(iso || "")} />
              </div>
            ) : null}

            {showBlockedBranch ? (
              <div className="space-y-2 rounded-xl border border-slate-300 bg-slate-50 p-3">
                <p className="text-sm font-extrabold">شرکت مسدود</p>
                <FormTextarea
                  rows={2}
                  placeholder="دلیل مسدودی (اختیاری برای مورد جدید)"
                  value={blockedNote}
                  onChange={(e) => setBlockedNote(e.target.value)}
                />
              </div>
            ) : null}

            <Button type="submit" disabled={busy}>
              {busy ? "در حال ثبت…" : "ثبت گزارش"}
            </Button>
          </form>
        </Card>
      ) : null}

      {view === "detail" && detail ? (
        <Card hover={false} className="space-y-3 p-4">
          <button type="button" className="text-sm font-bold text-cyan-800" onClick={() => setView("list")}>
            ← بازگشت
          </button>
          <p className="font-extrabold">{detail.companyName || detail.kindLabel}</p>
          <p className="text-xs text-slate-600">{detail.kindLabel} · {formatJalaliDate(detail.createdAt.slice(0, 10))}</p>
          {detail.followUpKind ? (
            <p className="text-sm">
              پیگیری: {detail.followUpKindLabel} — سررسید {detail.followUpDueDate ? formatJalaliDate(detail.followUpDueDate) : "—"}
            </p>
          ) : null}
          {detail.followUpSlots.length > 0 ? (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <p className="text-sm font-extrabold">پیگیری ۱ تا {MARKETING_FOLLOW_UP_SLOT_COUNT.toLocaleString("fa-IR")}</p>
              {detail.followUpSlots.map((slot) => (
                <div key={slot.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs font-bold text-slate-700">
                    پیگیری {slot.slotIndex.toLocaleString("fa-IR")}
                    {slot.doneAt ? ` — انجام: ${formatJalaliDate(slot.doneAt)}` : ""}
                  </p>
                  {slot.note ? <p className="mt-1 text-xs text-slate-500">{slot.note}</p> : null}
                  {!slot.doneAt ? (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <JalaliBirthDateField
                        value={slotForms[slot.slotIndex]?.date || ""}
                        onChange={(iso) =>
                          setSlotForms((f) => ({
                            ...f,
                            [slot.slotIndex]: { date: iso || "", note: f[slot.slotIndex]?.note || "" },
                          }))
                        }
                      />
                      <FormInput
                        placeholder="یادداشت"
                        value={slotForms[slot.slotIndex]?.note || ""}
                        onChange={(e) =>
                          setSlotForms((f) => ({
                            ...f,
                            [slot.slotIndex]: { date: f[slot.slotIndex]?.date || "", note: e.target.value },
                          }))
                        }
                      />
                      <Button type="button" variant="outline" disabled={busy} onClick={() => void saveFollowUpSlot(slot.slotIndex)}>
                        ثبت این پیگیری
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
