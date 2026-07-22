"use client";

import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { PASTEUR_DATA, type NursingItem, type NursingService } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NursingCatalogProps = {
  variant?: "site" | "app";
};

function formatItemPrice(item: NursingItem): string {
  if (item.price) return item.price;
  return `${item.priceNum.toLocaleString("fa-IR")} تومان`;
}

export function NursingCatalog({ variant = "site" }: NursingCatalogProps) {
  const app = variant === "app";
  const phone = PASTEUR_DATA.institute.phoneDigits;
  const [categories, setCategories] = useState<NursingService[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  useEffect(() => {
    PasteurStorage.initNursingServicesIfNeeded();
    const active = PasteurStorage.getNursingServices().filter(
      (service) => service.active !== false,
    );
    setCategories(active);
    if (active.length) {
      setSelectedId(active[0].id);
      const firstItems = (active[0].items || []).filter((item) => item.active !== false);
      setSelectedItemId(firstItems[0]?.id || "");
    }
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

  function selectCategory(id: string) {
    setSelectedId(id);
    const category = categories.find((c) => c.id === id);
    const items = (category?.items || []).filter((item) => item.active !== false);
    setSelectedItemId(items[0]?.id || "");
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
                {selectedCategory.price}
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-slate-500">انتخاب خدمت / تعرفه</p>
                {activeItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
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
                {selectedItem ? (
                  <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
                    <p className="text-xs text-slate-500">قیمت انتخاب‌شده</p>
                    <p className="mt-1 text-lg font-extrabold text-teal-800">
                      {formatItemPrice(selectedItem)}
                      {selectedItem.unit ? (
                        <span className="text-sm font-normal text-slate-600">
                          {" "}
                          / {selectedItem.unit}
                        </span>
                      ) : null}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <EmptyState title="خدمت پرستاری فعالی یافت نشد." />
      )}

      {app ? (
        <>
          <Button href={`tel:${phone}`} className="w-full">
            تماس برای درخواست
          </Button>
          <Link
            href={`${ROUTES.app.consultation}?category=nursing&type=phone`}
            className="mt-3 block text-center text-sm font-bold text-cyan-700 underline-offset-4 hover:underline"
          >
            ثبت درخواست آنلاین
          </Link>
        </>
      ) : (
        <div className="mt-8 text-center">
          <Button href={`tel:${phone}`}>درخواست خدمات پرستاری</Button>
        </div>
      )}
    </>
  );
}
