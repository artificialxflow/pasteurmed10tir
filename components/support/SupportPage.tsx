"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import {
  fetchPatientOps,
  postPatientOps,
} from "@/lib/operations/client";
import { FormEvent, useCallback, useEffect, useState } from "react";

type SupportMessage = {
  id: string;
  sender: "patient" | "admin";
  body: string;
  createdAt: string;
};

type SupportTicket = {
  id: string;
  subject: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  messages?: SupportMessage[];
};

export function SupportPage({ variant = "web" }: { variant?: "web" | "app" }) {
  const [items, setItems] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [view, setView] = useState<"list" | "new" | "thread">("list");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPatientOps<{ items: SupportTicket[] }>(
        "/api/operations/support/tickets",
      );
      setItems(data.items);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در بارگذاری");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function openThread(id: string) {
    void fetchPatientOps<{ item: SupportTicket }>(
      `/api/operations/support/tickets/${encodeURIComponent(id)}`,
    )
      .then((data) => {
        setSelected(data.item);
        setView("thread");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }

  function createTicket(e: FormEvent) {
    e.preventDefault();
    void postPatientOps<{ item: SupportTicket }>("/api/operations/support/tickets", {
      subject: subject.trim(),
      body: body.trim(),
    })
      .then((data) => {
        setSubject("");
        setBody("");
        setSelected(data.item);
        setView("thread");
        void reload();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "ثبت ناموفق"));
  }

  function sendReply(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    void postPatientOps<{ item: SupportTicket }>(
      `/api/operations/support/tickets/${encodeURIComponent(selected.id)}`,
      { body: reply.trim() },
    )
      .then((data) => {
        setSelected(data.item);
        setReply("");
        void reload();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "ارسال ناموفق"));
  }

  const shellClass =
    variant === "app" ? "space-y-4" : "mx-auto max-w-3xl space-y-6 px-4 py-10";

  return (
    <div className={shellClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">پشتیبانی / تیکت</h1>
          <p className="mt-1 text-sm text-slate-600">پیگیری درخواست‌ها و پاسخ کارشناسان</p>
        </div>
        <div className="flex gap-2">
          {view !== "list" ? (
            <Button type="button" variant="outline" className="text-sm" onClick={() => setView("list")}>
              بازگشت
            </Button>
          ) : null}
          <Button type="button" className="text-sm" onClick={() => setView("new")}>
            تیکت جدید
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {view === "new" ? (
        <Card hover={false} className="p-5">
          <form onSubmit={createTicket} className="space-y-3">
            <div>
              <FormLabel>موضوع</FormLabel>
              <FormInput value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div>
              <FormLabel>شرح درخواست</FormLabel>
              <FormTextarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                className="min-h-[140px]"
              />
            </div>
            <Button type="submit" className="w-full">
              ثبت تیکت
            </Button>
          </form>
        </Card>
      ) : null}

      {view === "thread" && selected ? (
        <Card hover={false} className="p-5">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <p className="font-extrabold text-slate-900">{selected.subject}</p>
            <p className="mt-1 text-xs text-slate-500">
              وضعیت: {selected.statusLabel} ·{" "}
              {new Date(selected.createdAt).toLocaleDateString("fa-IR")}
            </p>
          </div>
          <div className="max-h-[360px] space-y-3 overflow-y-auto">
            {(selected.messages || []).map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl p-3 text-sm ${
                  msg.sender === "admin"
                    ? "border border-cyan-100 bg-cyan-50 text-slate-800"
                    : "border border-slate-100 bg-slate-50 text-slate-800"
                }`}
              >
                <p className="mb-1 text-xs font-bold text-slate-500">
                  {msg.sender === "admin" ? "پشتیبانی" : "شما"} ·{" "}
                  {new Date(msg.createdAt).toLocaleString("fa-IR")}
                </p>
                <p className="leading-7">{msg.body}</p>
              </div>
            ))}
          </div>
          {selected.status !== "closed" ? (
            <form onSubmit={sendReply} className="mt-4 space-y-2">
              <FormTextarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="پیام follow-up…"
                required
                className="min-h-[90px]"
              />
              <Button type="submit" className="text-sm">
                ارسال پیام
              </Button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-slate-500">این تیکت بسته شده است.</p>
          )}
        </Card>
      ) : null}

      {view === "list" ? (
        loading ? (
          <p className="text-sm text-slate-500">در حال بارگذاری…</p>
        ) : items.length === 0 ? (
          <Card hover={false} className="border-dashed p-8 text-center text-sm text-slate-600">
            هنوز تیکتی ثبت نکرده‌اید.
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => openThread(ticket.id)}
                className="block w-full rounded-xl border border-slate-200 bg-white p-4 text-right transition hover:border-cyan-300"
              >
                <p className="font-bold text-slate-900">{ticket.subject}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {ticket.statusLabel} · {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
                </p>
              </button>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
