"use client";

import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import { postAdminCommerce } from "@/lib/commerce/client";
import { fetchAdminOps } from "@/lib/operations/client";
import { WARRANTY_TYPE_OPTIONS } from "@/lib/warranty/constants";
import { FormEvent, useCallback, useState } from "react";

type PatientRow = { phone?: string; name?: string; userId?: string };

export default function AdminWarrantyCardsPage() {
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [selected, setSelected] = useState<PatientRow | null>(null);
  const [serviceType, setServiceType] = useState(WARRANTY_TYPE_OPTIONS[0]?.id || "crown");
  const [serviceLabel, setServiceLabel] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!selected?.phone || !imageUrl.trim()) {
      setError("بیمار و تصویر کارت گارانتی الزامی است.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    void postAdminCommerce<{ item?: { id: string } }>("/api/admin/commerce/warranty-cards", {
      patientPhone: selected.phone,
      serviceType,
      serviceLabel: serviceLabel.trim(),
      imageUrl: imageUrl.trim(),
      startedAt,
    })
      .then((data) => {
        setMessage(`کارت گارانتی ثبت شد${data.item?.id ? ` (${data.item.id})` : ""}.`);
        setImageUrl("");
        setServiceLabel("");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-extrabold text-slate-900">ثبت کارت گارانتی خدمات</h1>
      <p className="text-sm text-slate-600">
        بیمار را انتخاب کنید، نوع خدمت و تصویر کارت را بارگذاری کنید. مدت انقضا از نوع خدمت محاسبه می‌شود.
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
                  onClick={() => setSelected(p)}
                >
                  {p.name || "—"} · {p.phone}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card hover={false} className="p-4">
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
          <div>
            <FormLabel>برچسب نمایشی (اختیاری)</FormLabel>
            <FormInput
              value={serviceLabel}
              onChange={(e) => setServiceLabel(e.target.value)}
              placeholder="مثلاً روکش دندان ۱۲"
            />
          </div>
          <JalaliBirthDateField label="تاریخ شروع گارانتی" value={startedAt} onChange={setStartedAt} />
          <div>
            <FormLabel>تصویر کارت گارانتی</FormLabel>
            <ImageUploadField value={imageUrl} onChange={setImageUrl} diskOnly />
          </div>
          <Button type="submit" disabled={busy || !selected?.phone}>
            {busy ? "در حال ثبت…" : "ثبت کارت گارانتی"}
          </Button>
        </form>
      </Card>
    </div>
  );
}