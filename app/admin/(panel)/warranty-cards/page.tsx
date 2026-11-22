"use client";

import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import { WarrantyCardArtImage } from "@/components/warranty/WarrantyCardArtImage";
import {
  deleteAdminCommerce,
  fetchAdminCommerce,
  patchAdminCommerce,
  postAdminCommerce,
  putAdminCommerce,
} from "@/lib/commerce/client";
import { confirmAction } from "@/lib/ui/confirm-action";
import { fetchAdminOps } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { WARRANTY_CARD_ART } from "@/lib/warranty/card-art-defaults";
import { warrantyCardArtUrl } from "@/lib/warranty/art";
import {
  WARRANTY_DURATION_MONTHS,
  WARRANTY_TYPE_OPTIONS,
  warrantyExpiresAt,
} from "@/lib/warranty/constants";
import { formatWarrantyRemaining } from "@/lib/warranty/time-remaining";
import type { ServiceWarrantyType } from "@prisma/client";
import { FormEvent, useCallback, useEffect, useState } from "react";

type PatientRow = { phone?: string; name?: string; userId?: string };

type WarrantyTemplateItem = {
  id: string;
  label: string;
  imageUrl: string;
  overrideUrl?: string;
};

type WarrantyRow = {
  id: string;
  serviceType: string;
  serviceLabel: string;
  typeLabel?: string;
  displayImageUrl?: string;
  imageUrl?: string;
  startedAt: string;
  expiresAt: string;
  status?: string;
  needsActivation?: boolean;
};

function defaultExpiresIso(startedAt: string, serviceType: string): string {
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return startedAt;
  return warrantyExpiresAt(start, serviceType as ServiceWarrantyType).toISOString().slice(0, 10);
}

export default function AdminWarrantyCardsPage() {
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [selected, setSelected] = useState<PatientRow | null>(null);
  const [cards, setCards] = useState<WarrantyRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState("crown");
  const [serviceLabel, setServiceLabel] = useState("");
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [expiresAt, setExpiresAt] = useState(() =>
    defaultExpiresIso(new Date().toISOString().slice(0, 10), "crown"),
  );
  const [imageUrl, setImageUrl] = useState(() => warrantyCardArtUrl("crown"));
  const [requirePatientActivation, setRequirePatientActivation] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [templateItems, setTemplateItems] = useState<WarrantyTemplateItem[]>([]);
  const [templateDraft, setTemplateDraft] = useState<Record<string, string>>({});
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMessage, setTemplateMessage] = useState("");

  const templateUrl = useCallback(
    (type: ServiceWarrantyType) =>
      templateDraft[type]?.trim() ||
      templateItems.find((t) => t.id === type)?.imageUrl ||
      warrantyCardArtUrl(type),
    [templateDraft, templateItems],
  );

  const previewArt = imageUrl.trim() || templateUrl(serviceType as ServiceWarrantyType);

  const defaultMonths = WARRANTY_DURATION_MONTHS[serviceType as ServiceWarrantyType];

  const reloadTemplates = useCallback(() => {
    return fetchAdminCommerce<{
      items?: WarrantyTemplateItem[];
      resolved?: Record<string, string>;
    }>("/api/admin/commerce/warranty-card-art")
      .then((data) => {
        const items = data.items || [];
        setTemplateItems(items);
        const draft: Record<string, string> = {};
        for (const item of items) {
          draft[item.id] = item.imageUrl;
        }
        setTemplateDraft(draft);
      })
      .catch(() => setTemplateItems([]));
  }, []);

  useEffect(() => {
    void reloadTemplates();
  }, [reloadTemplates]);

  useEffect(() => {
    if (editingId) return;
    setExpiresAt(defaultExpiresIso(startedAt, serviceType));
    setImageUrl(templateUrl(serviceType as ServiceWarrantyType));
  }, [serviceType, startedAt, editingId, templateUrl]);

  const loadCards = useCallback((phone?: string) => {
    const p = phone || selected?.phone;
    if (!p) {
      setCards([]);
      return;
    }
    void fetchAdminCommerce<{ items: WarrantyRow[] }>(
      `/api/admin/commerce/warranty-cards?phone=${encodeURIComponent(p)}`,
    )
      .then((data) => setCards(data.items || []))
      .catch(() => setCards([]));
  }, [selected?.phone]);

  useEffect(() => {
    if (selected?.phone) loadCards(selected.phone);
  }, [selected?.phone, loadCards]);

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

  function resetForm() {
    const start = new Date().toISOString().slice(0, 10);
    setEditingId(null);
    setServiceType("crown");
    setServiceLabel("");
    setStartedAt(start);
    setExpiresAt(defaultExpiresIso(start, "crown"));
    setImageUrl(templateUrl("crown"));
    setRequirePatientActivation(true);
  }

  function startEdit(row: WarrantyRow) {
    setEditingId(row.id);
    setServiceType(row.serviceType);
    setServiceLabel(row.serviceLabel);
    setStartedAt(row.startedAt.slice(0, 10));
    setExpiresAt(row.expiresAt.slice(0, 10));
    setImageUrl(
      row.displayImageUrl ||
        row.imageUrl ||
        templateUrl(row.serviceType as ServiceWarrantyType),
    );
    setError("");
    setMessage("");
  }

  function applyDefaultDuration() {
    setExpiresAt(defaultExpiresIso(startedAt, serviceType));
  }

  function applyTemplateImage() {
    setImageUrl(templateUrl(serviceType as ServiceWarrantyType));
  }

  function saveTemplateArt() {
    setTemplateSaving(true);
    setTemplateMessage("");
    const warrantyCardArt: Record<string, string> = {};
    for (const opt of WARRANTY_TYPE_OPTIONS) {
      const type = opt.id as ServiceWarrantyType;
      const url = templateDraft[type]?.trim() || "";
      const factory = WARRANTY_CARD_ART[type];
      warrantyCardArt[type] = !url || url === factory ? "" : url;
    }
    void putAdminCommerce<{ message?: string }>("/api/admin/commerce/warranty-card-art", {
      warrantyCardArt,
    })
      .then((data) => {
        setTemplateMessage(data.message || "قالب‌های تصویر ذخیره شد.");
        return reloadTemplates();
      })
      .then(() => {
        if (!editingId) {
          setImageUrl(templateUrl(serviceType as ServiceWarrantyType));
        }
      })
      .catch((err: Error) => setTemplateMessage(err.message))
      .finally(() => setTemplateSaving(false));
  }

  function removeCard(row: WarrantyRow) {
    if (!confirmAction(`کارت «${row.serviceLabel}» حذف شود؟ این کار قابل بازگشت نیست.`)) {
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    void deleteAdminCommerce(`/api/admin/commerce/warranty-cards/${encodeURIComponent(row.id)}`)
      .then((data) => {
        setMessage(data.message || "کارت گارانتی حذف شد.");
        if (editingId === row.id) resetForm();
        loadCards(selected?.phone);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!selected?.phone) {
      setError("ابتدا بیمار را انتخاب کنید.");
      return;
    }
    if (!startedAt) {
      setError("تاریخ شروع گارانتی را کامل انتخاب کنید.");
      return;
    }
    if (!expiresAt) {
      setError("تاریخ پایان گارانتی را کامل انتخاب کنید.");
      return;
    }
    if (new Date(expiresAt).getTime() < new Date(startedAt).getTime()) {
      setError("تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");

    const payload = {
      serviceType,
      serviceLabel: serviceLabel.trim(),
      startedAt,
      expiresAt,
      imageUrl: imageUrl.trim(),
    };

    const req = editingId
      ? patchAdminCommerce<{ item?: WarrantyRow }>(
          `/api/admin/commerce/warranty-cards/${encodeURIComponent(editingId)}`,
          payload,
        )
      : postAdminCommerce<{ item?: { id: string } }>("/api/admin/commerce/warranty-cards", {
          patientPhone: selected.phone,
          requirePatientActivation,
          ...payload,
        });

    void req
      .then((data) => {
        setMessage(
          editingId
            ? "کارت گارانتی به‌روز شد."
            : requirePatientActivation
              ? `کارت ثبت شد؛ به بیمار بگویید در پنل پاستور پلاس «فعال‌سازی کارت گارانتی» را بزند.`
              : `کارت گارانتی ثبت و فعال شد${data.item?.id ? ` (${data.item.id})` : ""}.`,
        );
        resetForm();
        loadCards(selected.phone);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-xl font-extrabold text-slate-900">ثبت و ویرایش کارت گارانتی</h1>
      <p className="text-sm text-slate-600">
        بیمار، نوع خدمت، تاریخ شروع و پایان، و تصویر کارت را می‌توانید ویرایش یا حذف کنید. برای
        هم‌خوانی زمان با متن روی کارت، تاریخ پایان را مطابق عکس تنظیم کنید یا از «مدت پیش‌فرض
        نوع خدمت» ({defaultMonths.toLocaleString("fa-IR")} ماه برای نوع انتخاب‌شده) استفاده کنید.
        پیش‌فرض: بیمار از پنل کاربری کارت را خودش فعال می‌کند؛ مدت گارانتی از زمان فعال‌سازی
        شروع می‌شود.
      </p>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-teal-800">{message}</p> : null}

      <Card hover={false} className="space-y-4 p-4">
        <div className="space-y-1">
          <h2 className="font-bold text-slate-900">قالب‌های تصویر کارت گارانتی</h2>
          <p className="text-xs text-slate-500">
            پیش‌فرض هر نوع خدمت برای کارت‌های جدید و دکمهٔ «بازگشت به قالب». روکش و ترمیم ریشه
            با طرح کارفرما (updates/35/14) در فایل‌های کارخانه به‌روز شده‌اند؛ از اینجا می‌توانید
            آپلود، حذف (بازگشت به کارخانه) و به‌روزرسانی کنید.
          </p>
        </div>
        {templateMessage ? (
          <p className="text-sm font-bold text-teal-800">{templateMessage}</p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {WARRANTY_TYPE_OPTIONS.map((opt) => {
            const type = opt.id as ServiceWarrantyType;
            const src = templateDraft[type] || templateUrl(type);
            return (
              <div key={opt.id} className="space-y-2 rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                <div className="flex justify-center">
                  <WarrantyCardArtImage src={src} alt={opt.label} compact />
                </div>
                <ImageUploadField
                  value={src}
                  onChange={(path) =>
                    setTemplateDraft((prev) => ({ ...prev, [type]: path }))
                  }
                  placeholder="تصویر قالب"
                />
                <button
                  type="button"
                  className="text-xs font-bold text-teal-800 underline"
                  onClick={() =>
                    setTemplateDraft((prev) => ({
                      ...prev,
                      [type]: WARRANTY_CARD_ART[type],
                    }))
                  }
                >
                  بازگشت به پیش‌فرض کارخانه
                </button>
              </div>
            );
          })}
        </div>
        <Button type="button" disabled={templateSaving} onClick={saveTemplateArt}>
          {templateSaving ? "در حال ذخیره قالب‌ها…" : "ذخیره قالب‌های تصویر"}
        </Button>
      </Card>

      <Card hover={false} className="space-y-3 p-4">
        <FormLabel>جستجوی بیمار (نام یا موبایل)</FormLabel>
        <div className="flex flex-wrap gap-2">
          <FormInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-w-[200px] flex-1"
            placeholder="۰۹۱۲…"
          />
          <Button type="button" className="text-sm" onClick={search}>
            جستجو
          </Button>
        </div>
        {patients.length > 0 ? (
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
            {patients.map((p) => (
              <li key={p.userId || p.phone}>
                <button
                  type="button"
                  className={`w-full rounded-lg px-3 py-2 text-right ${
                    selected?.phone === p.phone
                      ? "bg-teal-100 font-bold text-teal-900"
                      : "bg-slate-50 hover:bg-white"
                  }`}
                  onClick={() => {
                    setSelected(p);
                    resetForm();
                  }}
                >
                  {p.name || "—"} · {p.phone}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {!selected?.phone ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
            پس از جستجو، حتماً روی نام بیمار در لیست بزنید تا انتخاب شود؛ بدون انتخاب، دکمهٔ
            ثبت کارت فعال نمی‌شود.
          </p>
        ) : (
          <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900">
            بیمار انتخاب‌شده: <span className="font-bold">{selected.name || "—"}</span> ·{" "}
            {selected.phone}
          </p>
        )}
      </Card>

      {selected?.phone ? (
        <Card hover={false} className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-slate-900">
              کارت‌های {selected.name || selected.phone}
            </p>
            <Button type="button" className="text-xs" onClick={resetForm}>
              ثبت کارت جدید
            </Button>
          </div>
          <AdminTable
            headers={["خدمت", "پایان", "وضعیت", "عملیات"]}
            empty="هنوز کارت گارانتی ثبت نشده."
          >
            {cards.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 text-sm">
                <td className="px-3 py-2">
                  <p className="font-bold">{row.serviceLabel}</p>
                  <p className="text-xs text-slate-500">{row.typeLabel || row.serviceType}</p>
                </td>
                <td className="px-3 py-2 text-xs">{formatJalaliDate(row.expiresAt)}</td>
                <td className="px-3 py-2 text-xs">
                  {row.needsActivation || row.status === "pending" ? (
                    <span className="font-bold text-amber-800">منتظر فعال‌سازی بیمار</span>
                  ) : (
                    formatWarrantyRemaining(row.expiresAt)
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="text-xs font-bold text-teal-800 underline"
                      onClick={() => startEdit(row)}
                      disabled={busy}
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      className="text-xs font-bold text-rose-700 underline"
                      onClick={() => removeCard(row)}
                      disabled={busy}
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        </Card>
      ) : null}

      <Card
        hover={false}
        className={`p-4 ${!selected?.phone ? "border-dashed border-slate-200 opacity-90" : ""}`}
      >
        <p className="mb-3 font-bold text-slate-900">
          {editingId ? "ویرایش کارت گارانتی" : "ثبت کارت جدید"}
        </p>
        {!selected?.phone ? (
          <p className="mb-3 text-sm text-slate-500">ابتدا بیمار را از لیست بالا انتخاب کنید.</p>
        ) : null}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <FormLabel>نوع خدمت</FormLabel>
            <FormSelect
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="mt-1 w-full"
            >
              {WARRANTY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="mb-3 text-center text-xs font-bold text-slate-600">
              پیش‌نمایش ظاهر کارت در پنل بیمار
            </p>
            <div className="flex justify-center">
              <WarrantyCardArtImage src={previewArt} alt="پیش‌نمایش کارت گارانتی" />
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              تصویر قابل آپلود است یا با دکمهٔ زیر به قالب نوع خدمت برمی‌گردد.
            </p>
          </div>
          <div>
            <FormLabel>تصویر کارت گارانتی</FormLabel>
            <ImageUploadField
              value={imageUrl}
              onChange={setImageUrl}
              className="mt-1"
              placeholder="/warranty-art/... یا /uploads/..."
            />
            <button
              type="button"
              className="mt-2 text-xs font-bold text-teal-800 underline"
              onClick={applyTemplateImage}
            >
              بازگشت به تصویر قالب این نوع خدمت
            </button>
          </div>
          <div>
            <FormLabel>برچسب نمایشی (اختیاری)</FormLabel>
            <FormInput
              value={serviceLabel}
              onChange={(e) => setServiceLabel(e.target.value)}
              placeholder="مثلاً دندان ۴ چپ بالا"
            />
          </div>
          <JalaliBirthDateField
            label="تاریخ شروع گارانتی"
            value={startedAt}
            onChange={setStartedAt}
            yearRange="nearTerm"
          />
          <div>
            <JalaliBirthDateField
              label="تاریخ پایان گارانتی"
              value={expiresAt}
              onChange={setExpiresAt}
              yearRange="warrantyStart"
            />
            <button
              type="button"
              className="mt-2 text-xs font-bold text-teal-800 underline"
              onClick={applyDefaultDuration}
            >
              محاسبهٔ پایان از مدت پیش‌فرض ({defaultMonths.toLocaleString("fa-IR")} ماه پس از شروع)
            </button>
          </div>
          {!editingId ? (
            <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={requirePatientActivation}
                onChange={(e) => setRequirePatientActivation(e.target.checked)}
              />
              <span>
                <strong>بیمار در پنل پاستور پلاس فعال کند</strong>
                <span className="mt-1 block text-xs font-normal text-slate-600">
                  تاریخ‌های بالا مدت برنامه‌ریزی‌شده‌اند؛ پس از فعال‌سازی، همان مدت از همان لحظه
                  محاسبه می‌شود.
                </span>
              </span>
            </label>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={busy || !selected?.phone || !startedAt || !expiresAt}>
              {busy ? "در حال ذخیره…" : editingId ? "ذخیره ویرایش" : "ثبت کارت گارانتی"}
            </Button>
            {!selected?.phone ? (
              <span className="text-xs text-amber-800">انتخاب بیمار الزامی است</span>
            ) : !startedAt ? (
              <span className="text-xs text-amber-800">تاریخ شروع را کامل انتخاب کنید</span>
            ) : null}
            {editingId ? (
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600"
                onClick={resetForm}
              >
                انصراف
              </button>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  );
}