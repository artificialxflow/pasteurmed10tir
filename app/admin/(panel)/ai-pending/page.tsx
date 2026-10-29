"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormLabel, FormTextarea } from "@/components/ui/Card";
import { fetchAdminOps, postAdminOps } from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useEffect, useState } from "react";

type PendingRow = {
  id: string;
  questionText: string;
  status: string;
  organizationId: string | null;
  createdAt: string;
};

export default function AdminAiPendingPage() {
  const [items, setItems] = useState<PendingRow[]>([]);
  const [filter, setFilter] = useState("open");
  const [selected, setSelected] = useState<PendingRow | null>(null);
  const [answer, setAnswer] = useState("");
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

  async function submitAnswer() {
    if (!selected || !answer.trim()) return;
    setBusy(true);
    setError("");
    try {
      await postAdminOps(`/api/admin/operations/ai/pending/${selected.id}`, {
        answerText: answer,
      });
      setSuccess("پاسخ ثبت و به دانش اضافه شد.");
      setAnswer("");
      setSelected(null);
      await reload();
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
        {(["open", "answered", "dismissed", "all"] as const).map((s) => (
          <Button
            key={s}
            type="button"
            variant={filter === s ? "primary" : "outline"}
            className="text-xs"
            onClick={() => setFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      <AdminTable headers={["سوال", "وضعیت", "تاریخ", ""]} empty="موردی نیست.">
        {items.map((row) => (
          <tr key={row.id} className="border-t border-slate-100 align-top">
            <td className="max-w-md px-4 py-3 text-sm">{row.questionText}</td>
            <td className="px-4 py-3">
              <AdminBadge tone={row.status === "open" ? "warn" : "neutral"}>{row.status}</AdminBadge>
            </td>
            <td className="px-4 py-3 text-xs">{new Date(row.createdAt).toLocaleString("fa-IR")}</td>
            <td className="px-4 py-3">
              {row.status === "open" ? (
                <button
                  type="button"
                  className="text-xs font-bold text-cyan-800"
                  onClick={() => {
                    setSelected(row);
                    setAnswer("");
                  }}
                >
                  پاسخ
                </button>
              ) : null}
            </td>
          </tr>
        ))}
      </AdminTable>

      {selected ? (
        <Card hover={false} className="space-y-3 p-4">
          <p className="text-sm font-bold">پاسخ به سوال</p>
          <p className="rounded-xl bg-slate-50 p-3 text-sm">{selected.questionText}</p>
          <FormLabel>متن پاسخ (وارد دانش می‌شود)</FormLabel>
          <FormTextarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => void submitAnswer()}>
              ثبت پاسخ
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => void dismiss(selected.id)}>
              رد / بستن
            </Button>
            <Button type="button" variant="outline" onClick={() => setSelected(null)}>
              انصراف
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
