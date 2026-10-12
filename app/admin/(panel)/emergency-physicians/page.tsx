"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel } from "@/components/ui/Card";
import { deleteAdminOps, fetchAdminOps, postAdminOps } from "@/lib/operations/client";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Row = { id: string; name: string; active: boolean; sortOrder: number };

export default function AdminEmergencyPhysiciansPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    void fetchAdminOps<{ items: Row[] }>("/api/admin/operations/emergency-physicians")
      .then((data) => setItems(data.items))
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function add(e: FormEvent) {
    e.preventDefault();
    setError("");
    void postAdminOps("/api/admin/operations/emergency-physicians", { name })
      .then(() => {
        setName("");
        reload();
      })
      .catch((err: Error) => setError(err.message));
  }

  function persist(next: Row[]) {
    setItems(next);
    void fetchAdminOps("/api/admin/operations/emergency-physicians", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next }),
    }).catch((e: Error) => setError(e.message));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold text-slate-900">پزشکان اورژانس (ارجاع‌دهنده)</h1>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>
      ) : null}

      <Card hover={false} className="p-4">
        <form className="flex flex-wrap items-end gap-3" onSubmit={add}>
          <div className="min-w-[200px] flex-1">
            <FormLabel>نام پزشک</FormLabel>
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <Button type="submit">افزودن</Button>
        </form>
      </Card>

      <AdminTable headers={["نام", "ترتیب", "فعال", "حذف"]} empty="پزشکی ثبت نشده.">
        {items.map((row, index) => (
          <tr key={row.id} className="border-t border-slate-100">
            <td className="px-4 py-3">
              <FormInput
                value={row.name}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...row, name: e.target.value };
                  persist(next);
                }}
              />
            </td>
            <td className="px-4 py-3">
              <FormInput
                type="number"
                value={String(row.sortOrder)}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...row, sortOrder: Number(e.target.value) || 0 };
                  persist(next);
                }}
              />
            </td>
            <td className="px-4 py-3">
              <input
                type="checkbox"
                checked={row.active}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...row, active: e.target.checked };
                  persist(next);
                }}
              />
            </td>
            <td className="px-4 py-3">
              <Button
                type="button"
                variant="outline"
                className="text-xs text-rose-700"
                onClick={() =>
                  void deleteAdminOps(
                    `/api/admin/operations/emergency-physicians?id=${encodeURIComponent(row.id)}`,
                  ).then(reload)
                }
              >
                حذف
              </Button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
