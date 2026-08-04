"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel } from "@/components/ui/Card";
import { checkShopVipApi } from "@/lib/commerce/client";
import { PASTEUR_DATA } from "@/lib/data";
import { ShopCart } from "@/lib/shop";
import { PasteurStorage } from "@/lib/storage";
import { normalizePhone } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { shopRoutes, type ShopVariant } from "./types";

export function ShopVip({ variant = "web" }: { variant?: ShopVariant }) {
  const router = useRouter();
  const routes = shopRoutes(variant);
  const vip = PASTEUR_DATA.shopVip;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [referral, setReferral] = useState("");
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    const saved = ShopCart.getVipPhone();
    if (saved) setPhone(saved);
    if (saved) {
      void checkShopVipApi(saved).then((data) => {
        if (data.vip) {
          setActive(true);
          ShopCart.setCustomerType("vip", saved);
        }
      });
    }
  }, []);

  function showActive(p: string) {
    ShopCart.setCustomerType("vip", p);
    setActive(true);
    setPhone(p);
  }

  function checkVip() {
    const p = phone.trim();
    if (normalizePhone(p).length < 10) {
      setMessage("شماره موبایل را وارد کنید");
      return;
    }
    void checkShopVipApi(p).then((data) => {
      if (data.vip) {
        showActive(p);
        setMessage("VIP فعال — در حال انتقال...");
        setTimeout(() => router.push(routes.catalog), 800);
      } else {
        setMessage("برای این شماره VIP فعال نیست");
      }
    });
  }

  function payVip(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const p = phone.trim();
    if (n.length < 2 || normalizePhone(p).length < 10) {
      setMessage("نام و موبایل را کامل وارد کنید");
      return;
    }
    PasteurStorage.setPendingPayment({
      kind: "shop-vip",
      planId: "shop-vip",
      planName: vip.planName,
      amount: vip.priceNum,
      amountToman: vip.priceNum,
      patientName: n,
      patientPhone: p,
      referralCode: referral.trim().toUpperCase(),
      successTo: `${routes.catalog}?vip=paid`,
      returnTo: routes.vip,
    });
    router.push(routes.confirm);
  }

  const shell = (
    <>
      <section
        className={
          variant === "app"
            ? "mb-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-orange-50 to-white p-4"
            : "mb-6 rounded-[1.25rem] border border-amber-200 bg-gradient-to-br from-orange-50 to-white p-6"
        }
      >
        <p className="text-lg font-extrabold text-slate-900">💎 VIP تجهیزات</p>
        <p className="mt-1 text-sm text-slate-600">{vip.facilityTitle}</p>
        <p className="mt-3 text-sm text-slate-700">
          هزینه عضویت: <strong>{vip.price}</strong> تومان
        </p>
      </section>

      {active ? (
        <Card hover={false} className="mb-4 border-green-200 bg-green-50 p-5">
          <p className="font-bold text-teal-800">عضویت VIP فعال است</p>
          <p className="mt-2 text-sm text-slate-600">موبایل: {phone}</p>
          <Button href={routes.catalog} className="mt-4 w-full">
            رفتن به محصولات
          </Button>
        </Card>
      ) : (
        <form onSubmit={payVip} className="space-y-4">
          <p className="font-bold text-slate-900">فعال‌سازی VIP</p>
          <div>
            <FormLabel>نام و نام خانوادگی</FormLabel>
            <FormInput required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <FormLabel>شماره موبایل</FormLabel>
            <FormInput
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <FormLabel>کد معرف ویزیتور (اختیاری)</FormLabel>
            <FormInput value={referral} onChange={(e) => setReferral(e.target.value)} />
          </div>
          <ul className="list-disc space-y-1 pr-4 text-xs text-slate-500">
            {vip.facilityTerms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {message ? <p className="text-sm font-bold text-amber-800">{message}</p> : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button type="button" variant="accent" onClick={checkVip}>
              قبلاً VIP هستم
            </Button>
            <Button type="submit" variant="primary">
              پرداخت VIP
            </Button>
          </div>
        </form>
      )}
    </>
  );

  if (variant === "app") return <div>{shell}</div>;

  return <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">{shell}</div>;
}
