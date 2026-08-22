"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormSelect, FormTextarea } from "@/components/ui/Card";
import { fetchAdminOps, postAdminOps, patchAdminOps } from "@/lib/operations/client";
import { useEffect, useState } from "react";

type SupportMessage = {
  id: string;
  sender: "patient" | "admin";
  body: string;
  createdAt: string;
};

type SupportTicket = {
  id: string;
  patientName: string;
  patientPhone: string;
  subject: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  messages?: SupportMessage[];
};

export default function AdminSupportPage() {
  const [items, setItems] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [filter, setFilter] = useState("all");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  function reloadList() {
    const q = filter === "all" ? "" : `?status=${filter}`;
    return fetchAdminOps<{ items: SupportTicket[] }>(
      `/api/admin/operations/support/tickets${q}`,
    ).then((data) => setItems(data.items));
  }

  useEffect(() => {
    void reloadList().catch((e: Error) => setError(e.message));
  }, [filter]);

  function openTicket(id: string) {
    void fetchAdminOps<{ item: SupportTicket }>(
      `/api/admin/operations/support/tickets/${encodeURIComponent(id)}`,
    )
      .then((data) => setSelected(data.item))
      .catch((e: Error) => setError(e.message));
  }

  function sendReply() {
    if (!selected || !reply.trim() || busy) return;
    setBusy(true);
    setError("");
    void postAdminOps<{ item: SupportTicket }>(
      `/api/admin/operations/support/tickets/${encodeURIComponent(selected.id)}`,
      { body: reply.trim() },
    )
      .then((data) => {
        setSelected(data.item);
        setReply("");
        setSuccess("پاسخ ارسال شد.");
        return reloadList();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusy(false));
  }

  function updateStatus(status: string) {
    if (!selected || busy) return;
    setBusy(true);
    void patchAdminOps<{ item: SupportTicket }>(
      `/api/admin/operations/support/tickets/${encodeURIComponent(selected.id)}`,
      { status },
    )
      .then((data) => {
        setSelected(data.item);
        setSuccess("وضعیت به‌روز شد.");
        return reloadList();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusy(false));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {success ? <p className="text-sm text-teal-700">{success}</p> : null}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "همه" },
            { id: "open", label: "باز" },
            { id: "reviewing", label: "در بررسی" },
            { id: "closed", label: "بسته" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                filter === item.id
                  ? "border-cyan-600 bg-cyan-600 text-white"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <AdminTable headers={["موضوع", "بیمار", "وضعیت"]} empty="تیکتی نیست.">
          {items.map((ticket) => (
            <tr
              key={ticket.id}
              className={`cursor-pointer border-t border-slate-100 ${
                selected?.id === ticket.id ? "bg-cyan-50" : ""
              }`}
              onClick={() => openTicket(ticket.id)}
            >
              <td className="px-4 py-3 font-bold">{ticket.subject}</td>
              <td className="px-4 py-3">
                {ticket.patientName}
                <div className="font-mono text-xs text-slate-500">{ticket.patientPhone}</div>
              </td>
              <td className="px-4 py-3">
                <AdminBadge
                  tone={
                    ticket.status === "closed"
                      ? "success"
                      : ticket.status === "open"
                        ? "warn"
                        : "info"
                  }
                >
                  {ticket.statusLabel}
                </AdminBadge>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <Card hover={false} className="p-5">
        {!selected ? (
          <p className="text-sm text-slate-500">یک تیکت را برای مشاهده مکالمه انتخاب کنید.</p>
        ) : (
          <>
            <div className="mb-4 border-b border-slate-100 pb-3">
              <p className="font-extrabold">{selected.subject}</p>
              <p className="mt-1 text-xs text-slate-500">
                {selected.patientName} · {selected.patientPhone}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <FormSelect
                  className="py-1 text-xs"
                  value={selected.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={busy}
                >
                  <option value="open">باز</option>
                  <option value="reviewing">در بررسی</option>
                  <option value="closed">بسته</option>
                </FormSelect>
              </div>
            </div>
            <div className="max-h-[320px] space-y-3 overflow-y-auto">
              {(selected.messages || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-xl p-3 text-sm ${
                    msg.sender === "admin"
                      ? "border border-teal-100 bg-teal-50"
                      : "border border-slate-100 bg-slate-50"
                  }`}
                >
                  <p className="mb-1 text-xs font-bold text-slate-500">
                    {msg.sender === "admin" ? "ادمین" : "بیمار"} ·{" "}
                    {new Date(msg.createdAt).toLocaleString("fa-IR")}
                  </p>
                  <p className="leading-7">{msg.body}</p>
                </div>
              ))}
            </div>
            {selected.status !== "closed" ? (
              <div className="mt-4 space-y-2">
                <FormTextarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="پاسخ پشتیبانی…"
                  className="min-h-[100px]"
                />
                <Button type="button" className="text-sm" disabled={busy} onClick={sendReply}>
                  ارسال پاسخ
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
