"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Card";
import { labelAiKnowledgeSource, orgNameById, orgSelectLabel } from "@/lib/ai/admin-labels";
import { deleteAdminOps, fetchAdminOps, patchAdminOps, postAdminOps } from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import { confirmAction } from "@/lib/ui/confirm-action";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";

type DocRow = {
  id: string;
  title: string;
  source: string;
  organizationId: string | null;
  published: boolean;
  chunkCount: number;
  bodyPreview: string;
  updatedAt: string;
};

type OrgRow = { id: string; name: string; representativePhone?: string | null };

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
  const [expandedId, setExpandedId] = useState("");
  const [editing, setEditing] = useState<DocRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editPublished, setEditPublished] = useState(true);
  const [editSource, setEditSource] = useState("");
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

  function closeEdit() {
    setEditing(null);
    setEditTitle("");
    setEditBody("");
    setEditPublished(true);
    setEditSource("");
  }

  async function openEdit(row: DocRow) {
    setBusy(true);
    setError("");
    try {
      const doc = await fetchAdminOps<{
        title: string;
        body: string | null;
        published: boolean;
        source: string;
      }>(`/api/admin/operations/ai/documents/${row.id}`);
      setEditing(row);
      setEditTitle(doc.title);
      setEditBody(doc.body || "");
      setEditPublished(doc.published);
      setEditSource(doc.source);
      setExpandedId(row.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editing || !editTitle.trim() || !editBody.trim()) {
      setError("عنوان و متن الزامی است.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await patchAdminOps(`/api/admin/operations/ai/documents/${editing.id}`, {
        title: editTitle,
        body: editBody,
        published: editPublished,
      });
      setSuccess("سند به‌روزرسانی و ایندکس شد.");
      closeEdit();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

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
      setSuccess("سند ذخیره و برای جستجو ایندکس شد.");
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
      setSuccess("ایندکس جستجو بازسازی شد.");
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
      if (editing?.id === id) closeEdit();
      if (expandedId === id) setExpandedId("");
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
        <p className="text-sm text-slate-600">مدیریت پایگاه دانش دستیار هوشمند</p>
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
            <FormLabel>آستانه شباهت (عدد کمتر = پاسخ دقیق‌تر)</FormLabel>
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
            <option value="">— سراسری (کل سایت) —</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {orgSelectLabel(o)}
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
            ذخیره و ایندکس
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void ingestSiteMap()}>
            بارگذاری نقشه سایت
          </Button>
        </div>
      </Card>

      <AdminTable headers={["عنوان", "منبع", "بخش‌ها", "عملیات"]} empty="سندی ثبت نشده.">
        {items.map((row) => (
          <Fragment key={row.id}>
            <tr className="border-t border-slate-100 align-top">
              <td className="max-w-md px-4 py-3 text-sm">
                <button
                  type="button"
                  className="text-right font-bold hover:text-cyan-900"
                  onClick={() => setExpandedId(expandedId === row.id ? "" : row.id)}
                >
                  {row.title}
                </button>
                {row.bodyPreview && expandedId !== row.id ? (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.bodyPreview}</p>
                ) : null}
                {row.organizationId ? (
                  <div className="text-xs text-slate-500">
                    سازمان: {orgNameById(orgs, row.organizationId)}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3 text-xs">{labelAiKnowledgeSource(row.source)}</td>
              <td className="px-4 py-3 text-xs">{row.chunkCount.toLocaleString("fa-IR")}</td>
              <td className="space-y-1 px-4 py-3">
                <button
                  type="button"
                  className="block text-xs font-bold text-cyan-800"
                  onClick={() => void openEdit(row)}
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  className="block text-xs font-bold text-slate-600"
                  onClick={() => setExpandedId(expandedId === row.id ? "" : row.id)}
                >
                  {expandedId === row.id ? "بستن" : "پیش‌نمایش"}
                </button>
                <button
                  type="button"
                  className="block text-xs font-bold text-cyan-800"
                  onClick={() => void reembed(row.id)}
                >
                  بازسازی ایندکس
                </button>
                <button
                  type="button"
                  className="block text-xs font-bold text-red-600"
                  onClick={() => void removeDoc(row.id)}
                >
                  حذف
                </button>
              </td>
            </tr>
            {expandedId === row.id ? (
              <tr className="border-t border-slate-50 bg-slate-50/50">
                <td colSpan={4} className="px-4 py-3">
                  <p className="mb-1 text-xs font-bold text-slate-600">پیش‌نمایش پاسخ</p>
                  <p className="whitespace-pre-wrap break-words rounded-xl bg-white p-3 text-sm text-slate-800">
                    {row.bodyPreview || "—"}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 text-xs"
                    disabled={busy}
                    onClick={() => void openEdit(row)}
                  >
                    ویرایش این سند
                  </Button>
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </AdminTable>

      {editing ? (
        <Card hover={false} className="space-y-3 p-4">
          <p className="text-sm font-bold">ویرایش سند دانش</p>
          <p className="text-xs text-slate-500">منبع: {labelAiKnowledgeSource(editSource)}</p>
          <div>
            <FormLabel>عنوان</FormLabel>
            <FormInput value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>
          <div>
            <FormLabel>متن / پاسخ</FormLabel>
            <FormTextarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={8} />
          </div>
          {editSource !== "site_map" ? (
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={editPublished}
                onChange={(e) => setEditPublished(e.target.checked)}
              />
              منتشر شده (در جستجوی دستیار)
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => void saveEdit()}>
              ذخیره تغییرات
            </Button>
            <Button type="button" variant="outline" onClick={closeEdit}>
              انصراف
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
