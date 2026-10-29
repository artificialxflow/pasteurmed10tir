"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormLabel, FormTextarea } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; text: string };

export function AssistantChat({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const sessionId = useId().replace(/:/g, "");
  const listRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "سلام! من دستیار پاستور پلاس هستم. درباره خدمات سایت، مسیرها، اقساط و موارد ثبت‌شده در دانش رسمی می‌توانید بپرسید.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || busy) return;
      setError("");
      setBusy(true);
      setMessages((m) => [...m, { role: "user", text: q }]);
      setInput("");

      try {
        const res = await fetch("/api/ai/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, sessionId }),
        });
        const data = (await res.json()) as { answer?: string; error?: string };
        if (!res.ok) {
          throw new Error(data.error || "خطا در ارسال سوال");
        }
        setMessages((m) => [...m, { role: "assistant", text: data.answer || "پاسخی دریافت نشد." }]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "خطا";
        setError(msg);
        setMessages((m) => [
          ...m,
          { role: "assistant", text: "متأسفانه الان نتوانستم پاسخ بدهم. بعداً دوباره تلاش کنید یا از پشتیبانی کمک بگیرید." },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, sessionId],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await ask(input);
  }

  return (
    <Card hover={false} className={cn("flex flex-col", compact ? "h-[min(70vh,520px)]" : "min-h-[420px]", className)}>
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={cn(
              "max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-7",
              m.role === "user" ? "ms-auto bg-cyan-50 text-slate-800" : "bg-slate-100 text-slate-800",
            )}
          >
            {m.text}
          </div>
        ))}
        {busy ? <p className="text-xs text-slate-500">در حال پردازش…</p> : null}
      </div>

      {error ? <p className="px-4 text-xs font-bold text-red-700">{error}</p> : null}

      <form onSubmit={onSubmit} className="space-y-2 border-t border-slate-100 p-4">
        <FormLabel>سوال شما</FormLabel>
        <FormTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={compact ? 2 : 3}
          placeholder="مثلاً مسیر اقساط کجاست؟"
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          ارسال
        </Button>
        <p className="text-[0.65rem] text-slate-500">
          پاسخ‌ها بر اساس دانش رسمی سایت است، نه تشخیص پزشکی.
        </p>
      </form>
    </Card>
  );
}
