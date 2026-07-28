"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Card";
import type { HelpItem } from "@/lib/patient";
import { PasteurStorage } from "@/lib/storage";
import { FormEvent, useEffect, useState } from "react";

export default function AdminHelpPage() {
  const [items, setItems] = useState<HelpItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"video" | "pdf">("video");

  function reload() {
    PasteurStorage.initPatientDomainIfNeeded();
    setItems(PasteurStorage.getHelpItems());
  }

  useEffect(() => {
    reload();
  }, []);

  function add(e: FormEvent) {
    e.preventDefault();
    PasteurStorage.saveHelpItems([
      ...items,
      {
        id: `help-${Date.now().toString(36)}`,
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        type,
        active: true,
      },
    ]);
    setTitle("");
    setDescription("");
    setUrl("");
    reload();
  }

  function remove(id: string) {
    PasteurStorage.saveHelpItems(items.filter((i) => i.id !== id));
    reload();
  }

  return (
    <div className="space-y-6">
      <Card hover={false} className="p-5">
        <h2 className="mb-3 font-extrabold">افزودن آموزش</h2>
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <div>
            <FormLabel>عنوان</FormLabel>
            <FormInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <FormLabel>نوع</FormLabel>
            <FormSelect value={type} onChange={(e) => setType(e.target.value as "video" | "pdf")}>
              <option value="video">ویدیو</option>
              <option value="pdf">PDF</option>
            </FormSelect>
          </div>
          <div className="sm:col-span-2">
            <FormLabel>لینک</FormLabel>
            <FormInput value={url} onChange={(e) => setUrl(e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <FormLabel>توضیح</FormLabel>
            <FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" className="text-sm">
            افزودن
          </Button>
        </form>
      </Card>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} hover={false} className="flex items-center justify-between p-4">
            <div>
              <p className="font-bold">{item.title}</p>
              <p className="text-xs text-slate-500">
                {item.type} — {item.url}
              </p>
            </div>
            <button type="button" className="text-xs font-bold text-red-700" onClick={() => remove(item.id)}>
              حذف
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
