"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormSelect } from "@/components/ui/Card";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import { type GalleryItem } from "@/lib/data";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("dental");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const data = await fetchAdmin<{ items: GalleryItem[] }>("/api/admin/content/gallery");
    setItems(data.items.map((g) => ({ ...g })));
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  async function persist(next: GalleryItem[]) {
    await putAdmin("/api/admin/content/gallery", { items: next });
    await reload();
  }

  function addItem(e: FormEvent) {
    e.preventDefault();
    void persist([
      ...items,
      {
        id: Date.now(),
        title,
        category,
        before: before || "/uploads/placeholder.svg",
        after: after || "/uploads/placeholder.svg",
      },
    ])
      .then(() => {
        setTitle("");
        setCategory("dental");
        setBefore("");
        setAfter("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "افزودن ناموفق"));
  }

  function deleteItem(index: number) {
    void persist(items.filter((_, i) => i !== index)).catch((e) =>
      setError(e instanceof Error ? e.message : "حذف ناموفق"),
    );
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g, i) => (
          <Card key={`${g.id}-${i}`} hover={false} className="overflow-hidden p-0">
            <div className="grid grid-cols-2 gap-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.before} className="h-24 object-cover" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.after} className="h-24 object-cover" alt="" />
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-sm font-bold">{g.title}</span>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => deleteItem(i)}
              >
                حذف
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Card hover={false} className="max-w-lg p-6">
        <h2 className="mb-4 font-bold">افزودن نمونه‌کار</h2>
        <form onSubmit={addItem} className="space-y-3">
          <FormInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان"
            required
          />
          <FormSelect value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="dental">دندانپزشکی</option>
            <option value="laser">لیزر</option>
            <option value="beauty">زیبایی</option>
          </FormSelect>
          <FormInput
            type="url"
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            placeholder="URL تصویر قبل"
            required
          />
          <FormInput
            type="url"
            value={after}
            onChange={(e) => setAfter(e.target.value)}
            placeholder="URL تصویر بعد"
            required
          />
          <Button type="submit" className="w-full text-sm">
            افزودن
          </Button>
        </form>
      </Card>
    </div>
  );
}
