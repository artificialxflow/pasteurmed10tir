"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel } from "@/components/ui/Card";
import { fetchAdmin, putAdmin } from "@/lib/content/client";
import { fetchAdminOps, patchAdminOps } from "@/lib/operations/client";
import {
  DEFAULT_BASE_INSURANCES,
  DEFAULT_COMPLEMENTARY_INSURANCES,
  type InsuranceCompany,
  type InsuranceInquiry,
} from "@/lib/patient";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

function normalizeItem(i: InsuranceCompany): InsuranceCompany {
  return {
    id: i.id,
    name: i.name,
    active: i.active !== false,
    showOnSite: Boolean(i.showOnSite),
    logoUrl: i.logoUrl || "",
  };
}

export default function AdminInsurancesPage() {
  const [base, setBase] = useState<InsuranceCompany[]>([]);
  const [comp, setComp] = useState<InsuranceCompany[]>([]);
  const [inquiries, setInquiries] = useState<InsuranceInquiry[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"base" | "comp">("comp");
  const [message, setMessage] = useState("");

  function reload() {
    void fetchAdmin<{ base: InsuranceCompany[]; complementary: InsuranceCompany[] }>(
      "/api/admin/content/insurances",
    )
      .then((data) => {
        setBase((data.base || []).map(normalizeItem));
        setComp((data.complementary || []).map(normalizeItem));
      })
      .catch(() => {});
    void fetchAdminOps<{ items: InsuranceInquiry[] }>("/api/admin/operations/insurance-inquiries")
      .then((data) => setInquiries(data.items))
      .catch(() => setInquiries([]));
  }

  useEffect(() => {
    reload();
  }, []);

  function persist(nextBase: InsuranceCompany[], nextComp: InsuranceCompany[], msg?: string) {
    void putAdmin("/api/admin/content/insurances", {
      base: nextBase.map(normalizeItem),
      complementary: nextComp.map(normalizeItem),
    })
      .then(() => {
        if (msg) setMessage(msg);
        reload();
      })
      .catch((e: Error) => setMessage(e.message));
  }

  function addCompany(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const item: InsuranceCompany = {
      id: `ins-${Date.now().toString(36)}`,
      name: name.trim(),
      active: true,
      showOnSite: true,
      logoUrl: "",
    };
    const nextBase = kind === "base" ? [...base, item] : base;
    const nextComp = kind === "comp" ? [...comp, item] : comp;
    persist(nextBase, nextComp, "بیمه افزوده شد.");
    setName("");
  }

  function applyDefaults() {
    persist(
      DEFAULT_BASE_INSURANCES.map(normalizeItem),
      DEFAULT_COMPLEMENTARY_INSURANCES.map(normalizeItem),
      "لیست پیش‌فرض v17 (پایه + تکمیلی + نمایش سایت) اعمال شد.",
    );
  }

  function updateRow(
    list: "base" | "comp",
    id: string,
    patch: Partial<InsuranceCompany>,
  ) {
    if (list === "base") {
      const next = base.map((i) => (i.id === id ? { ...i, ...patch } : i));
      setBase(next);
      persist(next, comp);
    } else {
      const next = comp.map((i) => (i.id === id ? { ...i, ...patch } : i));
      setComp(next);
      persist(base, next);
    }
  }

  function InsuranceList({
    title,
    list,
    kindKey,
  }: {
    title: string;
    list: InsuranceCompany[];
    kindKey: "base" | "comp";
  }) {
    return (
      <Card hover={false} className="p-4">
        <h3 className="mb-3 font-extrabold text-slate-900">{title}</h3>
        <ul className="space-y-3">
          {list.map((i) => (
            <li
              key={i.id}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-slate-900">{i.name}</span>
                <span className="font-mono text-[0.65rem] text-slate-400">{i.id}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={i.active !== false}
                    onChange={(e) => updateRow(kindKey, i.id, { active: e.target.checked })}
                  />
                  فعال (دراپ‌داون بیمار)
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={Boolean(i.showOnSite)}
                    onChange={(e) => updateRow(kindKey, i.id, { showOnSite: e.target.checked })}
                  />
                  نمایش در سایت
                </label>
              </div>
              <div className="mt-2">
                <FormLabel>آدرس لوگو (اختیاری)</FormLabel>
                <FormInput
                  className="text-xs"
                  dir="ltr"
                  value={i.logoUrl || ""}
                  placeholder="/uploads/insurance-logo.png"
                  onChange={(e) => {
                    const logoUrl = e.target.value;
                    if (kindKey === "base") {
                      setBase((prev) =>
                        prev.map((row) => (row.id === i.id ? { ...row, logoUrl } : row)),
                      );
                    } else {
                      setComp((prev) =>
                        prev.map((row) => (row.id === i.id ? { ...row, logoUrl } : row)),
                      );
                    }
                  }}
                  onBlur={(e) => updateRow(kindKey, i.id, { logoUrl: e.target.value.trim() })}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {message ? <p className="text-sm text-teal-800">{message}</p> : null}

      <Card hover={false} className="border-cyan-100 bg-cyan-50/50 p-4 text-sm leading-7 text-slate-700">
        <strong>نمایش در سایت</strong> فقط سکشن «بیمه‌های تحت پوشش» صفحه اصلی/`/app` را پر می‌کند و با
        دراپ‌داون بیمار (<strong>فعال</strong>) جداست. تا لوگو: نام نوشتاری کافی است.
      </Card>

      <Card hover={false} className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-extrabold">افزودن شرکت بیمه</h2>
          <Button type="button" variant="outline" className="text-xs" onClick={applyDefaults}>
            اعمال لیست پیش‌فرض v17
          </Button>
        </div>
        <form onSubmit={addCompany} className="flex flex-wrap gap-3">
          <FormInput
            className="max-w-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام بیمه"
            required
          />
          <select
            className="rounded-xl border border-sky-200 px-3 py-2 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as "base" | "comp")}
          >
            <option value="comp">تکمیلی</option>
            <option value="base">پایه</option>
          </select>
          <Button type="submit" className="text-sm">
            افزودن
          </Button>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsuranceList title="پایه" list={base} kindKey="base" />
        <InsuranceList title="تکمیلی" list={comp} kindKey="comp" />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-extrabold">درخواست‌های استعلام بیمه</h2>
        <p className="mb-3 text-sm leading-7 text-slate-600">
          تأیید استعلام پرداخت جدا از «تأیید کاربری / فرانشیز» است.{" "}
          <Link href="/admin/patients" className="font-bold text-teal-700 underline-offset-2 hover:underline">
            رفتن به تأیید کاربری →
          </Link>
        </p>
        <AdminTable headers={["بیمار", "موبایل", "فرانشیز٪", "وضعیت", "عملیات"]} empty="استعلامی نیست.">
          {inquiries.map((inq) => (
            <tr key={inq.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{inq.patientName || "—"}</td>
              <td className="px-4 py-3">{inq.phone}</td>
              <td className="px-4 py-3">
                {(inq.franchisePercent ?? 0).toLocaleString("fa-IR")}٪
                {inq.visitFee ? ` از ${formatPrice(inq.visitFee)}` : ""}
              </td>
              <td className="px-4 py-3">
                <AdminBadge
                  tone={
                    inq.status === "approved"
                      ? "success"
                      : inq.status === "rejected"
                        ? "danger"
                        : "warn"
                  }
                >
                  {inq.status}
                </AdminBadge>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2 text-xs font-bold">
                  <button
                    type="button"
                    className="text-teal-700"
                    onClick={() => {
                      void patchAdminOps("/api/admin/operations/insurance-inquiries", {
                        id: inq.id,
                        status: "approved",
                      }).then(() => reload());
                    }}
                  >
                    تأیید
                  </button>
                  <button
                    type="button"
                    className="text-red-700"
                    onClick={() => {
                      void patchAdminOps("/api/admin/operations/insurance-inquiries", {
                        id: inq.id,
                        status: "rejected",
                      }).then(() => reload());
                    }}
                  >
                    رد
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}
