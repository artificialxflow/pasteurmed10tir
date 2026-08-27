"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormTextarea } from "@/components/ui/Card";
import { DraftNumberInput } from "@/components/ui/DraftNumberInput";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import {
  PASTEUR_DATA,
  type LaserCategory,
  type LaserService,
} from "@/lib/data";
import { DEFAULT_LASER_RESERVATION_FEE } from "@/lib/operations/laser-slots";
import { FormEvent, useCallback, useEffect, useState } from "react";

function makeLaserId(title: string) {
  return `laser-${Date.now()}-${String(title || "").replace(/\s+/g, "-").slice(0, 16)}`;
}

function makeCategoryId(name: string) {
  return `laser-cat-${Date.now()}-${String(name || "").replace(/\s+/g, "-").slice(0, 16)}`;
}

function parsePriceFromLabel(raw?: string): number {
  if (!raw) return 0;
  const digits = String(raw)
    .replace(/[^\d۰-۹0-9]/g, "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

export default function AdminLaserServicesPage() {
  const [categories, setCategories] = useState<LaserCategory[]>([]);
  const [services, setServices] = useState<LaserService[]>([]);
  const [catName, setCatName] = useState("");
  const [catEmoji, setCatEmoji] = useState("✨");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [price, setPrice] = useState("");
  const [priceNum, setPriceNum] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [laserFee, setLaserFee] = useState(DEFAULT_LASER_RESERVATION_FEE);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const data = await fetchAdmin<{
      categories?: LaserCategory[];
      items: LaserService[];
    }>("/api/admin/content/laser");
    setCategories(data.categories || []);
    setServices(
      data.items.map((s) => ({
        ...s,
        priceNum: s.priceNum && s.priceNum > 0 ? s.priceNum : parsePriceFromLabel(s.price),
      })),
    );
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
    void fetchAdmin<{ laserReservationFee?: number }>("/api/admin/content/settings")
      .then((data) => {
        const fee = Number(data.laserReservationFee);
        if (Number.isFinite(fee) && fee > 0) setLaserFee(fee);
      })
      .catch(() => {});
  }, [reload]);

  async function persist(nextServices: LaserService[], nextCategories = categories) {
    const cleanedCats = nextCategories
      .map((c, i) => ({
        id: c.id || makeCategoryId(c.name),
        name: String(c.name || "").trim(),
        emoji: String(c.emoji || "✨").trim() || "✨",
        active: c.active !== false,
        sortOrder: i,
      }))
      .filter((c) => c.name);

    const catIds = new Set(cleanedCats.map((c) => c.id));

    const cleaned = nextServices
      .map((service) => {
        const label = String(service.price || "").trim();
        const num =
          service.priceNum && service.priceNum > 0
            ? Number(service.priceNum)
            : parsePriceFromLabel(label);
        const cid = service.categoryId ? String(service.categoryId) : "";
        return {
          ...service,
          id: service.id || makeLaserId(service.title),
          title: String(service.title || "").trim(),
          emoji: String(service.emoji || "✨").trim() || "✨",
          price: label || (num > 0 ? `${num.toLocaleString("fa-IR")} تومان` : ""),
          priceNum: num > 0 ? num : undefined,
          description: String(service.description || "").trim(),
          categoryId: cid && catIds.has(cid) ? cid : null,
          active: service.active !== false,
        };
      })
      .filter((service) => service.title && (service.price || service.priceNum));

    await putAdmin("/api/admin/content/laser", {
      categories: cleanedCats,
      items: cleaned,
    });
    await reload();
  }

  function saveAll() {
    void persist(services, categories).catch((e) =>
      setError(e instanceof Error ? e.message : "ذخیره ناموفق"),
    );
  }

  function deleteService(index: number) {
    void persist(
      services.filter((_, i) => i !== index),
      categories,
    ).catch((e) => setError(e instanceof Error ? e.message : "حذف ناموفق"));
  }

  function deleteCategory(index: number) {
    const removed = categories[index];
    const nextCats = categories.filter((_, i) => i !== index);
    const nextServices = services.map((s) =>
      s.categoryId === removed?.id ? { ...s, categoryId: null } : s,
    );
    void persist(nextServices, nextCats).catch((e) =>
      setError(e instanceof Error ? e.message : "حذف دسته ناموفق"),
    );
  }

  function addCategory(e: FormEvent) {
    e.preventDefault();
    const name = catName.trim();
    if (!name) return;
    const next = [
      ...categories,
      {
        id: makeCategoryId(name),
        name,
        emoji: catEmoji.trim() || "✨",
        active: true,
        sortOrder: categories.length,
      },
    ];
    void persist(services, next)
      .then(() => {
        setCatName("");
        setCatEmoji("✨");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "افزودن دسته ناموفق"));
  }

  function addService(e: FormEvent) {
    e.preventDefault();
    const num = priceNum > 0 ? priceNum : parsePriceFromLabel(price);
    void persist(
      [
        ...services,
        {
          id: makeLaserId(title),
          title: title.trim(),
          emoji: emoji.trim() || "✨",
          price: price.trim() || (num > 0 ? `${num.toLocaleString("fa-IR")} تومان` : ""),
          priceNum: num > 0 ? num : undefined,
          categoryId: categoryId || null,
          description: description.trim(),
          active: true,
        },
      ],
      categories,
    )
      .then(() => {
        setTitle("");
        setEmoji("✨");
        setPrice("");
        setPriceNum(0);
        setDescription("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "افزودن ناموفق"));
  }

  function resetDefaults() {
    void persist(
      PASTEUR_DATA.laserServices.map((s) => ({ ...s, active: true })),
      PASTEUR_DATA.laserCategories.map((c) => ({ ...c, active: true })),
    ).catch((e) => setError(e instanceof Error ? e.message : "بازنشانی ناموفق"));
  }

  function updateRow(index: number, patch: Partial<LaserService>) {
    setServices((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function updateCat(index: number, patch: Partial<LaserCategory>) {
    setCategories((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function saveLaserFee() {
    void putAdmin<{ laserReservationFee: number }>("/api/admin/content/settings", {
      laserReservationFee: Number(laserFee || 0),
    })
      .then((data) => setLaserFee(data.laserReservationFee))
      .catch((e) => setError(e instanceof Error ? e.message : "ذخیره بیعانه ناموفق"));
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-2 font-bold">بیعانه رزرو نوبت لیزر</h2>
        <p className="mb-3 text-xs text-slate-500">
          مثل دندانپزشکی؛ پیش‌فرض ۱۰۰٬۰۰۰ تومان. وقت‌دهی ۱۰ صبح تا ۷ عصر (اسلات یک‌ساعته).
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <DraftNumberInput
            min={0}
            max={10_000_000}
            value={laserFee}
            onCommit={setLaserFee}
            placeholder="بیعانه (تومان)"
          />
          <Button type="button" onClick={saveLaserFee}>
            ذخیره بیعانه
          </Button>
        </div>
      </Card>

      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-4 font-bold">افزودن دسته‌بندی</h2>
        <form onSubmit={addCategory} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <FormInput
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="نام دسته مثل پوست و زیبایی"
            required
          />
          <FormInput
            value={catEmoji}
            onChange={(e) => setCatEmoji(e.target.value)}
            placeholder="آیکن"
          />
          <Button type="submit">افزودن دسته</Button>
        </form>
      </Card>

      <AdminTable headers={["نام", "آیکن", "فعال", "عملیات"]} empty="دسته‌ای ثبت نشده.">
        {categories.map((cat, index) => (
          <tr key={cat.id} className="border-t border-slate-100">
            <td className="px-4 py-3">
              <FormInput
                className="text-xs"
                value={cat.name || ""}
                onChange={(e) => updateCat(index, { name: e.target.value })}
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                className="text-xs"
                value={cat.emoji || ""}
                onChange={(e) => updateCat(index, { emoji: e.target.value })}
              />
            </td>
            <td className="px-4 py-3 text-center">
              <input
                type="checkbox"
                checked={cat.active !== false}
                onChange={(e) => updateCat(index, { active: e.target.checked })}
              />
            </td>
            <td className="px-4 py-3">
              <button
                type="button"
                className="text-xs font-bold text-red-600"
                onClick={() => deleteCategory(index)}
              >
                حذف
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-4 font-bold">افزودن خدمت لیزر</h2>
        <p className="mb-3 text-xs text-slate-500">
          تعرفه عددی برای نمایش است؛ مبلغ پرداخت آنلاین همان بیعانه رزرو است.
        </p>
        <form onSubmit={addService} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان مثل لیزر شکم"
            required
          />
          <FormInput
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="آیکن مثل ✨"
          />
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">بدون دسته</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <FormInput
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="برچسب نمایش مثل از ۳۵۰,۰۰۰ تومان"
          />
          <DraftNumberInput
            min={0}
            max={100_000_000}
            value={priceNum}
            onCommit={setPriceNum}
            placeholder="تعرفه عددی (تومان)"
          />
          <FormTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیح کوتاه (اختیاری)"
            className="md:col-span-2 min-h-[86px]"
          />
          <Button type="submit" className="md:col-span-2">
            افزودن
          </Button>
        </form>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">لیست خدمات لیزر</h2>
        <button
          type="button"
          onClick={resetDefaults}
          className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white"
        >
          بازنشانی به پیش‌فرض
        </button>
      </div>

      <AdminTable
        headers={["عنوان", "دسته", "آیکن", "برچسب قیمت", "تعرفه عددی", "توضیح", "فعال", "عملیات"]}
        empty="خدمت لیزری ثبت نشده است."
      >
        {services.map((service, index) => (
          <tr key={service.id} className="border-t border-slate-100">
            <td className="px-4 py-3">
              <FormInput
                className="text-xs"
                value={service.title || ""}
                onChange={(e) => updateRow(index, { title: e.target.value })}
              />
            </td>
            <td className="px-4 py-3">
              <select
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                value={service.categoryId || ""}
                onChange={(e) =>
                  updateRow(index, { categoryId: e.target.value || null })
                }
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </td>
            <td className="px-4 py-3">
              <FormInput
                className="text-xs"
                value={service.emoji || ""}
                onChange={(e) => updateRow(index, { emoji: e.target.value })}
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                className="text-xs"
                value={service.price || ""}
                onChange={(e) => updateRow(index, { price: e.target.value })}
              />
            </td>
            <td className="px-4 py-3">
              <DraftNumberInput
                min={0}
                max={100_000_000}
                className="text-xs"
                value={Number(service.priceNum || 0)}
                onCommit={(next) => updateRow(index, { priceNum: next })}
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                className="text-xs"
                value={service.description || ""}
                onChange={(e) => updateRow(index, { description: e.target.value })}
              />
            </td>
            <td className="px-4 py-3 text-center">
              <input
                type="checkbox"
                checked={service.active !== false}
                onChange={(e) => updateRow(index, { active: e.target.checked })}
              />
            </td>
            <td className="px-4 py-3">
              <button
                type="button"
                className="text-xs font-bold text-red-600"
                onClick={() => deleteService(index)}
              >
                حذف
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      <Button type="button" onClick={saveAll}>
        ذخیره تغییرات
      </Button>
    </div>
  );
}
