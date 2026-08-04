"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormSelect } from "@/components/ui/Card";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import { fetchAdminCommerce, patchAdminCommerce } from "@/lib/commerce/client";
import { type Product } from "@/lib/data";
import { type ShopOrder } from "@/lib/storage";
import { FormEvent, useEffect, useState } from "react";

function formatPrice(num: number) {
  return Number(num || 0).toLocaleString("fa-IR");
}

function parsePrice(value: string) {
  const normalized = String(value || "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  return Number(normalized.replace(/[^\d]/g, "")) || 0;
}

type OrderItem = { name?: string; qty?: number };

export default function AdminShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("دندانپزشکی");
  const [stock, setStock] = useState("10");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  async function loadProducts() {
    const data = await fetchAdmin<{ items: Product[] }>("/api/admin/content/products");
    setProducts(data.items.map((p) => ({ ...p })));
  }

  function reload() {
    void loadProducts().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
    void fetchAdminCommerce<{ items: ShopOrder[] }>("/api/admin/commerce/orders")
      .then((data) => setOrders(data.items))
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    reload();
  }, []);

  async function persistProducts(next: Product[]) {
    await putAdmin("/api/admin/content/products", { items: next });
    await loadProducts();
  }

  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const lowStock = products.filter((product) => Number(product.stock || 0) <= 3).length;
  const pending = orders.filter((order) => order.status === "pending").length;

  function addProduct(e: FormEvent) {
    e.preventDefault();
    void persistProducts([
      ...products,
      {
        id: 0,
        name: name.trim(),
        price: price.trim(),
        priceNum: parsePrice(price),
        category,
        stock: parseInt(stock, 10) || 0,
        image: image.trim() || "/uploads/placeholder.svg",
      },
    ])
      .then(() => {
        setName("");
        setPrice("");
        setCategory("دندانپزشکی");
        setStock("10");
        setImage("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "افزودن ناموفق"));
  }

  function deleteProduct(index: number) {
    void persistProducts(products.filter((_, i) => i !== index)).catch((e) =>
      setError(e instanceof Error ? e.message : "حذف ناموفق"),
    );
  }

  function updateOrderStatus(id: string, status: string) {
    void patchAdminCommerce("/api/admin/commerce/orders", { id, status })
      .then(() => reload())
      .catch((e: Error) => setError(e.message));
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-teal-700">
            {products.length.toLocaleString("fa-IR")}
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
            {pending.toLocaleString("fa-IR")}
          </p>
          <p className="text-sm text-slate-500">سفارش در انتظار</p>
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

      <div>
        <h2 className="mb-4 text-lg font-bold">محصولات فروشگاه</h2>
        <AdminTable
          headers={["محصول", "دسته", "قیمت", "موجودی", "عملیات"]}
          empty="محصولی ثبت نشده است."
        >
          {products.map((p, i) => (
            <tr key={p.id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
                    alt=""
                  />
                  <span className="font-bold">{p.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">{p.category}</td>
              <td className="px-4 py-3">{p.price} تومان</td>
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
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => deleteProduct(i)}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <Card hover={false} className="max-w-3xl bg-white p-6">
        <h2 className="mb-4 font-bold">افزودن محصول</h2>
        <form onSubmit={addProduct} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام محصول"
            required
          />
          <FormInput
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="قیمت نمایشی مثل ۱,۲۰۰,۰۰۰"
            required
          />
          <FormSelect value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>دندانپزشکی</option>
            <option>پزشکی</option>
          </FormSelect>
          <FormInput
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="موجودی"
          />
          <ImageUploadField
            value={image}
            onChange={setImage}
            placeholder="تصویر محصول — /uploads/... یا آپلود"
            className="sm:col-span-2"
          />
          <Button type="submit" className="w-full text-sm sm:col-span-2">
            افزودن محصول
          </Button>
        </form>
      </Card>
    </div>
  );
}
