"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { checkShopVipApi, createFacilityRequestApi } from "@/lib/commerce/client";
import { PASTEUR_DATA } from "@/lib/data";
import { ShopCart } from "@/lib/shop";
import { normalizePhone } from "@/lib/utils";
import { useEffect, useState, type FormEvent } from "react";
import { shopRoutes, type ShopVariant } from "./types";

export function ShopFacility({ variant = "web" }: { variant?: ShopVariant }) {
  const routes = shopRoutes(variant);
  const [isVip, setIsVip] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const p = ShopCart.getVipPhone();
    if (p) setPhone(p);
    if (p && ShopCart.getCustomerType() === "vip") {
      void checkShopVipApi(p).then((data) => setIsVip(data.vip)).catch(() => setIsVip(false));
    }
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || normalizePhone(phone).length < 10) {
      setMessage("نام و موبایل را کامل وارد کنید");
      return;
    }
    if (nationalId.replace(/\D/g, "").length !== 10) {
      setMessage("کد ملی ۱۰ رقمی الزامی است");
      return;
    }
    void createFacilityRequestApi({
      name: name.trim(),
      phone: phone.trim(),
      nationalId: nationalId.trim(),
      amount: amount.trim(),
      description: note.trim(),
    })
      .then(() => {
        setMessage("درخواست ثبت شد");
        setName("");
        setAmount("");
        setNote("");
        const p = ShopCart.getVipPhone();
        if (p) setPhone(p);
      })
      .catch((err: Error) => setMessage(err.message || "ثبت ناموفق"));
  }

  const body = !isVip ? (
    <Card hover={false} className="p-6">
      <p className="text-sm text-slate-700">
        برای درخواست تسهیلات ابتدا VIP تجهیزات را فعال کنید.
      </p>
      <Button href={routes.vip} className="mt-4 w-full">
        فعال‌سازی VIP
      </Button>
    </Card>
  ) : (
    <form onSubmit={onSubmit} className="space-y-4">
      <section
        className={
          variant === "app"
            ? "rounded-2xl border border-sky-200 bg-cyan-50 p-4"
            : "rounded-[1.25rem] border border-sky-200 bg-cyan-50 p-5"
        }
      >
        <p className="font-bold text-slate-900">{PASTEUR_DATA.shopVip.facilityTitle}</p>
        <ul className="mt-3 list-disc space-y-1 pr-4 text-xs text-slate-600">
          {PASTEUR_DATA.shopVip.facilityTerms.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <div>
        <FormLabel>نام</FormLabel>
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
        <FormLabel>کد ملی</FormLabel>
        <FormInput
          required
          inputMode="numeric"
          maxLength={10}
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
          placeholder="برای اعتبارسنجی الزامی است"
        />
      </div>
      <div>
        <FormLabel>مبلغ درخواستی (تومان)</FormLabel>
        <FormInput
          type="number"
          min={1000000}
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div>
        <FormLabel>توضیحات / نام تجهیز</FormLabel>
        <FormTextarea value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {message ? <p className="text-sm font-bold text-teal-700">{message}</p> : null}
      <Button type="submit" variant="primary" className="w-full">
        ثبت درخواست
      </Button>
    </form>
  );

  if (variant === "app") return <div>{body}</div>;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">تسهیلات تجهیزات</h1>
      <p className="mb-6 text-sm text-slate-600">فقط برای مشتریان VIP</p>
      {body}
    </div>
  );
}
