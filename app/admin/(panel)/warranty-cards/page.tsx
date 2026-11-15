"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import {
  fetchAdminCommerce,
  patchAdminCommerce,
  postAdminCommerce,
} from "@/lib/commerce/client";
import { fetchAdminOps } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { warrantyCardArtUrl } from "@/lib/warranty/art";
import { WARRANTY_TYPE_OPTIONS } from "@/lib/warranty/constants";
import { formatWarrantyRemaining } from "@/lib/warranty/time-remaining";
import type { ServiceWarrantyType } from "@prisma/client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type PatientRow = { phone?: string; name?: string; userId?: string };

type WarrantyRow = {
  id: string;
  serviceType: string;
  serviceLabel: string;
  typeLabel?: string;
  displayImageUrl?: string;
  startedAt: string;
  expiresAt: string;
};

export default function AdminWarrantyCardsPage() {
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [selected, setSelected] = useState<PatientRow | null>(null);
  const [cards, setCards] = useState<WarrantyRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState("crown");
  const [serviceLabel, setServiceLabel] = useState("");
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const previewArt = useMemo(
    () => warrantyCardArtUrl(serviceType as ServiceWarrantyType),
    [serviceType],
  );

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
    setEditingId(null);
    setServiceType("crown");
    setServiceLabel("");
    setStartedAt(new Date().toISOString().slice(0, 10));
  }

  function startEdit(row: WarrantyRow) {
    setEditingId(row.id);
    setServiceType(row.serviceType);
    setServiceLabel(row.serviceLabel);
    setStartedAt(row.startedAt.slice(0, 10));
    setError("");
    setMessage("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!selected?.phone) {
      setError("ابتدا بیمار را انتخاب کنید.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");

    const payload = {
      serviceType,
      serviceLabel: serviceLabel.trim(),
      startedAt,
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
        فقط بیمار، نوع خدمت و تاریخ را ثبت کنید. ظاهر کارت در پنل بیمار به‌صورت خودکار از قالب
        همان نوع خدمت نمایش داده می‌شود (بدون آپلود عکس).
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
                  <button
                    type="button"
                    className="text-xs font-bold text-teal-800 underline"
                    onClick={() => startEdit(row)}
                  >
                    ویرایش
                  </button>
                </td>
              </tr>
            ))}
          </AdminTable>
        </Card>
      ) : null}

      <Card hover={false} className="p-4">
        <p className="mb-3 font-bold text-slate-900">
          {editingId ? "ویرایش کارت گارانتی" : "ثبت کارت جدید"}
        </p>
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
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewArt}
              alt=""
              className="h-16 w-16 rounded-lg border object-cover"
              width={64}
              height={64}
            />
            <p className="text-xs leading-6 text-slate-600">
              پیش‌نمایش آیکن کارت در پنل بیمار (حدود ۵۶×۵۶ پیکسل)
            </p>
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
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || !selected?.phone}>
              {busy ? "در حال ذخیره…" : editingId ? "ذخیره ویرایش" : "ثبت کارت گارانتی"}
            </Button>
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