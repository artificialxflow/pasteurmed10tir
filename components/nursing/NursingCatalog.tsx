"use client";

import { Button } from "@/components/ui/Button";
import { Card, EmptyState, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { PASTEUR_DATA, type NursingItem, type NursingService } from "@/lib/data";
import { fetchPublic } from "@/lib/content/client";
import { fetchPatientOps } from "@/lib/operations/client";
import type { PendingNursingPayment } from "@/lib/payment";
import type { PatientProfile } from "@/lib/patient";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import { cn, formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type NursingCatalogProps = {
  variant?: "site" | "app";
};

function formatItemPrice(item: NursingItem): string {
  if (item.price) return item.price;
  return `${item.priceNum.toLocaleString("fa-IR")} تومان`;
}

function parsePriceFromLabel(raw?: string): number {
  if (!raw) return 0;
  const digits = raw.replace(/[^\d۰-۹0-9]/g, "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

export function NursingCatalog({ variant = "site" }: NursingCatalogProps) {
  const app = variant === "app";
  const router = useRouter();
  const phoneDigits = PASTEUR_DATA.institute.phoneDigits;
  const [categories, setCategories] = useState<NursingService[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublic<{ items: NursingService[] }>("/api/content/nursing")
      .then((data) => {
        const active = data.items.filter((service) => service.active !== false);
        setCategories(active);
        if (active.length) {
          setSelectedId(active[0].id);
          const firstItem = active[0].items?.find((i) => i.active !== false);
          setSelectedItemId(firstItem?.id || "");
        }
      })
      .catch(() => setCategories([]));

    void fetchPatientOps<{ profile: PatientProfile | null }>("/api/auth/me")
      .then((res) => {
        if (!res.profile) return;
        setName((prev) => prev || res.profile!.name);
        setPhone((prev) => prev || res.profile!.phone);
      })
      .catch(() => {});
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedId) || null,
    [categories, selectedId],
  );

  const activeItems = useMemo(
    () => (selectedCategory?.items || []).filter((item) => item.active !== false),
    [selectedCategory],
  );

  const selectedItem = useMemo(
    () => activeItems.find((item) => item.id === selectedItemId) || null,
    [activeItems, selectedItemId],
  );

  const payableAmount = useMemo(() => {
    if (selectedItem?.priceNum && selectedItem.priceNum > 0) return selectedItem.priceNum;
    if (selectedCategory) return parsePriceFromLabel(selectedCategory.price);
    return 0;
  }, [selectedItem, selectedCategory]);

  function selectCategory(id: string) {
    setSelectedId(id);
    const category = categories.find((c) => c.id === id);
    const items = (category?.items || []).filter((item) => item.active !== false);
    setSelectedItemId(items[0]?.id || "");
    setError("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedCategory) {
      setError("خدمت پرستاری را انتخاب کنید.");
      return;
    }
    if (activeItems.length > 0 && !selectedItem) {
      setError("تعرفه خدمت را انتخاب کنید.");
      return;
    }
    if (payableAmount < 100) {
      setError("تعرفه این خدمت برای پرداخت تنظیم نشده است. از پنل ادمین قیمت را وارد کنید.");
      return;
    }
    const patientName = name.trim();
    const patientPhone = phone.trim();
    if (!patientName || !patientPhone) {
      setError("نام و موبایل الزامی است.");
      return;
    }

    const itemTitle = selectedItem?.title || selectedCategory.title;
    const estimate = selectedItem
      ? formatItemPrice(selectedItem)
      : selectedCategory.price || formatPrice(payableAmount);

    const pending: PendingNursingPayment = {
      kind: "nursing",
      serviceId: selectedCategory.id,
      serviceTitle: selectedCategory.title,
      itemId: selectedItem?.id,
      itemTitle,
      unit: selectedItem?.unit,
      patientName,
      patientPhone,
      description: description.trim(),
      amount: payableAmount,
      amountToman: payableAmount,
      estimate,
      paymentLabel: "مبلغ تعرفه خدمت پرستاری",
      returnTo: app ? ROUTES.app.nursing : ROUTES.web.nursing,
      successTo: app ? ROUTES.app.nursingSuccess : ROUTES.web.nursingSuccess,
    };

    PasteurStorage.initPatientDomainIfNeeded();
    PasteurStorage.setPendingPayment(pending);
    router.push(app ? ROUTES.app.nursingConfirm : ROUTES.web.nursingConfirm);
  }

  return (
    <>
      <div className={cn("mb-6 flex flex-wrap gap-2", app && "mb-4")}>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => selectCategory(category.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
              selectedId === category.id
                ? "border-teal-300 bg-teal-100 text-teal-800"
                : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-white",
            )}
          >
            <span>{category.emoji}</span>
            <span>{category.title}</span>
          </button>
        ))}
      </div>

      {selectedCategory ? (
        <Card hover={false} className={cn("overflow-hidden bg-white p-0", app && "mb-4")}>
          {!app && selectedCategory.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedCategory.image}
              alt={selectedCategory.title}
              className="h-40 w-full object-cover"
              loading="lazy"
            />
          ) : null}
          <div className={cn("p-6", app && "p-4")}>
            <span className={cn("text-3xl", app && "text-2xl")}>{selectedCategory.emoji}</span>
            <h2 className={cn("mt-3 text-lg font-bold", app && "mt-2 text-sm")}>
              {selectedCategory.title}
            </h2>
            {selectedCategory.description ? (
              <p className={cn("mt-2 text-sm leading-7 text-slate-600", app && "text-xs")}>
                {selectedCategory.description}
              </p>
            ) : null}

            {activeItems.length === 0 ? (
              <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">
                {selectedCategory.price || "تعرفه تعریف نشده"}
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-slate-500">انتخاب خدمت / تعرفه</p>
                {activeItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setError("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-right text-sm transition-colors",
                      selectedItemId === item.id
                        ? "border-teal-300 bg-teal-50"
                        : "border-slate-200 bg-slate-50 hover:bg-white",
                    )}
                  >
                    <span className="font-bold text-slate-800">{item.title}</span>
                    <span className="text-teal-700">
                      {formatItemPrice(item)}
                      {item.unit ? ` / ${item.unit}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
              <p className="text-xs text-slate-500">مبلغ قابل پرداخت (بر اساس تعرفه)</p>
              <p className="mt-1 text-lg font-extrabold text-teal-800">
                {payableAmount > 0 ? formatPrice(payableAmount) : "—"}
                {selectedItem?.unit ? (
                  <span className="text-sm font-normal text-slate-600"> / {selectedItem.unit}</span>
                ) : null}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="هنوز خدمت پرستاری ثبت نشده"
          desc="از پنل ادمین → خدمات پرستاری آیتم و تعرفه اضافه کنید."
        />
      )}

      {selectedCategory ? (
        <form onSubmit={onSubmit} className={cn("mt-6 space-y-4", app && "mt-4")}>
          <p className="text-sm font-bold text-slate-800">ثبت و پرداخت آنلاین</p>
          <p className="text-xs text-slate-500">
            پرداخت بر اساس تعرفه خدمت انتخاب‌شده انجام می‌شود — نه تعرفه‌های مشاوره و ویزیت.
          </p>
          <div className={cn("grid gap-4", app ? "grid-cols-1" : "sm:grid-cols-2")}>
            <div>
              <FormLabel>نام و نام خانوادگی</FormLabel>
              <FormInput required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <FormLabel>موبایل</FormLabel>
              <FormInput
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div>
            <FormLabel>توضیحات (اختیاری)</FormLabel>
            <FormTextarea
              placeholder="آدرس تقریبی، زمان ترجیحی یا شرح نیاز..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[90px]"
            />
          </div>
          {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={payableAmount < 100}>
            ادامه به پرداخت {payableAmount > 0 ? `(${formatPrice(payableAmount)})` : ""}
          </Button>
          <a
            href={`tel:${phoneDigits}`}
            className="block text-center text-sm font-bold text-slate-600 hover:text-teal-700"
          >
            یا تماس تلفنی: {PASTEUR_DATA.institute.phone}
          </a>
        </form>
      ) : null}
    </>
  );
}
