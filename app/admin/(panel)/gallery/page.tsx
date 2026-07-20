"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormSelect } from "@/components/ui/Card";
import { type GalleryItem } from "@/lib/data";
import { PasteurStorage } from "@/lib/storage";
import { FormEvent, useEffect, useState } from "react";

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("dental");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");

  function reload() {
    PasteurStorage.initGalleryIfNeeded();
    setItems(PasteurStorage.getGallery().map((g) => ({ ...g })));
  }

  useEffect(() => {
    reload();
  }, []);

  function addItem(e: FormEvent) {
    e.preventDefault();
    const next = [
      ...PasteurStorage.getGallery(),
      {
        id: Date.now(),
        title,
        category,
        before,
        after,
      },
    ];
    PasteurStorage.saveGallery(next);
    setTitle("");
    setCategory("dental");
    setBefore("");
    setAfter("");
    reload();
  }

  function deleteItem(index: number) {
    const next = PasteurStorage.getGallery();
    next.splice(index, 1);
    PasteurStorage.saveGallery(next);
    reload();
  }

  return (
    <div className="space-y-8">
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
