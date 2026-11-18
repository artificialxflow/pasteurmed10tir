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
} from "@/lib/commerce/client";
import { confirmAction } from "@/lib/ui/confirm-action";
import { fetchAdminOps } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
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

type WarrantyRow = {
  id: string;
  serviceType: string;
  serviceLabel: string;
  typeLabel?: string;
  displayImageUrl?: string;
  imageUrl?: string;
  startedAt: string;
  expiresAt: string;
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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const previewArt = imageUrl.trim() || warrantyCardArtUrl(serviceType as ServiceWarrantyType);

  const defaultMonths = WARRANTY_DURATION_MONTHS[serviceType as ServiceWarrantyType];

  useEffect(() => {
    if (editingId) return;
    setExpiresAt(defaultExpiresIso(startedAt, serviceType));
    setImageUrl(warrantyCardArtUrl(serviceType as ServiceWarrantyType));
  }, [serviceType, startedAt, editingId]);

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
    setImageUrl(warrantyCardArtUrl("crown"));
  }

  function startEdit(row: WarrantyRow) {
    setEditingId(row.id);
    setServiceType(row.serviceType);
    setServiceLabel(row.serviceLabel);
    setStartedAt(row.startedAt.slice(0, 10));
    setExpiresAt(row.expiresAt.slice(0, 10));
    setImageUrl(row.displayImageUrl || row.imageUrl || warrantyCardArtUrl(row.serviceType as ServiceWarrantyType));
    setError("");
    setMessage("");
  }

  function applyDefaultDuration() {
    setExpiresAt(defaultExpiresIso(startedAt, serviceType));
  }

  function applyTemplateImage() {
    setImageUrl(warrantyCardArtUrl(serviceType as ServiceWarrantyType));
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
          ...payload,
        });

    void req
      .then((data) => {
        setMessage(
          editingId
            ? "کارت گارانتی به‌روز شد."
            : `کارت گارانتی ثبت شد${data.item?.id ? ` (${data.item.id})` : ""}.`,
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
      </p>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-teal-800">{message}</p> : null}

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
                <td className="px-3 py-2 text-xs">{formatWarrantyRemaining(row.expiresAt)}</td>
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
            yearRange="warrantyStart"
          />
          <div>
            <JalaliBirthDateField
              label="تاریخ پایان گارانتی"
              value={expiresAt}
              onChange={setExpiresAt}
              yearRange="nearTerm"
            />
            <button
              type="button"
              className="mt-2 text-xs font-bold text-teal-800 underline"
              onClick={applyDefaultDuration}
            >
              محاسبهٔ پایان از مدت پیش‌فرض ({defaultMonths.toLocaleString("fa-IR")} ماه پس از شروع)
            </button>
          </div>
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