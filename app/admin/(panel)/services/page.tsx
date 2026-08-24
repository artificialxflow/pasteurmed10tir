"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { QrCodePanel } from "@/components/admin/QrCodePanel";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormSelect, FormTextarea } from "@/components/ui/Card";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import { QR_PRESET_PATHS } from "@/lib/content/qr-url";
import { inferServiceHref } from "@/lib/content/service-href";
import { PASTEUR_DATA } from "@/lib/data";
import type { ServiceItem } from "@/lib/storage";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const COLORS = ["teal", "blue", "rose", "purple", "amber"] as const;

function contentAdminForHref(href?: string): { label: string; path: string } | null {
  const path = String(href || "").trim().toLowerCase();
  if (!path) return null;
  if (path.startsWith("/laser")) return { label: "مدیریت لیزر", path: "/admin/laser-services" };
  if (path.startsWith("/nursing")) return { label: "مدیریت پرستاری", path: "/admin/nursing-services" };
  if (path.startsWith("/shop")) return { label: "مدیریت فروشگاه", path: "/admin/shop" };
  if (path.startsWith("/dental") || path.startsWith("/medical")) {
    return { label: "مدیریت پزشکان", path: "/admin/doctors" };
  }
  return null;
}

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
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const data = await fetchAdmin<{ items: ServiceItem[] }>("/api/admin/content/services");
      setServices(data.items.map((s) => ({ ...s })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در بارگذاری");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function updateRow(index: number, patch: Partial<ServiceItem>) {
    setServices((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  async function persist(next: ServiceItem[]) {
    const cleaned = next
      .map((service) => ({
        ...service,
        title: String(service.title || "").trim(),
        emoji: String(service.emoji || "🧩").trim() || "🧩",
        description: String(service.description || "").trim(),
        href: String(service.href || "").trim() || inferServiceHref(service.title || ""),
        image: String(service.image || "/uploads/placeholder.svg").trim(),
        color: String(service.color || "teal"),
        active: service.active !== false,
      }))
      .filter((service) => service.title && (service.href || inferServiceHref(service.title)));
    await putAdmin("/api/admin/content/services", { items: cleaned });
    await reload();
  }

  async function saveAll() {
    setError("");
    try {
      await persist(services);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ذخیره ناموفق");
    }
  }

  async function deleteService(index: number) {
    setError("");
    try {
      await persist(services.filter((_, i) => i !== index));
    } catch (e) {
      setError(e instanceof Error ? e.message : "حذف ناموفق");
    }
  }

  async function addService(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await persist([
        ...services,
        {
          id: makeServiceId(title),
          title: title.trim(),
          emoji: emoji.trim() || "🧩",
          href: href.trim() || inferServiceHref(title),
          color,
          image: image.trim() || "/uploads/placeholder.svg",
          description: description.trim() || "مشاهده جزئیات و ثبت درخواست",
          active: true,
        },
      ]);
      setTitle("");
      setEmoji("");
      setHref("");
      setColor("teal");
      setImage("");
      setDescription("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "افزودن ناموفق");
    }
  }

  async function resetDefaults() {
    setError("");
    try {
      await persist(
        PASTEUR_DATA.services.map((service) => ({
          ...service,
          active: true,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "بازنشانی ناموفق");
    }
  }

  const qrServices = useMemo(
    () =>
      services.filter(
        (service) => service.active !== false && String(service.href || "").trim(),
      ),
    [services],
  );

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card hover={false} className="border-amber-200 bg-amber-50/80 p-5">
        <h2 className="mb-2 font-bold text-amber-950">این صفحه فقط کارت‌های صفحه اصلی است</h2>
        <p className="mb-3 text-sm leading-7 text-amber-900/90">
          افزودن سرویس اینجا فقط عنوان + لینک روی `/` می‌سازد. موارد داخل هر مسیر را از منوی محتوا
          جداگانه مدیریت کنید:
        </p>
        <ul className="space-y-1.5 text-sm text-amber-950">
          <li>
            <span className="font-bold">/laser</span> →{" "}
            <a className="font-bold text-teal-800 underline" href="/admin/laser-services">
              خدمات لیزر
            </a>
          </li>
          <li>
            <span className="font-bold">/nursing</span> →{" "}
            <a className="font-bold text-teal-800 underline" href="/admin/nursing-services">
              خدمات پرستاری
            </a>
          </li>
          <li>
            <span className="font-bold">/shop</span> →{" "}
            <a className="font-bold text-teal-800 underline" href="/admin/shop">
              فروشگاه
            </a>
          </li>
          <li>
            <span className="font-bold">/dental · /medical</span> →{" "}
            <a className="font-bold text-teal-800 underline" href="/admin/doctors">
              پزشکان
            </a>
          </li>
        </ul>
      </Card>

      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-1 font-bold text-slate-900">QR دسترسی به خدمات</h2>
        <p className="mb-4 text-sm text-slate-600">
          هر QR به آدرس عمومی همان مسیر روی <span dir="ltr">pasteur.plus</span> می‌رود. PNG را
          دانلود و چاپ کنید.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QR_PRESET_PATHS.map((preset) => (
            <QrCodePanel
              key={preset.path}
              href={preset.path}
              label={preset.label}
              fileName={`pasteur-${preset.path === "/" ? "home" : preset.path.slice(1).replace(/\//g, "-")}`}
              size={140}
              compact
            />
          ))}
        </div>
        {qrServices.length ? (
          <>
            <h3 className="mb-3 mt-8 text-sm font-bold text-slate-800">QR سرویس‌های ثبت‌شده</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {qrServices.map((service) => (
                <QrCodePanel
                  key={service.id}
                  href={String(service.href)}
                  label={`${service.emoji || ""} ${service.title}`.trim()}
                  fileName={`service-${service.id}`}
                  size={140}
                  compact
                />
              ))}
            </div>
          </>
        ) : null}
      </Card>

      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-4 font-bold">افزودن سرویس جدید</h2>
        <p className="mb-3 text-sm text-slate-600">
          اینجا فقط کارت صفحه اصلی است؛ موارد داخل سرویس در منوی جداگانه (لیزر / پرستاری / فروشگاه /
          پزشکان).
        </p>
        <form onSubmit={addService} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormInput
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!href) setHref(inferServiceHref(e.target.value));
            }}
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
            placeholder="لینک — خودکار از عنوان (مثل /laser)"
          />
          <FormSelect value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="teal">سبز/فیروزه‌ای</option>
            <option value="blue">آبی</option>
            <option value="rose">صورتی</option>
            <option value="purple">بنفش</option>
            <option value="amber">طلایی</option>
          </FormSelect>
          <ImageUploadField
            value={image}
            onChange={setImage}
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
          onClick={() => void resetDefaults()}
          className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white"
        >
          بازنشانی به پیش‌فرض
        </button>
      </div>

      <AdminTable
        headers={["عنوان", "آیکن", "توضیح", "لینک", "محتوای مقصد", "تصویر", "رنگ", "فعال", "عملیات"]}
        empty="سرویسی ثبت نشده است."
      >
        {services.map((service, index) => {
          const dest = contentAdminForHref(service.href);
          return (
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
              {dest ? (
                <a
                  href={dest.path}
                  className="text-xs font-bold text-teal-700 underline underline-offset-2"
                >
                  {dest.label}
                </a>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
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
                onClick={() => void deleteService(index)}
              >
                حذف
              </button>
            </td>
          </tr>
          );
        })}
      </AdminTable>

      <Button type="button" onClick={() => void saveAll()}>
        ذخیره تغییرات سرویس‌ها
      </Button>
    </div>
  );
}
