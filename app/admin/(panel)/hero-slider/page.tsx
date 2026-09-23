"use client";

import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Card, FormInput } from "@/components/ui/Card";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import { DEFAULT_HERO_SLIDES, type HeroSlide } from "@/lib/content/hero-slides";
import { confirmAction } from "@/lib/ui/confirm-action";
import { useCallback, useEffect, useState } from "react";

export default function AdminHeroSliderPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const reload = useCallback(async () => {
    const data = await fetchAdmin<{ heroSlides?: HeroSlide[] }>("/api/admin/content/settings");
    const next = Array.isArray(data.heroSlides) && data.heroSlides.length
      ? data.heroSlides
      : DEFAULT_HERO_SLIDES;
    setSlides(next.map((s) => ({ ...s })));
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا در بارگذاری"));
  }, [reload]);

  function update(index: number, patch: Partial<HeroSlide>) {
    setSlides((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function move(index: number, dir: -1 | 1) {
    setSlides((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {ok ? <p className="text-sm font-bold text-teal-800">{ok}</p> : null}

      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-2 font-bold">اسلایدر صفحه اصلی</h2>
        <p className="mb-4 text-xs text-slate-500">
          تصاویر هیرو صفحه وب. ترتیب لیست = ترتیب نمایش. لینک می‌تواند مسیر داخلی باشد مثل
          /dental/booking
        </p>
        <div className="space-y-4">
          {slides.map((slide, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-2">
              <ImageUploadField
                value={slide.src}
                onChange={(path) => update(index, { src: path })}
                placeholder="تصویر اسلاید"
              />
              <div className="space-y-2">
                <FormInput
                  value={slide.alt}
                  onChange={(e) => update(index, { alt: e.target.value })}
                  placeholder="متن جایگزین / عنوان"
                />
                <FormInput
                  value={slide.href}
                  onChange={(e) => update(index, { href: e.target.value })}
                  placeholder="لینک — مثلاً /shop/facility"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs font-bold text-slate-600"
                    onClick={() => move(index, -1)}
                  >
                    بالاتر
                  </button>
                  <button
                    type="button"
                    className="text-xs font-bold text-slate-600"
                    onClick={() => move(index, 1)}
                  >
                    پایین‌تر
                  </button>
                  <button
                    type="button"
                    className="text-xs font-bold text-red-600"
                    onClick={() => {
                      if (!confirmAction("این اسلاید حذف شود؟")) return;
                      setSlides((prev) => prev.filter((_, i) => i !== index));
                    }}
                  >
                    حذف اسلاید
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setSlides((prev) => [...prev, { src: "", alt: "", href: "/" }])
            }
          >
            افزودن اسلاید
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => {
              setSaving(true);
              setOk("");
              void putAdmin("/api/admin/content/settings", {
                heroSlides: slides.filter((s) => s.src.trim()),
              })
                .then(() => {
                  setError("");
                  setOk("اسلایدرها ذخیره شد.");
                })
                .catch((e) => setError(e instanceof Error ? e.message : "ذخیره ناموفق"))
                .finally(() => setSaving(false));
            }}
          >
            {saving ? "…" : "ذخیره اسلایدرها"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
