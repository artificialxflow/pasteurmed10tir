"use client";

import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { ReminderService, type ReminderItem } from "@/lib/reminders";
import { PasteurStorage, type Booking } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Variant = "web" | "app";

export function RemindersPage({ variant = "web" }: { variant?: Variant }) {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [selectedOption, setSelectedOption] = useState("24h");
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState("");

  const isApp = variant === "app";

  function showMessage(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  }

  async function reload() {
    const items = await ReminderService.listReminders();
    setReminders(items);
  }

  useEffect(() => {
    const sessionBooking = PasteurStorage.getSessionLastBooking();
    const booking = sessionBooking || PasteurStorage.getLastBooking();
    if (booking) {
      setLastBooking(booking);
      setShowAdd(true);
    }
    void reload();
    const timer = window.setTimeout(() => void ReminderService.checkAndNotify(), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  async function enableNotify() {
    const result = await ReminderService.requestPermission();
    if (result === "granted") showMessage(isApp ? "اعلان‌ها فعال شد" : "اعلان‌ها فعال شد!");
    else if (result === "denied") showMessage(isApp ? "اجازه داده نشد" : "اجازه رد شد.");
    else showMessage("مرورگر پشتیبانی نمی‌کند.");
  }

  async function saveReminder() {
    if (!lastBooking) return;
    await ReminderService.requestPermission();
    const created = await ReminderService.createFromBooking(lastBooking, selectedOption);
    if (!created) {
      showMessage("برای ثبت یادآور وارد حساب شوید.");
      return;
    }
    PasteurStorage.clearSessionLastBooking();
    setShowAdd(false);
    await reload();
    showMessage(isApp ? "یادآور ثبت شد" : "یادآور با موفقیت ثبت شد!");
  }

  async function deleteReminder(id: string) {
    if (!window.confirm("یادآور حذف شود؟")) return;
    const ok = await ReminderService.deleteReminder(id);
    if (ok) {
      await reload();
      if (isApp) showMessage("یادآور حذف شد");
    }
  }

  return (
    <div className={cn(isApp ? "space-y-4" : "mx-auto max-w-2xl space-y-6")}>
      {!isApp ? (
        <div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            🔔 یادآور هوشمند
          </h1>
          <p className="text-slate-600">
            یادآور نوبت‌های خود را مدیریت کنید — اعلان مرورگر و پیامک (نسخه نمایشی)
          </p>
        </div>
      ) : (
        <p className="text-sm leading-7 text-slate-600">
          یادآور نوبت — ۲۴ ساعت و ۲ ساعت قبل (نسخه نمایشی)
        </p>
      )}

      <Card
        hover={false}
        className={cn(
          "text-sm",
          isApp ? "border-blue-200 bg-blue-50 p-4 text-blue-800" : "border-blue-200 bg-blue-50 p-4 text-blue-800",
        )}
      >
        برای دریافت اعلان، اجازه نوتیفیکیشن مرورگر را فعال کنید.
        <button
          type="button"
          className="mt-2 block font-semibold text-teal-700 underline"
          onClick={enableNotify}
        >
          فعال‌سازی اعلان
        </button>
      </Card>

      {showAdd && lastBooking ? (
        <Card hover={false} className="p-6">
          <h2 className="mb-4 font-bold">ثبت یادآور برای آخرین رزرو</h2>
          <div className="mb-4 text-sm text-slate-600">
            {isApp ? (
              <>
                {lastBooking.doctorName} — {lastBooking.day} {lastBooking.timeLabel}
              </>
            ) : (
              <>
                <strong>{lastBooking.doctorName}</strong> — {lastBooking.typeLabel}
                <br />
                {lastBooking.day} — {lastBooking.timeLabel}
              </>
            )}
          </div>
          {!isApp ? <p className="mb-2 text-sm font-bold text-slate-700">زمان یادآور</p> : null}
          <div className="mb-4 space-y-2">
            {PASTEUR_DATA.reminderOptions.map((option) => (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3",
                  selectedOption === option.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-slate-200 bg-white",
                )}
              >
                <input
                  type="radio"
                  name="reminder"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={() => setSelectedOption(option.id)}
                  className="accent-teal-600"
                />
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
          <Button type="button" className="w-full" onClick={saveReminder}>
            ثبت یادآور
          </Button>
        </Card>
      ) : null}

      <div>
        <h2 className="mb-4 text-lg font-bold">یادآورهای فعال</h2>
        <div className="space-y-3">
          {reminders.length ? (
            reminders.map((r) => (
              <Card
                key={r.id}
                hover={false}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xl">🔔</span>
                    <h3 className="font-bold">{r.doctorName || "—"}</h3>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-bold",
                        r.status === "active"
                          ? "border-green-300 bg-green-100 text-green-800"
                          : "border-slate-300 bg-slate-100 text-slate-600",
                      )}
                    >
                      {r.status === "active" ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {r.typeLabel} — {r.day} — {r.timeLabel}
                  </p>
                  <p className="mt-1 text-xs text-teal-700">یادآور: {r.optionLabel}</p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  className="px-3 py-1 text-sm"
                  onClick={() => deleteReminder(String(r.id))}
                >
                  حذف
                </Button>
              </Card>
            ))
          ) : (
            <EmptyState title="یادآوری ثبت نشده است." />
          )}
        </div>
      </div>

      {message ? (
        isApp ? (
          <div className="fixed inset-x-0 bottom-24 z-50 mx-auto max-w-[430px] px-6">
            <div className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white shadow-lg">
              {message}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm font-bold text-teal-700">{message}</p>
        )
      ) : null}
    </div>
  );
}
