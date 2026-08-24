"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormTextarea } from "@/components/ui/Card";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import { PASTEUR_DATA } from "@/lib/data";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Clip = {
  id: string;
  title: string;
  level: string;
  description: string;
  videoUrl: string;
  durationLabel: string;
  sortOrder: number;
  active: boolean;
};

function newId() {
  return `edu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function AdminDentalEducationPage() {
  const [items, setItems] = useState<Clip[]>([]);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("عمومی");
  const [durationLabel, setDurationLabel] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");

  const reload = useCallback(async () => {
    const data = await fetchAdmin<{ items: Clip[] }>("/api/admin/content/dental-education");
    setItems(data.items.map((item) => ({ ...item })));
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  async function persist(next: Clip[]) {
    await putAdmin("/api/admin/content/dental-education", { items: next });
    await reload();
  }

  function addClip(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    void persist([
      ...items,
      {
        id: newId(),
        title: title.trim(),
        level: level.trim() || "عمومی",
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        durationLabel: durationLabel.trim(),
        sortOrder: items.length,
        active: true,
      },
    ])
      .then(() => {
        setTitle("");
        setLevel("عمومی");
        setDurationLabel("");
        setVideoUrl("");
        setDescription("");
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "افزودن ناموفق"));
  }

  function seedDefaults() {
    const seeded: Clip[] = PASTEUR_DATA.educationCourses.map((c, index) => ({
      id: newId(),
      title: c.title,
      level: c.level,
      description: c.description,
      videoUrl: "",
      durationLabel: c.duration,
      sortOrder: index,
      active: true,
    }));
    void persist(seeded).catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-4 font-bold">افزودن کلیپ آموزشی دندان</h2>
        <form onSubmit={addClip} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان" required />
          <FormInput value={level} onChange={(e) => setLevel(e.target.value)} placeholder="برچسب / سطح" />
          <FormInput
            value={durationLabel}
            onChange={(e) => setDurationLabel(e.target.value)}
            placeholder="مدت — مثل ۵ دقیقه"
          />
          <FormInput
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="لینک ویدیو (اختیاری)"
            className="text-left"
            dir="ltr"
          />
          <FormTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیح"
            className="md:col-span-2 min-h-[80px]"
          />
          <Button type="submit" className="md:col-span-2">
            افزودن
          </Button>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={seedDefaults}>
          پر کردن از پیش‌فرض‌ها
        </Button>
        <Button
          type="button"
          onClick={() =>
            void persist(items).catch((e) => setError(e instanceof Error ? e.message : "ذخیره ناموفق"))
          }
        >
          ذخیره تغییرات
        </Button>
      </div>

      <AdminTable headers={["عنوان", "برچسب", "مدت", "لینک", "فعال", "حذف"]} empty="کلیپی ثبت نشده.">
        {items.map((item, index) => (
          <tr key={item.id} className="border-t border-slate-100 align-top">
            <td className="px-4 py-3">
              <FormInput
                className="text-xs"
                value={item.title}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((row, i) => (i === index ? { ...row, title: e.target.value } : row)),
                  )
                }
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                className="text-xs"
                value={item.level}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((row, i) => (i === index ? { ...row, level: e.target.value } : row)),
                  )
                }
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                className="text-xs"
                value={item.durationLabel}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((row, i) =>
                      i === index ? { ...row, durationLabel: e.target.value } : row,
                    ),
                  )
                }
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                className="text-left text-xs"
                dir="ltr"
                value={item.videoUrl}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((row, i) => (i === index ? { ...row, videoUrl: e.target.value } : row)),
                  )
                }
              />
            </td>
            <td className="px-4 py-3 text-center">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((row, i) => (i === index ? { ...row, active: e.target.checked } : row)),
                  )
                }
              />
            </td>
            <td className="px-4 py-3">
              <button
                type="button"
                className="text-xs font-bold text-red-600"
                onClick={() => void persist(items.filter((_, i) => i !== index))}
              >
                حذف
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
