"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { usePatientProfile } from "@/lib/auth/use-patient-profile";
import type { Product } from "@/lib/data";
import { getSavedShopAddress, saveShopAddress } from "@/lib/shop/delivery-storage";
import { ShopCart } from "@/lib/shop";
import { normalizePhone } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ShopCartSkeleton } from "./ShopProductSkeleton";
import { shopRoutes, type ShopVariant } from "./types";

type CartLine = { product: Product; qty: number };

export function ShopCartView({ variant = "web" }: { variant?: ShopVariant }) {
  const router = useRouter();
  const routes = shopRoutes(variant);
  const { profile } = usePatientProfile();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ subtotal: 0, total: 0, count: 0 });

  function refresh() {
    const products = ShopCart.getProductsCache();
    const cart = ShopCart.getCart();
    setLines(
      cart
        .map((item) => {
          const product = products.find((p) => String(p.id) === String(item.id));
          return product ? { product, qty: item.qty } : null;
        })
        .filter((x): x is CartLine => Boolean(x)),
    );
    setTotals(ShopCart.getCartTotals());
  }

  useEffect(() => {
    void ShopCart.loadProducts()
      .then(() => refresh())
      .finally(() => setLoading(false));
    setAddress(getSavedShopAddress());
    const vipPhone = ShopCart.getVipPhone();
    if (vipPhone) setPhone(vipPhone);
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (profile.name?.trim()) setName(profile.name.trim());
    if (profile.phone?.trim()) setPhone(profile.phone.trim());
  }, [profile]);

  function changeQty(id: number, delta: number) {
    ShopCart.changeQty(id, delta);
    refresh();
  }

  function clear() {
    ShopCart.clearCart();
    refresh();
    setMessage("سبد پاک شد");
  }

  function checkout(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || normalizePhone(phone).length < 10) {
      setMessage("نام و موبایل را کامل وارد کنید");
      return;
    }
    if (address.trim().length < 5) {
      setMessage("آدرس تحویل را وارد کنید");
      return;
    }

    setPaying(true);
    setMessage("");

    const basePath = variant === "app" ? "/app/shop" : "/shop";
    void ShopCart.checkoutWithPaymentAsync({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      basePath,
      successTo: routes.success,
      returnTo: routes.cart,
    })
      .then((result) => {
        if (!result.ok) {
          setMessage(result.message || "خطا در پرداخت");
          setPaying(false);
          return;
        }
        saveShopAddress(address.trim());
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }
        router.push(routes.success);
      })
      .catch(() => {
        setMessage("خطا در اتصال به درگاه");
        setPaying(false);
      });
  }

  const discount = totals.subtotal - totals.total;

  const shellClass = variant === "web" ? "mx-auto max-w-xl px-4 py-10 sm:px-6" : "";

  if (loading) {
    return (
      <div className={shellClass}>
        {variant === "web" ? (
          <h1 className="mb-6 text-2xl font-bold text-slate-900">سبد سفارش</h1>
        ) : null}
        <ShopCartSkeleton />
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className={variant === "web" ? "mx-auto max-w-xl px-4 py-10" : ""}>
        <Card hover={false} className="p-8 text-center">
          <p className="font-bold text-slate-800">سبد خرید خالی است</p>
          <Button href={routes.catalog} className="mt-4 w-full">
            مشاهده محصولات
          </Button>
        </Card>
      </div>
    );
  }

  const body = (
    <>
      <div className="mb-4 space-y-3">
        {lines.map(({ product, qty }) => (
          <Card key={product.id} hover={false} className="flex items-center justify-between gap-3 p-3">
            <div className="flex-1">
              <p className="text-sm font-bold">{product.name}</p>
              <p className="text-sm font-bold text-teal-700">
                {ShopCart.formatPrice(ShopCart.getFinalProductPrice(product))} تومان
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white font-bold"
                onClick={() => changeQty(product.id, -1)}
              >
                −
              </button>
              <span className="font-bold">{qty.toLocaleString("fa-IR")}</span>
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white font-bold"
                onClick={() => changeQty(product.id, 1)}
              >
                +
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Card hover={false} className="mb-4 space-y-2 p-4 text-sm">
        <div className="flex justify-between">
          <span>تعداد</span>
          <strong>{totals.count.toLocaleString("fa-IR")}</strong>
        </div>
        <div className="flex justify-between">
          <span>جمع</span>
          <strong>{ShopCart.formatPrice(totals.subtotal)} تومان</strong>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between text-teal-700">
            <span>تخفیف VIP</span>
            <strong>{ShopCart.formatPrice(discount)} تومان</strong>
          </div>
        ) : null}
        <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 font-bold">
          <span>مبلغ نهایی</span>
          <span className="text-teal-700">
            {ShopCart.formatPrice(totals.total)} تومان
          </span>
        </div>
      </Card>

      <form onSubmit={checkout} className="space-y-3">
        <p className="font-bold text-slate-900">اطلاعات تحویل</p>
        {profile ? (
          <p className="text-xs text-teal-700">نام و موبایل از پروفایل شما پر شده‌اند.</p>
        ) : null}
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
        <div>
          <FormLabel>آدرس / توضیحات سفارش</FormLabel>
          <FormTextarea
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        {message ? <p className="text-sm font-bold text-amber-800">{message}</p> : null}
        <Button type="submit" variant="primary" className="w-full" disabled={paying}>
          {paying ? "در حال انتقال به درگاه..." : "پرداخت و تکمیل سفارش"}
        </Button>
      </form>

      <button
        type="button"
        onClick={clear}
        className="mt-4 w-full text-center text-sm font-bold text-red-600"
      >
        پاک کردن سبد
      </button>
    </>
  );

  if (variant === "app") return <div>{body}</div>;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">سبد سفارش</h1>
      {body}
    </div>
  );
}
