"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Card";
import { labelAiKnowledgeSource, orgNameById, orgSelectLabel } from "@/lib/ai/admin-labels";
import { deleteAdminOps, fetchAdminOps, patchAdminOps, postAdminOps } from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import { confirmAction } from "@/lib/ui/confirm-action";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

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

type LoadedDoc = {
  title: string;
  body: string;
  published: boolean;
  source: string;
};

export default function AdminAiKnowledgePage() {
  const searchParams = useSearchParams();
  const orgFilter = searchParams.get("organizationId") || "";
  const expandAnchorRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<DocRow[]>([]);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [organizationId, setOrganizationId] = useState(orgFilter);
  const [voiceMaxSeconds, setVoiceMaxSeconds] = useState("180");
  const [threshold, setThreshold] = useState("0.42");
  const [expandedId, setExpandedId] = useState("");
  const [panelMode, setPanelMode] = useState<"preview" | "edit">("preview");
  const [loadedDocs, setLoadedDocs] = useState<Record<string, LoadedDoc>>({});
  const [loadExpandBusy, setLoadExpandBusy] = useState("");
  const [editingId, setEditingId] = useState("");
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

  function scrollToPanel() {
    window.setTimeout(() => {
      expandAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  }

  async function loadDoc(id: string): Promise<LoadedDoc> {
    if (loadedDocs[id]) return loadedDocs[id];
    const doc = await fetchAdminOps<LoadedDoc & { id: string }>(
      `/api/admin/operations/ai/documents/${id}`,
    );
    const loaded: LoadedDoc = {
      title: doc.title,
      body: doc.body || "",
      published: doc.published,
      source: doc.source,
    };
    setLoadedDocs((prev) => ({ ...prev, [id]: loaded }));
    return loaded;
  }

  function closePanel() {
    setExpandedId("");
    setPanelMode("preview");
    setEditingId("");
    setEditTitle("");
    setEditBody("");
    setEditPublished(true);
    setEditSource("");
  }

  async function openPreview(row: DocRow) {
    if (expandedId === row.id && panelMode === "preview") {
      closePanel();
      return;
    }
    setExpandedId(row.id);
    setPanelMode("preview");
    setEditingId("");
    setLoadExpandBusy(row.id);
    setError("");
    try {
      await loadDoc(row.id);
      scrollToPanel();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setLoadExpandBusy("");
    }
  }

  async function openEdit(row: DocRow) {
    setExpandedId(row.id);
    setPanelMode("edit");
    setEditingId(row.id);
    setBusy(true);
    setError("");
    try {
      const doc = await loadDoc(row.id);
      setEditTitle(doc.title);
      setEditBody(doc.body);
      setEditPublished(doc.published);
      setEditSource(doc.source);
      scrollToPanel();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
      setEditingId("");
      setPanelMode("preview");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editingId || !editTitle.trim() || !editBody.trim()) {
      setError("عنوان و متن الزامی است.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await patchAdminOps(`/api/admin/operations/ai/documents/${editingId}`, {
        title: editTitle,
        body: editBody,
        published: editPublished,
      });
      setSuccess("سند به‌روزرسانی و ایندکس شد.");
      setLoadedDocs((prev) => {
        const next = { ...prev };
        delete next[editingId];
        return next;
      });
      closePanel();
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
      if (expandedId === id) closePanel();
      setLoadedDocs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
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
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800">
          {success}
        </p>
      ) : null}

      <Card hover={false} className="space-y-3 border-cyan-100 p-4">
        <p className="font-bold text-slate-900">تنظیمات</p>
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

      <Card hover={false} className="space-y-3 border-cyan-100 p-4">
        <p className="font-bold text-slate-900">سند جدید</p>
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

      <div ref={expandAnchorRef}>
        <AdminTable headers={["عنوان", "منبع", "بخش‌ها", "عملیات"]} empty="سندی ثبت نشده.">
          {items.map((row) => {
            const isOpen = expandedId === row.id;
            const loaded = loadedDocs[row.id];
            const isEditing = isOpen && panelMode === "edit" && editingId === row.id;

            return (
              <Fragment key={row.id}>
                <tr
                  className={`border-t align-top transition-colors ${
                    isOpen ? "border-cyan-200 bg-cyan-50/40" : "border-slate-100"
                  }`}
                >
                  <td className="max-w-md px-4 py-3 text-sm">
                    <button
                      type="button"
                      className="text-right font-bold text-slate-900 hover:text-cyan-800"
                      onClick={() => void openPreview(row)}
                    >
                      {row.title}
                    </button>
                    {!isOpen && row.bodyPreview ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {row.bodyPreview}
                      </p>
                    ) : null}
                    {row.organizationId ? (
                      <div className="mt-1 text-xs text-slate-500">
                        سازمان: {orgNameById(orgs, row.organizationId)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <AdminBadge tone="neutral">{labelAiKnowledgeSource(row.source)}</AdminBadge>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700">
                    {row.chunkCount.toLocaleString("fa-IR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant={isEditing ? "primary" : "outline"}
                        className="px-2 py-1 text-[0.65rem]"
                        disabled={busy}
                        onClick={() => void openEdit(row)}
                      >
                        ویرایش
                      </Button>
                      <Button
                        type="button"
                        variant={isOpen && !isEditing ? "primary" : "outline"}
                        className="px-2 py-1 text-[0.65rem]"
                        onClick={() => void openPreview(row)}
                      >
                        {isOpen && !isEditing ? "بستن" : "پیش‌نمایش"}
                      </Button>
                      <button
                        type="button"
                        className="rounded-full border border-cyan-200 bg-white px-2 py-1 text-[0.65rem] font-bold text-cyan-800 hover:bg-cyan-50"
                        onClick={() => void reembed(row.id)}
                      >
                        ایندکس
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-red-200 bg-white px-2 py-1 text-[0.65rem] font-bold text-red-600 hover:bg-red-50"
                        onClick={() => void removeDoc(row.id)}
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
                {isOpen ? (
                  <tr className="border-t border-cyan-100 bg-gradient-to-bl from-cyan-50/60 to-white">
                    <td colSpan={4} className="px-4 py-4">
                      {loadExpandBusy === row.id ? (
                        <p className="text-sm text-slate-500">در حال بارگذاری…</p>
                      ) : isEditing ? (
                        <div className="space-y-3 rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <p className="text-sm font-extrabold text-cyan-900">ویرایش سند</p>
                            <span className="text-xs text-slate-500">
                              {labelAiKnowledgeSource(editSource)}
                            </span>
                          </div>
                          <div>
                            <FormLabel>عنوان</FormLabel>
                            <FormInput
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                            />
                          </div>
                          <div>
                            <FormLabel>متن / پاسخ (قابل ویرایش)</FormLabel>
                            <FormTextarea
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              rows={10}
                              className="font-normal leading-relaxed"
                            />
                          </div>
                          {editSource !== "site_map" ? (
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                              <input
                                type="checkbox"
                                checked={editPublished}
                                onChange={(e) => setEditPublished(e.target.checked)}
                              />
                              منتشر شده در جستجوی دستیار
                            </label>
                          ) : null}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button type="button" disabled={busy} onClick={() => void saveEdit()}>
                              ذخیره تغییرات
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setPanelMode("preview");
                                setEditingId("");
                              }}
                            >
                              انصراف
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-extrabold text-slate-800">پیش‌نمایش محتوا</p>
                            <Button
                              type="button"
                              variant="outline"
                              className="text-xs"
                              disabled={busy}
                              onClick={() => void openEdit(row)}
                            >
                              ویرایش این سند
                            </Button>
                          </div>
                          <p className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm leading-relaxed text-slate-800">
                            {loaded?.body || row.bodyPreview || "—"}
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </AdminTable>
      </div>
    </div>
  );
}
