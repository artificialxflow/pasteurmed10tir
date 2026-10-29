"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Card";
import { deleteAdminOps, fetchAdminOps, patchAdminOps, postAdminOps } from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import { confirmAction } from "@/lib/ui/confirm-action";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type DocRow = {
  id: string;
  title: string;
  source: string;
  organizationId: string | null;
  published: boolean;
  chunkCount: number;
  updatedAt: string;
};

type OrgRow = { id: string; name: string };

export default function AdminAiKnowledgePage() {
  const searchParams = useSearchParams();
  const orgFilter = searchParams.get("organizationId") || "";

  const [items, setItems] = useState<DocRow[]>([]);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [organizationId, setOrganizationId] = useState(orgFilter);
  const [voiceMaxSeconds, setVoiceMaxSeconds] = useState("180");
  const [threshold, setThreshold] = useState("0.42");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const q = orgFilter ? `?organizationId=${encodeURIComponent(orgFilter)}` : "";
    const docs = await fetchAdminOps<{ items: DocRow[] }>(`/api/admin/operations/ai/documents${q}`);
    setItems(docs.items);
    const settings = await fetchAdminOps<{
      voiceMaxSeconds: number;
      similarityThreshold: number;
    }>("/api/admin/operations/ai/settings");
    setVoiceMaxSeconds(String(settings.voiceMaxSeconds));
    setThreshold(String(settings.similarityThreshold));
  }, [orgFilter]);

  useEffect(() => {
    setOrganizationId(orgFilter);
  }, [orgFilter]);

  useEffect(() => {
    void reload().catch((e: Error) => setError(e.message));
    fetchAdminOps<{ items: OrgRow[] }>("/api/admin/operations/ai/org-options")
      .then((d) => setOrgs(d.items || []))
      .catch(() => {});
  }, [reload]);

  async function createDoc() {
    if (!title.trim() || !body.trim()) {
      setError("عنوان و متن الزامی است.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await postAdminOps("/api/admin/operations/ai/documents", {
        title,
        body,
        organizationId: organizationId || undefined,
        source: organizationId ? "org_policy" : "admin_manual",
      });
      setTitle("");
      setBody("");
      setSuccess("سند ذخیره و embedding ساخته شد.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function ingestSiteMap() {
    setBusy(true);
    setError("");
    try {
      await postAdminOps("/api/admin/operations/ai/ingest-site-map", {});
      setSuccess("نقشه سایت بارگذاری شد.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    setBusy(true);
    setError("");
    try {
      await patchAdminOps("/api/admin/operations/ai/settings", {
        voiceMaxSeconds: Number(voiceMaxSeconds),
        similarityThreshold: Number(threshold),
      });
      setSuccess("تنظیمات ذخیره شد.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function reembed(id: string) {
    setBusy(true);
    try {
      await postAdminOps(`/api/admin/operations/ai/documents/${id}/reembed`, {});
      setSuccess("embedding بازسازی شد.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function removeDoc(id: string) {
    if (!confirmAction("این سند از دانش حذف شود؟")) return;
    setBusy(true);
    try {
      await deleteAdminOps(`/api/admin/operations/ai/documents/${id}`);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">مدیریت پایگاه دانش دستیار RAG</p>
        <Link href={ROUTES.admin.aiPending} className="text-sm font-bold text-cyan-800 underline">
          سوالات بدون پاسخ
        </Link>
      </div>
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
      {success ? <p className="text-sm font-bold text-teal-800">{success}</p> : null}

      <Card hover={false} className="space-y-3 p-4">
        <p className="font-bold">تنظیمات</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <FormLabel>حداکثر ضبط صوتی (ثانیه)</FormLabel>
            <FormInput value={voiceMaxSeconds} onChange={(e) => setVoiceMaxSeconds(e.target.value)} />
          </div>
          <div>
            <FormLabel>آستانه فاصله cosine (کمتر = دقیق‌تر)</FormLabel>
            <FormInput value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </div>
        </div>
        <Button type="button" disabled={busy} onClick={() => void saveSettings()}>
          ذخیره تنظیمات
        </Button>
      </Card>

      <Card hover={false} className="space-y-3 p-4">
        <p className="font-bold">سند جدید</p>
        <div>
          <FormLabel>سازمان (خالی = سراسری)</FormLabel>
          <FormSelect value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}>
            <option value="">— سراسری pasteur.plus —</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </FormSelect>
        </div>
        <div>
          <FormLabel>عنوان</FormLabel>
          <FormInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <FormLabel>متن / پاسخ</FormLabel>
          <FormTextarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => void createDoc()}>
            ذخیره و embed
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void ingestSiteMap()}>
            بارگذاری نقشه سایت
          </Button>
        </div>
      </Card>

      <AdminTable headers={["عنوان", "منبع", "chunks", "عملیات"]} empty="سندی ثبت نشده.">
        {items.map((row) => (
          <tr key={row.id} className="border-t border-slate-100">
            <td className="px-4 py-3 text-sm">
              <div className="font-bold">{row.title}</div>
              {row.organizationId ? (
                <div className="text-xs text-slate-500">سازمان: {row.organizationId}</div>
              ) : null}
            </td>
            <td className="px-4 py-3 text-xs">{row.source}</td>
            <td className="px-4 py-3 text-xs">{row.chunkCount}</td>
            <td className="px-4 py-3 space-x-2 space-x-reverse">
              <button
                type="button"
                className="text-xs font-bold text-cyan-800"
                onClick={() => void reembed(row.id)}
              >
                re-embed
              </button>
              <button
                type="button"
                className="text-xs font-bold text-red-600"
                onClick={() => void removeDoc(row.id)}
              >
                حذف
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
