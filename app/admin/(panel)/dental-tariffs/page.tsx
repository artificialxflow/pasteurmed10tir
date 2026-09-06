"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormTextarea } from "@/components/ui/Card";
import { DraftNumberInput } from "@/components/ui/DraftNumberInput";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import type { DentalTariffCategory, DentalTariffItem } from "@/lib/dental-tariffs";
import { FormEvent, useCallback, useEffect, useState } from "react";

function makeCategoryId(title: string) {
  return `dental-tariff-${Date.now()}-${String(title || "").replace(/\s+/g, "-").slice(0, 16)}`;
}

function makeItemId(title: string) {
  return `dti-${Date.now()}-${String(title || "").replace(/\s+/g, "-").slice(0, 12)}`;
}

function normalizeItem(item: DentalTariffItem): DentalTariffItem {
  const label = String(item.price || "").trim();
  const priceNum = Number(item.priceNum || 0);
  const price = label || (priceNum > 0 ? `${priceNum.toLocaleString("fa-IR")} تومان` : "");
  return { ...item, priceNum, price: price || undefined };
}

export default function AdminDentalTariffsPage() {
  const [categories, setCategories] = useState<DentalTariffCategory[]>([]);
  const [expandedId, setExpandedId] = useState("");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🦷");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const data = await fetchAdmin<{ items: DentalTariffCategory[] }>(
      "/api/admin/content/dental-tariffs",
    );
    const next = data.items.map((s) => ({
      ...s,
      items: (s.items || []).map((item) => normalizeItem({ ...item })),
    }));
    setCategories(next);
    setExpandedId((prev) => prev || next[0]?.id || "");
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  async function persist(next: DentalTariffCategory[]) {
    const cleaned = next
      .map((category) => ({
        ...category,
        id: category.id || makeCategoryId(category.title),
        title: String(category.title || "").trim(),
        emoji: String(category.emoji || "🦷").trim() || "🦷",
        description: String(category.description || "").trim(),
        active: category.active !== false,
        items: (category.items || [])
          .map((item) => normalizeItem(item))
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
      .filter((category) => category.title);
    await putAdmin("/api/admin/content/dental-tariffs", { items: cleaned });
    await reload();
  }

  function updateCategory(index: number, patch: Partial<DentalTariffCategory>) {
    setCategories((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function updateItem(categoryIndex: number, itemIndex: number, patch: Partial<DentalTariffItem>) {
    setCategories((prev) =>
      prev.map((category, ci) => {
        if (ci !== categoryIndex) return category;
        const items = [...(category.items || [])];
        items[itemIndex] = { ...items[itemIndex], ...patch };
        return { ...category, items };
      }),
    );
  }

  function addItem(categoryIndex: number) {
    setCategories((prev) =>
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
    setCategories((prev) =>
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
    void persist(categories.filter((_, i) => i !== index)).catch((e) =>
      setError(e instanceof Error ? e.message : "حذف ناموفق"),
    );
  }

  function saveAll() {
    void persist(categories).catch((e) =>
      setError(e instanceof Error ? e.message : "ذخیره ناموفق"),
    );
  }

  function addCategory(e: FormEvent) {
    e.preventDefault();
    void persist([
      ...categories,
      {
        id: makeCategoryId(title),
        title: title.trim(),
        emoji: emoji.trim() || "🦷",
        description: description.trim(),
        active: true,
        items: [],
      },
    ])
      .then(() => {
        setTitle("");
        setEmoji("🦷");
        setDescription("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "افزودن ناموفق"));
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-sm leading-7 text-slate-600">
        دسته‌ها و قیمت‌ها را اینجا وارد کنید. صفحه عمومی تا وقتی آیتمی ثبت نشود خالی می‌ماند.
      </p>
      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-4 font-bold">افزودن دسته تعرفه</h2>
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
          <FormTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیح (اختیاری)"
            className="md:col-span-2 min-h-[86px]"
          />
          <Button type="submit" className="md:col-span-2">
            افزودن دسته
          </Button>
        </form>
      </Card>

      <h2 className="text-lg font-bold">دسته‌ها و تعرفه‌ها</h2>

      {categories.map((category, categoryIndex) => (
        <Card key={category.id} hover={false} className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <button
              type="button"
              className="text-sm font-bold text-slate-800"
              onClick={() => setExpandedId(expandedId === category.id ? "" : category.id)}
            >
              {category.emoji} {category.title}
            </button>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={category.active !== false}
                  onChange={(e) => updateCategory(categoryIndex, { active: e.target.checked })}
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

          {expandedId === category.id ? (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormInput
                  value={category.title || ""}
                  onChange={(e) => updateCategory(categoryIndex, { title: e.target.value })}
                  placeholder="عنوان"
                />
                <FormInput
                  value={category.emoji || ""}
                  onChange={(e) => updateCategory(categoryIndex, { emoji: e.target.value })}
                  placeholder="آیکن"
                />
                <FormTextarea
                  value={category.description || ""}
                  onChange={(e) =>
                    updateCategory(categoryIndex, { description: e.target.value })
                  }
                  placeholder="توضیح"
                  className="md:col-span-2 min-h-[72px]"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold">آیتم‌های قیمت‌دار</h3>
                <Button type="button" className="text-xs" onClick={() => addItem(categoryIndex)}>
                  افزودن آیتم
                </Button>
              </div>

              <AdminTable
                headers={["عنوان", "قیمت (تومان)", "برچسب قیمت", "واحد", "فعال", "عملیات"]}
                empty="آیتمی ثبت نشده."
              >
                {(category.items || []).map((item, itemIndex) => (
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
                      <DraftNumberInput
                        className="text-xs"
                        min={0}
                        max={100_000_000}
                        value={Number(item.priceNum || 0)}
                        onCommit={(priceNum) =>
                          updateItem(categoryIndex, itemIndex, {
                            priceNum,
                            price:
                              priceNum > 0
                                ? `${priceNum.toLocaleString("fa-IR")} تومان`
                                : item.price,
                          })
                        }
                        placeholder="قیمت (تومان)"
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
                        placeholder="هر واحد"
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
