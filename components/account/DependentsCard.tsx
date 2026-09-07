"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import {
  DEPENDENT_RELATION_LABELS,
  DEPENDENT_RELATIONS,
} from "@/lib/dependents";
import { fetchPatientOps, postPatientOps } from "@/lib/operations/client";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Dependent = {
  id: string;
  name: string;
  nationalId?: string;
  birthDate?: string;
  relation: string;
  fileNumber?: string;
};

export function DependentsCard() {
  const [items, setItems] = useState<Dependent[]>([]);
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [relation, setRelation] = useState("child");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    void fetchPatientOps<{ items: Dependent[] }>("/api/auth/dependents")
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await postPatientOps("/api/auth/dependents", {
        name,
        nationalId,
        birthDate: birthDate || undefined,
        relation,
      });
      setName("");
      setNationalId("");
      setBirthDate("");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت ناموفق");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/dependents/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "حذف ناموفق");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف ناموفق");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card hover={false} className="space-y-4 p-4">
      <div>
        <p className="font-extrabold text-slate-900">افراد تحت تکفل من</p>
        <p className="mt-1 text-sm leading-7 text-slate-600">
          کودک یا همراه بدون موبایل جداگانه. نوبت و پیامک با شماره شما ثبت می‌شود. وام و کارت
          اعتباری برای این افراد ساخته نمی‌شود.
        </p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <FormLabel>نام</FormLabel>
          <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <FormLabel>نسبت</FormLabel>
          <FormSelect value={relation} onChange={(e) => setRelation(e.target.value)}>
            {DEPENDENT_RELATIONS.map((r) => (
              <option key={r} value={r}>
                {DEPENDENT_RELATION_LABELS[r]}
              </option>
            ))}
          </FormSelect>
        </div>
        <div>
          <FormLabel>کد ملی</FormLabel>
          <FormInput value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
        </div>
        <div>
          <FormLabel>تاریخ تولد</FormLabel>
          <FormInput type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
        {error ? <p className="sm:col-span-2 text-sm font-bold text-rose-600">{error}</p> : null}
        <Button type="submit" disabled={busy} className="sm:col-span-2">
          {busy ? "…" : "افزودن فرد تحت تکفل"}
        </Button>
      </form>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm"
        >
          <span>
            <strong>{item.name}</strong>{" "}
            <span className="text-slate-500">
              {DEPENDENT_RELATION_LABELS[item.relation as keyof typeof DEPENDENT_RELATION_LABELS] ||
                item.relation}
              {item.fileNumber ? ` · پرونده ${item.fileNumber}` : ""}
            </span>
          </span>
          <button type="button" className="text-xs font-bold text-rose-700" onClick={() => void remove(item.id)}>
            حذف
          </button>
        </div>
      ))}
    </Card>
  );
}
