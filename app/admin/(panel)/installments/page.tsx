"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Card";
import { DraftNumberInput } from "@/components/ui/DraftNumberInput";
import {
  filterInstallmentPlansForReport,
  INSTALLMENT_REPORT_TABS,
  type InstallmentReportSource,
} from "@/lib/admin/installment-report";
import {
  deleteAdminCommerce,
  downloadAdminCommerceExport,
  fetchAdminCommerce,
  patchAdminCommerce,
  postAdminCommerce,
  postAdminCommerceForm,
} from "@/lib/commerce/client";
import { confirmAction } from "@/lib/ui/confirm-action";
import {
  formatJalaliDate,
  installmentSourceLabel,
  remainingInstallment,
  type InstallmentPlan,
} from "@/lib/patient";
import { cn, formatPrice } from "@/lib/utils";
import { Fragment, useEffect, useMemo, useState } from "react";

export default function AdminInstallmentsPage() {
  const [items, setItems] = useState<InstallmentPlan[]>([]);
  const [rawItems, setRawItems] = useState<InstallmentPlan[]>([]);
  const [sourceFilter, setSourceFilter] = useState<InstallmentReportSource>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [manualNote, setManualNote] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemDueDate, setNewItemDueDate] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function reload() {
    return Promise.all([
      fetchAdminCommerce<{ items: InstallmentPlan[] }>("/api/admin/commerce/installments"),
      fetchAdminCommerce<{ items: InstallmentPlan[] }>("/api/admin/commerce/installments?raw=1"),
    ]).then(([visible, raw]) => {
      setItems(visible.items);
      setRawItems(raw.items);
    });
  }

  useEffect(() => {
    void reload().catch((e: Error) => setError(e.message));
  }, []);

  const filtered = useMemo(
    () => filterInstallmentPlansForReport(items, rawItems, sourceFilter),
    [items, rawItems, sourceFilter],
  );

  async function exportReport(format: "xlsx" | "pdf" | "csv") {
    setError("");
    setExportBusy(format);
    const stamp = new Date().toISOString().slice(0, 10);
    const path = `/api/admin/commerce/installments/export?format=${format}&source=${encodeURIComponent(sourceFilter)}`;
    try {
      if (format === "pdf") {
        window.open(path, "_blank", "noopener,noreferrer");
        setSuccess("صفحه گزارش PDF باز شد — از چاپ، «ذخیره به PDF» را انتخاب کنید.");
      } else {
        const ext = format === "xlsx" ? "xlsx" : "csv";
        await downloadAdminCommerceExport(path, `installments-${sourceFilter}-${stamp}.${ext}`);
        setSuccess(format === "xlsx" ? "فایل Excel دانلود شد." : "فایل CSV دانلود شد.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خروجی گزارش ناموفق");
    } finally {
      setExportBusy(null);
    }
  }

  async function manualPay(planId: string, scheduleItemId: string, amount: number) {
    if (!confirmAction("این قسط به‌صورت دستی پرداخت‌شده ثبت شود؟")) return;
    setError("");
    setSuccess("");
    setBusyId(scheduleItemId);
    try {
      await postAdminCommerce("/api/admin/commerce/installments/manual-pay", {
        planId,
        scheduleItemId,
        amount,
        note: manualNote.trim() || undefined,
      });
      setSuccess("واریز دستی ثبت شد.");
      setManualNote("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ثبت ناموفق");
    } finally {
      setBusyId(null);
    }
  }

  async function patchPlan(
    planId: string,
    body: Record<string, unknown>,
    busyKey = planId,
  ) {
    setError("");
    setSuccess("");
    setBusyId(busyKey);
    try {
      await patchAdminCommerce(`/api/admin/commerce/installments/${encodeURIComponent(planId)}`, body);
      setSuccess("طرح اقساط به‌روز شد.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ویرایش ناموفق");
    } finally {
      setBusyId(null);
    }
  }

  async function deletePlan(plan: InstallmentPlan) {
    const paid = Number(plan.paidAmount || 0);
    const paidWarn =
      paid > 0
        ? `\n\nهشدار: ${formatPrice(paid)} از این طرح پرداخت شده. سابقه در دیتابیس می‌ماند ولی از لیست ناپدید می‌شود.`
        : "";
    if (
      !window.confirm(
        `طرح «${plan.title}» برای ${plan.patientName || plan.phone} حذف شود؟${paidWarn}`,
      )
    ) {
      return;
    }
    setError("");
    setSuccess("");
    setBusyId(`${plan.id}-del`);
    try {
      const res = await deleteAdminCommerce<{ message?: string }>(
        `/api/admin/commerce/installments/${encodeURIComponent(plan.id)}`,
      );
      setSuccess(res.message || "طرح اقساط حذف شد.");
      setExpandedId(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حذف ناموفق");
    } finally {
      setBusyId(null);
    }
  }

  function openPlan(plan: InstallmentPlan) {
    setExpandedId(plan.id);
    setEditTotal(String(plan.totalAmount));
    setEditNote("");
    setNewItemAmount("");
    setNewItemDueDate("");
  }

  async function uploadPlanDocument(
    planId: string,
    kind: "contract" | "cheque",
    file: File,
  ) {
    setError("");
    setSuccess("");
    setBusyId(`${planId}-doc-${kind}`);
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", file);
      await postAdminCommerceForm(
        `/api/admin/commerce/installments/${encodeURIComponent(planId)}/documents`,
        form,
      );
      setSuccess(kind === "contract" ? "قرارداد بارگذاری شد." : "فایل چک بارگذاری شد.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "آپلود ناموفق");
    } finally {
      setBusyId(null);
    }
  }

  async function removePlanDocument(planId: string, docId: string) {
    if (!confirmAction("این فایل حذف شود؟")) return;
    setError("");
    setBusyId(docId);
    try {
      await deleteAdminCommerce(
        `/api/admin/commerce/installments/${encodeURIComponent(planId)}/documents?docId=${encodeURIComponent(docId)}`,
      );
      setSuccess("فایل حذف شد.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حذف ناموفق");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-teal-700">{success}</p> : null}
      <p className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-3 text-xs leading-6 text-slate-700">
        وام درمانی، تسهیلات تجهیزات و اعتبار/کیف — هر کدام طرح اقساط جدا دارند. از اینجا می‌توانید
        واریز حضوری را ثبت کنید یا گزارش Excel/PDF بگیرید.
      </p>

      <div className="flex flex-wrap gap-2">
        {INSTALLMENT_REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSourceFilter(tab.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold transition",
              sourceFilter === tab.id
                ? "border-teal-500 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          disabled={exportBusy !== null}
          onClick={() => void exportReport("xlsx")}
        >
          {exportBusy === "xlsx" ? "در حال آماده‌سازی..." : "خروجی Excel"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          disabled={exportBusy !== null}
          onClick={() => void exportReport("pdf")}
        >
          {exportBusy === "pdf" ? "در حال باز کردن..." : "خروجی PDF"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          disabled={exportBusy !== null}
          onClick={() => void exportReport("csv")}
        >
          {exportBusy === "csv" ? "در حال آماده‌سازی..." : "خروجی CSV"}
        </Button>
        <span className="text-xs text-slate-500">
          {filtered.length.toLocaleString("fa-IR")} طرح در این فیلتر
        </span>
      </div>

      <AdminTable
        headers={["بیمار", "عنوان", "کل", "پرداخت‌شده", "مانده", "منبع", "جزئیات"]}
        empty="طرح اقساطی نیست."
      >
        {filtered.map((p) => (
          <Fragment key={p.id}>
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3">
                {p.patientName || "—"}
                <div className="text-xs text-slate-500">{p.phone}</div>
              </td>
              <td className="px-4 py-3">{p.title}</td>
              <td className="px-4 py-3">{formatPrice(p.totalAmount)}</td>
              <td className="px-4 py-3">{formatPrice(p.paidAmount)}</td>
              <td className="px-4 py-3">{formatPrice(remainingInstallment(p))}</td>
              <td className="px-4 py-3">
                {installmentSourceLabel(p.source)}
                {(p.source === "membership" || p.status === "hidden") && (
                  <span className="mt-0.5 block text-xs text-amber-700">منسوخ</span>
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="text-xs font-bold text-cyan-800"
                  onClick={() => (expandedId === p.id ? setExpandedId(null) : openPlan(p))}
                >
                  {expandedId === p.id ? "بستن" : "باز کردن"}
                </button>
              </td>
            </tr>
            {expandedId === p.id ? (
              <tr className="border-t border-slate-50 bg-slate-50/50">
                <td colSpan={7} className="px-4 py-4">
                  <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <p className="mb-2 text-xs font-bold text-slate-700">ویرایش مبلغ کل طرح</p>
                      <div className="flex flex-wrap items-end gap-2">
                        <DraftNumberInput
                          min={p.paidAmount}
                          max={2_000_000_000}
                          value={Number(editTotal || p.totalAmount)}
                          onCommit={(value) => setEditTotal(String(value))}
                          className="min-w-[140px]"
                        />
                        <FormInput
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="یادداشت ویرایش (اختیاری)"
                          className="min-w-[180px] text-xs"
                        />
                        <Button
                          type="button"
                          className="px-3 py-1.5 text-xs"
                          disabled={busyId === p.id}
                          onClick={() =>
                            void patchPlan(p.id, {
                              action: "updateTotal",
                              totalAmount: Number(editTotal || p.totalAmount),
                              note: editNote.trim() || undefined,
                            })
                          }
                        >
                          بازمحاسبه اقساط
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold text-slate-700">افزودن قسط جدید</p>
                      <div className="flex flex-wrap items-end gap-2">
                        <FormInput
                          type="number"
                          min={0}
                          value={newItemAmount}
                          onChange={(e) => setNewItemAmount(e.target.value)}
                          placeholder="مبلغ (اختیاری)"
                          className="w-28 text-xs"
                        />
                        <FormInput
                          type="date"
                          value={newItemDueDate}
                          onChange={(e) => setNewItemDueDate(e.target.value)}
                          className="text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="px-3 py-1.5 text-xs"
                          disabled={busyId === `${p.id}-add`}
                          onClick={() =>
                            void patchPlan(
                              p.id,
                              {
                                action: "addItem",
                                amount: newItemAmount ? Number(newItemAmount) : undefined,
                                dueDate: newItemDueDate || undefined,
                                note: editNote.trim() || undefined,
                              },
                              `${p.id}-add`,
                            )
                          }
                        >
                          افزودن قسط
                        </Button>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Button
                        type="button"
                        variant="danger"
                        className="px-3 py-1.5 text-xs"
                        disabled={busyId === `${p.id}-del`}
                        onClick={() => void deletePlan(p)}
                      >
                        حذف طرح
                      </Button>
                    </div>
                  </div>
                  <div className="mb-3 max-w-md">
                    <FormInput
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      placeholder="توضیح واریز دستی (اختیاری)"
                      className="text-xs"
                    />
                  </div>
                  <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
                    <p className="mb-2 text-xs font-bold text-slate-800">قرارداد و چک</p>
                    <p className="mb-3 text-[0.65rem] text-slate-500">
                      فرمت مجاز: jpg، png، webp، pdf — حداکثر ۱۲ مگابایت
                    </p>
                    <div className="mb-3 flex flex-wrap gap-3">
                      <label className="flex cursor-pointer flex-col gap-1 text-xs font-bold text-teal-800">
                        بارگذاری قرارداد
                        <input
                          type="file"
                          accept=".pdf,image/jpeg,image/png,image/webp"
                          className="text-[0.65rem] font-normal text-slate-600"
                          disabled={busyId === `${p.id}-doc-contract`}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void uploadPlanDocument(p.id, "contract", f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <label className="flex cursor-pointer flex-col gap-1 text-xs font-bold text-teal-800">
                        بارگذاری چک
                        <input
                          type="file"
                          accept=".pdf,image/jpeg,image/png,image/webp"
                          className="text-[0.65rem] font-normal text-slate-600"
                          disabled={busyId === `${p.id}-doc-cheque`}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void uploadPlanDocument(p.id, "cheque", f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    {(p.documents || []).length === 0 ? (
                      <p className="text-xs text-slate-500">هنوز فایلی ثبت نشده.</p>
                    ) : (
                      <ul className="space-y-2 text-xs">
                        {(p.documents || []).map((doc) => (
                          <li
                            key={doc.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
                          >
                            <span>
                              {doc.kind === "contract" ? "قرارداد" : "چک"} — {doc.originalName}
                              <span className="mr-2 text-slate-400">
                                {formatJalaliDate(doc.createdAt)}
                              </span>
                            </span>
                            <div className="flex gap-2">
                              <a
                                href={doc.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-cyan-800 hover:underline"
                              >
                                مشاهده
                              </a>
                              <button
                                type="button"
                                className="font-bold text-rose-700"
                                disabled={busyId === doc.id}
                                onClick={() => void removePlanDocument(p.id, doc.id)}
                              >
                                حذف
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="space-y-2 text-xs">
                    {(p.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <span>
                          قسط {item.index} · {formatJalaliDate(item.dueDate)} ·{" "}
                          {formatPrice(item.amount)} · {item.status}
                          {item.remaining > 0 ? ` · مانده ${formatPrice(item.remaining)}` : ""}
                          {item.penalty ? ` · ضرر-زیان ${formatPrice(item.penalty)}` : ""}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {item.status !== "paid" && item.remaining > 0 ? (
                            <>
                              <DraftNumberInput
                                min={item.paidAmount || 0}
                                max={500_000_000}
                                value={item.amount}
                                onCommit={(amount) =>
                                  void patchPlan(
                                    p.id,
                                    {
                                      action: "updateItem",
                                      scheduleItemId: item.id,
                                      amount,
                                      note: editNote.trim() || undefined,
                                    },
                                    item.id,
                                  )
                                }
                                className="min-w-[100px]"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="px-2 py-1 text-[0.65rem]"
                                disabled={busyId === `${item.id}-rm`}
                                onClick={() => {
                                  if (!confirmAction("این قسط از جدول حذف شود؟")) return;
                                  void patchPlan(
                                    p.id,
                                    {
                                      action: "removeItem",
                                      scheduleItemId: item.id,
                                      note: editNote.trim() || undefined,
                                    },
                                    `${item.id}-rm`,
                                  );
                                }}
                              >
                                حذف
                              </Button>
                              <Button
                                type="button"
                                className="px-3 py-1 text-[0.65rem]"
                                disabled={busyId === item.id}
                                onClick={() => void manualPay(p.id, item.id, item.remaining)}
                              >
                                ثبت واریز دستی
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {!p.items?.length ? (
                      <p className="text-slate-500">لیست قسط خالی است (پس از migrate heal می‌شود).</p>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </AdminTable>
    </div>
  );
}
