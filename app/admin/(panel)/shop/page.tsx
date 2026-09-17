"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { ImageUploadField, MultiImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormSelect } from "@/components/ui/Card";
import { DraftNumberInput } from "@/components/ui/DraftNumberInput";
import { slugifyFa } from "@/lib/content/product-slug";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import type { ShopHomeBanner } from "@/lib/content/shop-home-banners";
import {
  SHOP_FEATURED_PRODUCTS_MAX,
  parseShopFeaturedProductIds,
} from "@/lib/content/shop-featured-products";
import { fetchAdminCommerce, patchAdminCommerce } from "@/lib/commerce/client";
import { type Product } from "@/lib/data";
import { productThumbnail } from "@/lib/shop/product-display";
import { scrollToAdminProductForm } from "@/lib/shop/cart-ui";
import { type ShopOrder } from "@/lib/storage";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ProductCategory = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
};

type ProductDraft = {
  id: number;
  name: string;
  slug: string;
  description: string;
  categoryId: number;
  price: string;
  priceNum: number;
  discountPercent: number;
  size: string;
  stock: number;
  images: string[];
  active: boolean;
  sortOrder: number;
  slugTouched: boolean;
};

type OrderItem = { name?: string; qty?: number };

function formatPrice(num: number) {
  return Number(num || 0).toLocaleString("fa-IR");
}

function parsePrice(value: string) {
  const normalized = String(value || "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  return Number(normalized.replace(/[^\d]/g, "")) || 0;
}

function emptyDraft(categoryId: number): ProductDraft {
  return {
    id: 0,
    name: "",
    slug: "",
    description: "",
    categoryId,
    price: "",
    priceNum: 0,
    discountPercent: 0,
    size: "",
    stock: 10,
    images: [],
    active: true,
    sortOrder: 0,
    slugTouched: false,
  };
}

function productToDraft(product: Product, categories: ProductCategory[]): ProductDraft {
  const categoryId =
    product.categoryId ||
    categories.find((c) => c.name === product.category)?.id ||
    categories[0]?.id ||
    0;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug || slugifyFa(product.name),
    description: product.description || "",
    categoryId,
    price: product.price,
    priceNum: product.priceNum,
    discountPercent: product.discountPercent ?? 0,
    size: product.size || "",
    stock: product.stock,
    images: product.images?.length ? product.images : product.image ? [product.image] : [],
    active: product.active !== false,
    sortOrder: product.sortOrder || 0,
    slugTouched: true,
  };
}

function draftToProduct(draft: ProductDraft, categories: ProductCategory[]): Product {
  const category = categories.find((c) => c.id === draft.categoryId);
  const images = draft.images.length ? draft.images : ["/uploads/placeholder.svg"];
  return {
    id: draft.id,
    name: draft.name.trim(),
    slug: draft.slug.trim() || slugifyFa(draft.name),
    description: draft.description.trim(),
    category: category?.name || "دندانپزشکی",
    categoryId: draft.categoryId,
    categorySlug: category?.slug || null,
    price: draft.price.trim(),
    priceNum: draft.priceNum || parsePrice(draft.price),
    discountPercent: draft.discountPercent,
    size: draft.size.trim(),
    stock: draft.stock,
    image: images[0],
    images,
    active: draft.active,
    sortOrder: draft.sortOrder,
  };
}

export default function AdminShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<ProductCategory | null>(null);
  const [categorySlugTouched, setCategorySlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [homeBanners, setHomeBanners] = useState<ShopHomeBanner[]>([]);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [featuredProductIds, setFeaturedProductIds] = useState<number[]>([]);
  const [featuredSaving, setFeaturedSaving] = useState(false);
  const [featuredAddId, setFeaturedAddId] = useState("");

  async function loadCategories() {
    const data = await fetchAdmin<{ items: ProductCategory[] }>(
      "/api/admin/content/product-categories",
    );
    setCategories(data.items);
    return data.items;
  }

  async function loadProducts() {
    const data = await fetchAdmin<{ items: Product[] }>("/api/admin/content/products");
    setProducts(data.items.map((p) => ({ ...p })));
  }

  function reload() {
    void loadCategories().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
    void loadProducts().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
    void fetchAdminCommerce<{ items: ShopOrder[] }>("/api/admin/commerce/orders")
      .then((data) => setOrders(data.items))
      .catch((e: Error) => setError(e.message));
    void fetchAdmin<{ shopHomeBanners?: ShopHomeBanner[]; shopFeaturedProductIds?: number[] }>(
      "/api/admin/content/settings",
    )
      .then((data) => {
        setHomeBanners(data.shopHomeBanners || []);
        setFeaturedProductIds(parseShopFeaturedProductIds(data.shopFeaturedProductIds));
      })
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    reload();
  }, []);

  async function persistProducts(next: Product[]) {
    await putAdmin("/api/admin/content/products", { items: next });
    await loadProducts();
  }

  async function persistCategories(next: ProductCategory[]) {
    await putAdmin("/api/admin/content/product-categories", { items: next });
    await loadCategories();
  }

  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const activeProducts = products.filter((p) => p.active !== false);
  const lowStock = activeProducts.filter((product) => Number(product.stock || 0) <= 3).length;
  const awaitingFulfillment = orders.filter(
    (order) => order.status === "pending" || order.status === "confirmed",
  ).length;

  const defaultCategoryId = categories[0]?.id || 0;

  function openCreateProduct() {
    setDraft(emptyDraft(defaultCategoryId));
    scrollToAdminProductForm();
  }

  function openEditProduct(product: Product) {
    setDraft(productToDraft(product, categories));
  }

  function updateDraft(patch: Partial<ProductDraft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function onDraftNameChange(name: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, name };
      if (!prev.slugTouched) next.slug = slugifyFa(name);
      return next;
    });
  }

  function saveProduct(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const product = draftToProduct(draft, categories);
    if (!product.name) {
      setError("نام محصول الزامی است.");
      return;
    }

    const next = draft.id
      ? products.map((p) => (p.id === draft.id ? product : p))
      : [...products, { ...product, id: 0 }];

    void persistProducts(next)
      .then(() => {
        setDraft(null);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "ذخیره ناموفق"));
  }

  function deleteProduct(id: number) {
    if (!confirm("این محصول حذف شود؟")) return;
    void persistProducts(products.filter((p) => p.id !== id)).catch((err) =>
      setError(err instanceof Error ? err.message : "حذف ناموفق"),
    );
  }

  function openCreateCategory() {
    setCategorySlugTouched(false);
    setCategoryDraft({
      id: 0,
      name: "",
      slug: "",
      sortOrder: categories.length + 1,
      active: true,
    });
  }

  function openEditCategory(category: ProductCategory) {
    setCategorySlugTouched(true);
    setCategoryDraft({ ...category });
  }

  function saveCategory(e: FormEvent) {
    e.preventDefault();
    if (!categoryDraft) return;
    const item: ProductCategory = {
      ...categoryDraft,
      name: categoryDraft.name.trim(),
      slug: categoryDraft.slug.trim() || categoryDraft.name.trim(),
    };
    if (!item.name) {
      setError("نام دسته الزامی است.");
      return;
    }
    const next = categoryDraft.id
      ? categories.map((c) => (c.id === categoryDraft.id ? item : c))
      : [...categories, item];
    void persistCategories(next)
      .then(() => {
        setCategoryDraft(null);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "ذخیره دسته ناموفق"));
  }

  function deleteCategory(id: number) {
    if (!confirm("این دسته حذف شود؟")) return;
    void persistCategories(categories.filter((c) => c.id !== id)).catch((err) =>
      setError(err instanceof Error ? err.message : "حذف دسته ناموفق"),
    );
  }

  function updateOrderStatus(id: string, status: string) {
    void patchAdminCommerce("/api/admin/commerce/orders", { id, status })
      .then(() => reload())
      .catch((e: Error) => setError(e.message));
  }

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const productById = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const productsAvailableForFeatured = useMemo(
    () => activeProducts.filter((p) => p.id > 0 && !featuredProductIds.includes(p.id)),
    [activeProducts, featuredProductIds],
  );

  function moveFeaturedProduct(index: number, direction: -1 | 1) {
    setFeaturedProductIds((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addFeaturedProduct() {
    const id = Number(featuredAddId);
    if (!id || featuredProductIds.includes(id)) return;
    if (featuredProductIds.length >= SHOP_FEATURED_PRODUCTS_MAX) {
      setError(
        `حداکثر ${SHOP_FEATURED_PRODUCTS_MAX.toLocaleString("fa-IR")} محصول قابل انتخاب است.`,
      );
      return;
    }
    setFeaturedProductIds((prev) => [...prev, id]);
    setFeaturedAddId("");
    setError("");
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-teal-700">
            {activeProducts.length.toLocaleString("fa-IR")}
          </p>
          <p className="text-sm text-slate-500">محصول فعال</p>
        </Card>
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-blue-700">
            {orders.length.toLocaleString("fa-IR")}
          </p>
          <p className="text-sm text-slate-500">کل سفارش‌ها</p>
        </Card>
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-amber-700">
            {awaitingFulfillment.toLocaleString("fa-IR")}
          </p>
          <p className="text-sm text-slate-500">سفارش در انتظار ارسال</p>
        </Card>
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-rose-700">{formatPrice(revenue)}</p>
          <p className="text-sm text-slate-500">مبلغ سفارش‌ها</p>
        </Card>
        {lowStock ? (
          <Card
            hover={false}
            className="col-span-full border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            ⚠️ {lowStock.toLocaleString("fa-IR")} محصول موجودی پایین دارد.
          </Card>
        ) : null}
      </div>

      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-2 font-bold">بنر فروشگاه صفحه اصلی</h2>
        <p className="mb-4 text-xs text-slate-500">
          تصویر و لینک بنر پایین صفحه وب. چند اسلاید با دکمه افزودن.
        </p>
        <div className="space-y-4">
          {homeBanners.map((banner, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-2">
              <ImageUploadField
                value={banner.image}
                onChange={(path) =>
                  setHomeBanners((prev) =>
                    prev.map((item, i) => (i === index ? { ...item, image: path } : item)),
                  )
                }
              />
              <div className="space-y-2">
                <FormInput
                  value={banner.title || ""}
                  onChange={(e) =>
                    setHomeBanners((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, title: e.target.value } : item)),
                    )
                  }
                  placeholder="عنوان روی بنر (اختیاری)"
                />
                <FormInput
                  value={banner.href || ""}
                  onChange={(e) =>
                    setHomeBanners((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, href: e.target.value } : item)),
                    )
                  }
                  placeholder="لینک — مثلاً /shop"
                />
                <button
                  type="button"
                  className="text-xs font-bold text-red-600"
                  onClick={() => setHomeBanners((prev) => prev.filter((_, i) => i !== index))}
                >
                  حذف اسلاید
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setHomeBanners((prev) => [...prev, { image: "", href: "/shop", title: "" }])}
          >
            افزودن اسلاید
          </Button>
          <Button
            type="button"
            disabled={bannerSaving}
            onClick={() => {
              setBannerSaving(true);
              void putAdmin("/api/admin/content/settings", {
                shopHomeBanners: homeBanners.filter((b) => b.image.trim()),
              })
                .then(() => setError(""))
                .catch((e) => setError(e instanceof Error ? e.message : "ذخیره بنر ناموفق"))
                .finally(() => setBannerSaving(false));
            }}
          >
            {bannerSaving ? "…" : "ذخیره بنرها"}
          </Button>
        </div>
      </Card>

      <Card hover={false} className="bg-white p-6">
        <h2 className="mb-2 font-bold">محصولات پرفروش صفحه اصلی</h2>
        <p className="mb-4 text-xs text-slate-500">
          حداکثر {SHOP_FEATURED_PRODUCTS_MAX.toLocaleString("fa-IR")} محصول — ترتیب لیست زیر =
          ترتیب نمایش در صفحه وب.
        </p>
        <div className="space-y-2">
          {featuredProductIds.length ? (
            featuredProductIds.map((id, index) => {
              const product = productById.get(id);
              return (
                <div
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {product ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={productThumbnail(product)}
                          className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                          alt=""
                        />
                        <span className="truncate font-bold text-slate-900">{product.name}</span>
                      </>
                    ) : (
                      <span className="font-bold text-amber-700">
                        محصول #{id.toLocaleString("fa-IR")} (حذف‌شده)
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 disabled:opacity-40"
                      disabled={index === 0}
                      onClick={() => moveFeaturedProduct(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 disabled:opacity-40"
                      disabled={index === featuredProductIds.length - 1}
                      onClick={() => moveFeaturedProduct(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs font-bold text-red-600"
                      onClick={() =>
                        setFeaturedProductIds((prev) => prev.filter((itemId) => itemId !== id))
                      }
                    >
                      حذف
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              هنوز محصولی انتخاب نشده — بلوک «محصولات پرفروش» در صفحه اصلی نمایش داده نمی‌شود.
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="min-w-[14rem] flex-1">
            <FormSelect
              value={featuredAddId}
              onChange={(e) => setFeaturedAddId(e.target.value)}
              disabled={
                !productsAvailableForFeatured.length ||
                featuredProductIds.length >= SHOP_FEATURED_PRODUCTS_MAX
              }
            >
              <option value="">افزودن محصول…</option>
              {productsAvailableForFeatured.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={
              !featuredAddId ||
              featuredProductIds.length >= SHOP_FEATURED_PRODUCTS_MAX
            }
            onClick={addFeaturedProduct}
          >
            افزودن
          </Button>
          <Button
            type="button"
            disabled={featuredSaving}
            onClick={() => {
              setFeaturedSaving(true);
              void putAdmin("/api/admin/content/settings", {
                shopFeaturedProductIds: featuredProductIds,
              })
                .then(() => setError(""))
                .catch((e) =>
                  setError(e instanceof Error ? e.message : "ذخیره محصولات پرفروش ناموفق"),
                )
                .finally(() => setFeaturedSaving(false));
            }}
          >
            {featuredSaving ? "…" : "ذخیره پرفروش‌ها"}
          </Button>
        </div>
      </Card>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">دسته‌بندی محصولات</h2>
          <Button type="button" variant="primary" className="text-sm" onClick={openCreateCategory}>
            + دسته جدید
          </Button>
        </div>
        <AdminTable
          headers={["نام", "slug", "ترتیب", "وضعیت", "عملیات"]}
          empty="دسته‌ای ثبت نشده است."
        >
          {categories.map((c) => (
            <tr key={c.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-bold">{c.name}</td>
              <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                {c.slug}
              </td>
              <td className="px-4 py-3">{c.sortOrder.toLocaleString("fa-IR")}</td>
              <td className="px-4 py-3">
                <AdminBadge tone={c.active ? "success" : "warn"}>
                  {c.active ? "فعال" : "غیرفعال"}
                </AdminBadge>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="ml-3 text-xs font-bold text-teal-700"
                  onClick={() => openEditCategory(c)}
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => deleteCategory(c.id)}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      {categoryDraft ? (
        <Card hover={false} className="max-w-xl bg-white p-6">
          <h3 className="mb-4 font-bold">
            {categoryDraft.id ? "ویرایش دسته" : "افزودن دسته"}
          </h3>
          <form onSubmit={saveCategory} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormInput
              value={categoryDraft.name}
              onChange={(e) => {
                const name = e.target.value;
                setCategoryDraft({
                  ...categoryDraft,
                  name,
                  slug: categorySlugTouched ? categoryDraft.slug : name.trim(),
                });
              }}
              placeholder="نام دسته"
              required
            />
            <FormInput
              dir="ltr"
              value={categoryDraft.slug}
              onChange={(e) => {
                setCategorySlugTouched(true);
                setCategoryDraft({ ...categoryDraft, slug: e.target.value });
              }}
              placeholder="slug — پیش‌فرض همان نام دسته"
              required
            />
            <DraftNumberInput
              min={0}
              max={9999}
              value={categoryDraft.sortOrder}
              onCommit={(sortOrder) => setCategoryDraft({ ...categoryDraft, sortOrder })}
              placeholder="ترتیب"
            />
            <FormSelect
              value={categoryDraft.active ? "1" : "0"}
              onChange={(e) =>
                setCategoryDraft({ ...categoryDraft, active: e.target.value === "1" })
              }
            >
              <option value="1">فعال</option>
              <option value="0">غیرفعال</option>
            </FormSelect>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" variant="primary" className="text-sm">
                ذخیره دسته
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-sm"
                onClick={() => setCategoryDraft(null)}
              >
                انصراف
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">محصولات فروشگاه</h2>
          <Button type="button" className="text-sm" onClick={openCreateProduct}>
            + محصول جدید
          </Button>
        </div>
        <AdminTable
          headers={["محصول", "دسته", "قیمت", "درصد", "سایز", "موجودی", "وضعیت", "عملیات"]}
          empty="محصولی ثبت نشده است."
        >
          {products.map((p) => (
            <tr key={p.id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productThumbnail(p)}
                    className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
                    alt=""
                  />
                  <div>
                    <span className="font-bold">{p.name}</span>
                    <p className="text-xs text-slate-500" dir="ltr">
                      {p.slug}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {p.categoryId ? categoryNameById.get(p.categoryId) || p.category : p.category}
              </td>
              <td className="px-4 py-3">{p.price} تومان</td>
              <td className="px-4 py-3">
                {(p.discountPercent ?? 0) > 0
                  ? `${Number(p.discountPercent).toLocaleString("fa-IR")}٪`
                  : "—"}
              </td>
              <td className="px-4 py-3">{p.size?.trim() || "—"}</td>
              <td className="px-4 py-3">
                <AdminBadge
                  tone={
                    Number(p.stock || 0) > 3
                      ? "success"
                      : Number(p.stock || 0) > 0
                        ? "warn"
                        : "danger"
                  }
                >
                  {Number(p.stock || 0).toLocaleString("fa-IR")}
                </AdminBadge>
              </td>
              <td className="px-4 py-3">
                <AdminBadge tone={p.active !== false ? "success" : "warn"}>
                  {p.active !== false ? "فعال" : "غیرفعال"}
                </AdminBadge>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="ml-3 text-xs font-bold text-teal-700"
                  onClick={() => openEditProduct(p)}
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => deleteProduct(p.id)}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      {draft ? (
        <div id="admin-product-form">
        <Card hover={false} className="max-w-3xl bg-white p-6">
          <h2 className="mb-4 font-bold">{draft.id ? "ویرایش محصول" : "افزودن محصول"}</h2>
          <form onSubmit={saveProduct} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormInput
              value={draft.name}
              onChange={(e) => onDraftNameChange(e.target.value)}
              placeholder="نام محصول"
              required
            />
            <FormInput
              dir="ltr"
              value={draft.slug}
              onChange={(e) => updateDraft({ slug: e.target.value, slugTouched: true })}
              placeholder="slug"
              required
            />
            <DraftNumberInput
              min={0}
              max={999_999_999}
              value={draft.priceNum}
              onCommit={(priceNum) =>
                updateDraft({
                  priceNum,
                  price: priceNum > 0 ? priceNum.toLocaleString("fa-IR") : draft.price,
                })
              }
              placeholder="قیمت (تومان)"
            />
            <FormSelect
              value={String(draft.categoryId)}
              onChange={(e) => updateDraft({ categoryId: parseInt(e.target.value, 10) || 0 })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FormSelect>
            <DraftNumberInput
              min={0}
              max={100}
              value={draft.discountPercent}
              onCommit={(discountPercent) => updateDraft({ discountPercent })}
              placeholder="درصد (مثلاً ۲ یا ۴)"
            />
            <FormInput
              value={draft.size}
              onChange={(e) => updateDraft({ size: e.target.value })}
              placeholder="سایز — مثلاً ۲۵"
            />
            <DraftNumberInput
              min={0}
              max={999_999}
              value={draft.stock}
              onCommit={(stock) => updateDraft({ stock })}
              placeholder="موجودی"
            />
            <DraftNumberInput
              min={0}
              max={9999}
              value={draft.sortOrder}
              onCommit={(sortOrder) => updateDraft({ sortOrder })}
              placeholder="ترتیب نمایش"
            />
            <FormSelect
              value={draft.active ? "1" : "0"}
              onChange={(e) => updateDraft({ active: e.target.value === "1" })}
            >
              <option value="1">فعال</option>
              <option value="0">غیرفعال</option>
            </FormSelect>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <span className="font-bold text-slate-700">توضیحات</span>
            </label>
            <textarea
              value={draft.description}
              onChange={(e) => updateDraft({ description: e.target.value })}
              placeholder="توضیحات محصول برای صفحه جزئیات"
              className="min-h-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-bold text-slate-700">تصاویر محصول</p>
              <MultiImageUploadField
                values={draft.images}
                onChange={(images) => updateDraft({ images })}
                diskOnly
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" className="text-sm">
                {draft.id ? "ذخیره تغییرات" : "افزودن محصول"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-sm"
                onClick={() => setDraft(null)}
              >
                انصراف
              </Button>
            </div>
          </form>
        </Card>
        </div>
      ) : null}

      <div>
        <h2 className="mb-4 text-lg font-bold">سفارش‌های فروشگاه</h2>
        <AdminTable
          headers={["کد سفارش", "مشتری", "نوع", "اقلام", "مبلغ", "وضعیت"]}
          empty="هنوز سفارشی ثبت نشده است."
        >
          {orders.map((order) => {
            const items = (order.items as OrderItem[] | undefined) || [];
            return (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                <td className="px-4 py-3">
                  {String(order.customerName || "—")}
                  <br />
                  <span className="text-xs text-slate-500">
                    {String(order.customerPhone || "—")}
                  </span>
                </td>
                <td className="px-4 py-3">{String(order.customerTypeLabel || "—")}</td>
                <td className="px-4 py-3 text-xs">
                  {items.map((item) => `${item.name} × ${item.qty}`).join("، ") || "—"}
                </td>
                <td className="px-4 py-3 font-bold text-teal-700">
                  {formatPrice(Number(order.total || 0))} تومان
                </td>
                <td className="px-4 py-3">
                  <FormSelect
                    className="py-1 text-xs"
                    value={String(order.status || "pending")}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  >
                    <option value="pending">در انتظار</option>
                    <option value="confirmed">تأیید شده</option>
                    <option value="shipped">ارسال شده</option>
                    <option value="cancelled">لغو شده</option>
                  </FormSelect>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </div>
    </div>
  );
}
