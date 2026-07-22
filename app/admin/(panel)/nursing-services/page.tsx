"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormTextarea } from "@/components/ui/Card";
import { type NursingItem, type NursingService } from "@/lib/data";
import { PasteurStorage } from "@/lib/storage";
import { FormEvent, useEffect, useState } from "react";

function makeNursingId(title: string) {
  return `nursing-${Date.now()}-${String(title || "").replace(/\s+/g, "-").slice(0, 16)}`;
}

function makeItemId(title: string) {
  return `item-${Date.now()}-${String(title || "").replace(/\s+/g, "-").slice(0, 12)}`;
}

export default function AdminNursingServicesPage() {
  const [services, setServices] = useState<NursingService[]>([]);
  const [expandedId, setExpandedId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("👩‍⚕️");
  const [price, setPrice] = useState("تماس برای هماهنگی");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  function reload() {
    PasteurStorage.initNursingServicesIfNeeded();
    const next = PasteurStorage.getNursingServices().map((s) => ({
      ...s,
      items: (s.items || []).map((item) => ({ ...item })),
    }));
    setServices(next);
    if (!expandedId && next.length) setExpandedId(next[0].id);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateCategory(index: number, patch: Partial<NursingService>) {
    setServices((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function updateItem(categoryIndex: number, itemIndex: number, patch: Partial<NursingItem>) {
    setServices((prev) =>
      prev.map((category, ci) => {
        if (ci !== categoryIndex) return category;
        const items = [...(category.items || [])];
        items[itemIndex] = { ...items[itemIndex], ...patch };
        return { ...category, items };
      }),
    );
  }

  function addItem(categoryIndex: number) {
    setServices((prev) =>
      prev.map((category, ci) => {
        if (ci !== categoryIndex) return category;
        const items = [...(category.items || [])];
        items.push({
          id: makeItemId("new"),
          title: "خدمت جدید",
          priceNum: 0,
          price: "",
          unit: "",
          active: true,
        });
        return { ...category, items };
      }),
    );
  }

  function deleteItem(categoryIndex: number, itemIndex: number) {
    setServices((prev) =>
      prev.map((category, ci) => {
        if (ci !== categoryIndex) return category;
        return {
          ...category,
          items: (category.items || []).filter((_, ii) => ii !== itemIndex),
        };
      }),
    );
  }

  function deleteCategory(index: number) {
    const next = services.filter((_, i) => i !== index);
    setServices(next);
    PasteurStorage.saveNursingServices(next);
    reload();
  }

  function saveAll() {
    const cleaned = services
      .map((service) => ({
        ...service,
        id: service.id || makeNursingId(service.title),
        title: String(service.title || "").trim(),
        emoji: String(service.emoji || "👩‍⚕️").trim() || "👩‍⚕️",
        price: String(service.price || "تماس برای هماهنگی").trim(),
        description: String(service.description || "").trim(),
        image: String(service.image || "").trim() || undefined,
        active: service.active !== false,
        items: (service.items || [])
          .map((item) => ({
            ...item,
            id: item.id || makeItemId(item.title),
            title: String(item.title || "").trim(),
            priceNum: Number(item.priceNum || 0),
            price: String(item.price || "").trim() || undefined,
            unit: String(item.unit || "").trim() || undefined,
            active: item.active !== false,
          }))
          .filter((item) => item.title),
      }))
      .filter((service) => service.title);
    PasteurStorage.saveNursingServices(cleaned);
    reload();
  }

  function addCategory(e: FormEvent) {
    e.preventDefault();
    const next = [
      ...PasteurStorage.getNursingServices(),
      {
        id: makeNursingId(title),
        title: title.trim(),
        emoji: emoji.trim() || "👩‍⚕️",
        price: price.trim() || "تماس برای هماهنگی",
        description: description.trim(),
        image: image.trim() || undefined,
        active: true,
        items: [],
      },
    ];
    PasteurStorage.saveNursingServices(next);
    setTitle("");
    setEmoji("👩‍⚕️");
    setPrice("تماس برای هماهنگی");
    setDescription("");
    setImage("");
    reload();
  }

  function resetDefaults() {
    PasteurStorage.resetNursingServices();
    reload();
  }

  return (
    <div className="space-y-8">
      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-4 font-bold">افزودن دسته پرستاری</h2>
        <form onSubmit={addCategory} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان دسته"
            required
          />
          <FormInput
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="آیکن"
          />
          <FormInput
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="برچسب قیمت پیش‌فرض"
          />
          <FormInput
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="URL تصویر (اختیاری)"
          />
          <FormTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیح"
            className="md:col-span-2 min-h-[86px]"
          />
          <Button type="submit" className="md:col-span-2">
            افزودن دسته
          </Button>
        </form>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">دسته‌ها و تعرفه‌ها</h2>
        <button
          type="button"
          onClick={resetDefaults}
          className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white"
        >
          بازنشانی به پیش‌فرض
        </button>
      </div>

      {services.map((service, categoryIndex) => (
        <Card key={service.id} hover={false} className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <button
              type="button"
              className="text-sm font-bold text-slate-800"
              onClick={() =>
                setExpandedId(expandedId === service.id ? "" : service.id)
              }
            >
              {service.emoji} {service.title}
            </button>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={service.active !== false}
                  onChange={(e) =>
                    updateCategory(categoryIndex, { active: e.target.checked })
                  }
                />
                فعال
              </label>
              <button
                type="button"
                className="text-xs font-bold text-red-600"
                onClick={() => deleteCategory(categoryIndex)}
              >
                حذف دسته
              </button>
            </div>
          </div>

          {expandedId === service.id ? (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormInput
                  value={service.title || ""}
                  onChange={(e) => updateCategory(categoryIndex, { title: e.target.value })}
                  placeholder="عنوان"
                />
                <FormInput
                  value={service.emoji || ""}
                  onChange={(e) => updateCategory(categoryIndex, { emoji: e.target.value })}
                  placeholder="آیکن"
                />
                <FormInput
                  value={service.price || ""}
                  onChange={(e) => updateCategory(categoryIndex, { price: e.target.value })}
                  placeholder="برچسب قیمت پیش‌فرض"
                />
                <FormInput
                  value={service.image || ""}
                  onChange={(e) => updateCategory(categoryIndex, { image: e.target.value })}
                  placeholder="URL تصویر"
                />
                <FormTextarea
                  value={service.description || ""}
                  onChange={(e) =>
                    updateCategory(categoryIndex, { description: e.target.value })
                  }
                  placeholder="توضیح"
                  className="md:col-span-2 min-h-[72px]"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold">آیتم‌های قیمت‌دار</h3>
                <Button
                  type="button"
                  className="text-xs"
                  onClick={() => addItem(categoryIndex)}
                >
                  افزودن آیتم
                </Button>
              </div>

              <AdminTable
                headers={["عنوان", "قیمت (عدد)", "برچسب قیمت", "واحد", "فعال", "عملیات"]}
                empty="آیتمی ثبت نشده — برچسب پیش‌فرض نمایش داده می‌شود."
              >
                {(service.items || []).map((item, itemIndex) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <FormInput
                        className="text-xs"
                        value={item.title || ""}
                        onChange={(e) =>
                          updateItem(categoryIndex, itemIndex, { title: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <FormInput
                        className="text-xs"
                        type="number"
                        min={0}
                        value={item.priceNum ?? 0}
                        onChange={(e) =>
                          updateItem(categoryIndex, itemIndex, {
                            priceNum: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <FormInput
                        className="text-xs"
                        value={item.price || ""}
                        onChange={(e) =>
                          updateItem(categoryIndex, itemIndex, { price: e.target.value })
                        }
                        placeholder="مثلاً ۲۲۰,۰۰۰ تومان"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <FormInput
                        className="text-xs"
                        value={item.unit || ""}
                        onChange={(e) =>
                          updateItem(categoryIndex, itemIndex, { unit: e.target.value })
                        }
                        placeholder="هر بار"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={item.active !== false}
                        onChange={(e) =>
                          updateItem(categoryIndex, itemIndex, { active: e.target.checked })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-xs font-bold text-red-600"
                        onClick={() => deleteItem(categoryIndex, itemIndex)}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </AdminTable>
            </div>
          ) : null}
        </Card>
      ))}

      <Button type="button" onClick={saveAll}>
        ذخیره همه تغییرات
      </Button>
    </div>
  );
}
