"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormTextarea } from "@/components/ui/Card";
import { type LaserService } from "@/lib/data";
import { PasteurStorage } from "@/lib/storage";
import { FormEvent, useEffect, useState } from "react";

function makeLaserId(title: string) {
  return `laser-${Date.now()}-${String(title || "").replace(/\s+/g, "-").slice(0, 16)}`;
}

export default function AdminLaserServicesPage() {
  const [services, setServices] = useState<LaserService[]>([]);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  function reload() {
    PasteurStorage.initLaserServicesIfNeeded();
    setServices(PasteurStorage.getLaserServices().map((s) => ({ ...s })));
  }

  useEffect(() => {
    reload();
  }, []);

  function updateRow(index: number, patch: Partial<LaserService>) {
    setServices((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function saveAll() {
    const cleaned = services
      .map((service) => ({
        ...service,
        id: service.id || makeLaserId(service.title),
        title: String(service.title || "").trim(),
        emoji: String(service.emoji || "✨").trim() || "✨",
        price: String(service.price || "").trim(),
        description: String(service.description || "").trim(),
        active: service.active !== false,
      }))
      .filter((service) => service.title && service.price);
    PasteurStorage.saveLaserServices(cleaned);
    reload();
  }

  function deleteService(index: number) {
    const next = services.filter((_, i) => i !== index);
    PasteurStorage.saveLaserServices(next);
    reload();
  }

  function addService(e: FormEvent) {
    e.preventDefault();
    const next = [
      ...PasteurStorage.getLaserServices(),
      {
        id: makeLaserId(title),
        title: title.trim(),
        emoji: emoji.trim() || "✨",
        price: price.trim(),
        description: description.trim(),
        active: true,
      },
    ];
    PasteurStorage.saveLaserServices(next);
    setTitle("");
    setEmoji("✨");
    setPrice("");
    setDescription("");
    reload();
  }

  function resetDefaults() {
    PasteurStorage.resetLaserServices();
    reload();
  }

  return (
    <div className="space-y-8">
      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-4 font-bold">افزودن خدمت لیزر</h2>
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
          <FormInput
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="قیمت مثل از ۳۵۰,۰۰۰ تومان"
            required
            className="md:col-span-2"
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
        headers={["عنوان", "آیکن", "قیمت", "توضیح", "فعال", "عملیات"]}
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
