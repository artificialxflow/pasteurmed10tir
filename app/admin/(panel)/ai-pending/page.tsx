"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import {
  AI_PENDING_STATUS_LABELS,
  labelAiPendingStatus,
  type AiPendingStatusKey,
} from "@/lib/ai/admin-labels";
import { fetchAdminOps, patchAdminOps, postAdminOps } from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";

type PendingRow = {
  id: string;
  questionText: string;
  status: string;
  organizationId: string | null;
  adminAnswerText: string | null;
  answerDocumentId: string | null;
  createdAt: string;
  answeredAt: string | null;
};

type FormMode = "answer" | "edit";

const FILTER_KEYS: AiPendingStatusKey[] = ["open", "answered", "dismissed", "all"];

function parseKeywordsFromDocumentBody(body: string | null | undefined): string {
  if (!body) return "";
  const match = body.match(/^کلمات کلیدی:\s*(.+?)(?:\n\n|$)/);
  if (!match) return "";
  return match[1]
    .split(/[,،]/)
    .map((k) => k.trim())
    .filter(Boolean)
    .join("، ");
}

export default function AdminAiPendingPage() {
  const [items, setItems] = useState<PendingRow[]>([]);
  const [filter, setFilter] = useState<AiPendingStatusKey>("open");
  const [expandedId, setExpandedId] = useState("");
  const [selected, setSelected] = useState<PendingRow | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("answer");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  function reload() {
    const q = filter === "all" ? "?status=all" : `?status=${filter}`;
    return fetchAdminOps<{ items: PendingRow[] }>(`/api/admin/operations/ai/pending${q}`).then((d) =>
      setItems(d.items),
    );
  }

  useEffect(() => {
    void reload().catch((e: Error) => setError(e.message));
  }, [filter]);

  function closeForm() {
    setSelected(null);
    setAnswer("");
    setKeywords("");
    setFormMode("answer");
  }

  async function loadKeywordsForRow(row: PendingRow) {
    if (!row.answerDocumentId) {
      setKeywords("");
      return;
    }
    try {
      const doc = await fetchAdminOps<{ body: string | null }>(
        `/api/admin/operations/ai/documents/${row.answerDocumentId}`,
      );
      setKeywords(parseKeywordsFromDocumentBody(doc.body));
    } catch {
      setKeywords("");
    }
  }

  function openAnswerForm(row: PendingRow) {
    setSelected(row);
    setFormMode("answer");
    setAnswer("");
    setKeywords("");
    setSuccess("");
  }

  async function openEditForm(row: PendingRow) {
    setSelected(row);
    setFormMode("edit");
    setAnswer(row.adminAnswerText || "");
    setSuccess("");
    await loadKeywordsForRow(row);
  }

  async function copyAnswer(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("پاسخ در کلیپ‌بورد کپی شد.");
    } catch {
      setError("کپی در این مرورگر ممکن نبود — متن را دستی انتخاب کنید.");
    }
  }

  function reuseAnswer(source: PendingRow) {
    const openRow = items.find((r) => r.status === "open");
    if (!openRow) {
      setError("سوالی با وضعیت «باز» برای ثبت پاسخ نیست.");
      return;
    }
    setAnswer(source.adminAnswerText || "");
    setKeywords("");
    setFormMode("answer");
    setSelected(openRow);
    setSuccess("متن پاسخ در فرم سوال باز قرار گرفت — در صورت نیاز ویرایش و ثبت کنید.");
    setError("");
  }

  async function submitAnswer() {
    if (!selected || !answer.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (formMode === "edit") {
        await patchAdminOps(`/api/admin/operations/ai/pending/${selected.id}`, {
          answerText: answer,
          keywords: keywords.trim() || undefined,
        });
        setSuccess("پاسخ به‌روزرسانی و ایندکس دانش بازسازی شد.");
      } else {
        await postAdminOps(`/api/admin/operations/ai/pending/${selected.id}`, {
          answerText: answer,
          keywords: keywords.trim() || undefined,
        });
        setSuccess("پاسخ ثبت و به دانش اضافه شد.");
      }
      closeForm();
      setExpandedId("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function reembedAnswered() {
    setBusy(true);
    setError("");
    try {
      const data = await postAdminOps<{ count: number }>(
        "/api/admin/operations/ai/pending/reembed-answered",
        {},
      );
      setSuccess(`ایندکس ${data.count.toLocaleString("fa-IR")} پاسخ بازسازی شد.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function dismiss(id: string) {
    setBusy(true);
    try {
      await postAdminOps(`/api/admin/operations/ai/pending/${id}`, { action: "dismiss" });
      closeForm();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Link href={ROUTES.admin.aiKnowledge} className="text-sm font-bold text-cyan-800 underline">
        ← پایگاه دانش
      </Link>
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
      {success ? <p className="text-sm font-bold text-teal-800">{success}</p> : null}

      <div className="flex flex-wrap gap-2">
        {FILTER_KEYS.map((s) => (
          <Button
            key={s}
            type="button"
            variant={filter === s ? "primary" : "outline"}
            className="text-xs"
            onClick={() => setFilter(s)}
          >
            {AI_PENDING_STATUS_LABELS[s]}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          className="text-xs"
          disabled={busy}
          onClick={() => void reembedAnswered()}
        >
          بازسازی ایندکس پاسخ‌های ثبت‌شده
        </Button>
      </div>

      <AdminTable headers={["سوال", "وضعیت", "تاریخ", ""]} empty="موردی نیست.">
        {items.map((row) => (
          <Fragment key={row.id}>
            <tr className="border-t border-slate-100 align-top">
              <td className="max-w-md px-4 py-3 text-sm">
                <button
                  type="button"
                  className="text-right hover:text-cyan-900"
                  onClick={() => {
                    if (row.adminAnswerText) {
                      setExpandedId(expandedId === row.id ? "" : row.id);
                    }
                  }}
                >
                  {row.questionText}
                </button>
              </td>
              <td className="px-4 py-3">
                <AdminBadge tone={row.status === "open" ? "warn" : "neutral"}>
                  {labelAiPendingStatus(row.status)}
                </AdminBadge>
              </td>
              <td className="px-4 py-3 text-xs">{new Date(row.createdAt).toLocaleString("fa-IR")}</td>
              <td className="space-y-1 px-4 py-3">
                {row.status === "open" ? (
                  <button
                    type="button"
                    className="block text-xs font-bold text-cyan-800"
                    onClick={() => openAnswerForm(row)}
                  >
                    پاسخ
                  </button>
                ) : null}
                {row.status === "answered" && row.adminAnswerText ? (
                  <>
                    <button
                      type="button"
                      className="block text-xs font-bold text-cyan-800"
                      onClick={() => setExpandedId(expandedId === row.id ? "" : row.id)}
                    >
                      {expandedId === row.id ? "بستن" : "مشاهده پاسخ"}
                    </button>
                    <button
                      type="button"
                      className="block text-xs font-bold text-slate-700"
                      onClick={() => void openEditForm(row)}
                    >
                      ویرایش
                    </button>
                  </>
                ) : null}
              </td>
            </tr>
            {expandedId === row.id && row.adminAnswerText ? (
              <tr className="border-t border-slate-50 bg-slate-50/50">
                <td colSpan={4} className="px-4 py-3">
                  <p className="mb-2 text-xs font-bold text-slate-600">پاسخ ثبت‌شده</p>
                  <p className="whitespace-pre-wrap break-words rounded-xl bg-white p-3 text-sm text-slate-800">
                    {row.adminAnswerText}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      onClick={() => void copyAnswer(row.adminAnswerText || "")}
                    >
                      کپی
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      onClick={() => reuseAnswer(row)}
                    >
                      استفاده در فرم پاسخ
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      onClick={() => void openEditForm(row)}
                    >
                      ویرایش
                    </Button>
                  </div>
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </AdminTable>

      {selected ? (
        <Card hover={false} className="space-y-3 p-4">
          <p className="text-sm font-bold">
            {formMode === "edit" ? "ویرایش پاسخ" : "پاسخ به سوال"}
          </p>
          <p className="rounded-xl bg-slate-50 p-3 text-sm">{selected.questionText}</p>
          <div>
            <FormLabel>کلمات کلیدی (اختیاری، با ویرگول — برای جستجوی کوتاه مثل «وام»)</FormLabel>
            <FormInput
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="وام، تسهیلات، اعتبار"
            />
          </div>
          <FormLabel>متن پاسخ (وارد دانش می‌شود)</FormLabel>
          <FormTextarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => void submitAnswer()}>
              {formMode === "edit" ? "ذخیره تغییرات" : "ثبت پاسخ"}
            </Button>
            {formMode === "answer" ? (
              <Button type="button" variant="outline" disabled={busy} onClick={() => void dismiss(selected.id)}>
                رد / بستن
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={closeForm}>
              انصراف
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
