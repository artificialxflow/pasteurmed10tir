"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormSelect, FormTextarea } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { PasteurStorage, type ServiceItem } from "@/lib/storage";
import { FormEvent, useEffect, useState } from "react";

const COLORS = ["teal", "blue", "rose", "purple", "amber"] as const;

function makeServiceId(title: string) {
  return `service-${Date.now()}-${String(title || "").replace(/\s+/g, "-").slice(0, 16)}`;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [href, setHref] = useState("");
  const [color, setColor] = useState("teal");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");

  function reload() {
    PasteurStorage.initServicesIfNeeded();
    setServices(PasteurStorage.getServices().map((s) => ({ ...s })));
  }

  useEffect(() => {
    reload();
  }, []);

  function updateRow(index: number, patch: Partial<ServiceItem>) {
    setServices((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function saveAll() {
    const cleaned = services
      .map((service) => ({
        ...service,
        title: String(service.title || "").trim(),
        emoji: String(service.emoji || "🧩").trim() || "🧩",
        description: String(service.description || "").trim(),
        href: String(service.href || "").trim(),
        image: String(service.image || "").trim(),
        color: String(service.color || "teal"),
        active: service.active !== false,
      }))
      .filter((service) => service.title && service.href);
    PasteurStorage.saveServices(cleaned);
    reload();
  }

  function deleteService(index: number) {
    const next = services.filter((_, i) => i !== index);
    PasteurStorage.saveServices(next);
    reload();
  }

  function addService(e: FormEvent) {
    e.preventDefault();
    const next = [
      ...PasteurStorage.getServices(),
      {
        id: makeServiceId(title),
        title: title.trim(),
        emoji: emoji.trim() || "🧩",
        href: href.trim(),
        color,
        image:
          image.trim() ||
          "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop",
        description: description.trim() || "مشاهده جزئیات و ثبت درخواست",
        active: true,
      },
    ];
    PasteurStorage.saveServices(next);
    setTitle("");
    setEmoji("");
    setHref("");
    setColor("teal");
    setImage("");
    setDescription("");
    reload();
  }

  function resetDefaults() {
    PasteurStorage.saveServices(
      PASTEUR_DATA.services.map((service) => ({
        ...service,
        active: true,
      })),
    );
    reload();
  }

  return (
    <div className="space-y-8">
      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-4 font-bold">افزودن سرویس جدید</h2>
        <form onSubmit={addService} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان مثل لیزر و زیبایی"
            required
          />
          <FormInput
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="آیکن مثل ✨"
          />
          <FormInput
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="لینک مثل /laser"
            required
          />
          <FormSelect value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="teal">سبز/فیروزه‌ای</option>
            <option value="blue">آبی</option>
            <option value="rose">صورتی</option>
            <option value="purple">بنفش</option>
            <option value="amber">طلایی</option>
          </FormSelect>
          <FormInput
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="آدرس تصویر کارت"
            className="md:col-span-2"
          />
          <FormTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیح کوتاه سرویس"
            className="md:col-span-2 min-h-[86px]"
          />
          <Button type="submit" className="md:col-span-2">
            افزودن سرویس
          </Button>
        </form>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">لیست سرویس‌های صفحه اصلی</h2>
        <button
          type="button"
          onClick={resetDefaults}
          className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white"
        >
          بازنشانی به پیش‌فرض
        </button>
      </div>

      <AdminTable
        headers={["عنوان", "آیکن", "توضیح", "لینک", "تصویر", "رنگ", "فعال", "عملیات"]}
        empty="سرویسی ثبت نشده است."
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
                value={service.description || ""}
                onChange={(e) => updateRow(index, { description: e.target.value })}
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                className="text-left text-xs"
                dir="ltr"
                value={service.href || ""}
                onChange={(e) => updateRow(index, { href: e.target.value })}
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                className="text-left text-xs"
                dir="ltr"
                value={service.image || ""}
                onChange={(e) => updateRow(index, { image: e.target.value })}
              />
            </td>
            <td className="px-4 py-3">
              <FormSelect
                className="text-xs"
                value={service.color || "teal"}
                onChange={(e) => updateRow(index, { color: e.target.value })}
              >
                {COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </FormSelect>
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
        ذخیره تغییرات سرویس‌ها
      </Button>
    </div>
  );
}
