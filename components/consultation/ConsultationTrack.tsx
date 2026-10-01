"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  canJoinConsultationVideoStatus,
  consultationVideoJoinKind,
  videoStatusLabel,
} from "@/lib/jitsi/labels";
import {
  getConsultationApi,
  mintPatientConsultationVideoToken,
} from "@/lib/operations/client";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type TrackItem = {
  id: string;
  typeLabel?: string;
  categoryLabel?: string;
  specialtyLabel?: string;
  doctorName?: string;
  status?: string;
  preferredDateLabel?: string;
  preferredTime?: string;
  preferredTimeLabel?: string;
  videoStatus?: string;
  videoMeetingUrl?: string;
  videoRoomName?: string;
  createdAt?: string;
};

const GUIDE_STEPS = [
  {
    title: "با همان اکانت وارد شوید",
    body: "این صفحه را فقط وقتی باز کنید که با موبایل خودتان در پاستور پلاس وارد شده‌اید. لینک را در مرورگر همان دستگاه باز کنید.",
  },
  {
    title: "آماده‌سازی دستگاه",
    body: "از گوشی یا رایانه با اینترنت پایدار استفاده کنید. مرورگر به‌روز (Chrome یا Safari) پیشنهاد می‌شود.",
  },
  {
    title: "مجوز دوربین و میکروفون",
    body: "قبل از ورود، دسترسی دوربین و میکروفون را برای مرورگر یا اپلیکیشن فعال کنید.",
  },
  {
    title: "نصب / به‌روزرسانی اپلیکیشن",
    body: "اگر از اپ پاستور پلاس استفاده می‌کنید، آخرین نسخه را نصب یا به‌روز کنید تا ورود به اتاق بدون مشکل انجام شود.",
  },
  {
    title: "ورود به اتاق",
    body: "وقتی وضعیت ویدیو آماده شد، دکمه «ورود به اتاق ویزیت» را بزنید. نیازی به پیدا کردن لینک در منوهای دیگر نیست.",
  },
  {
    title: "حضور ۵ دقیقه زودتر",
    body: "۵ دقیقه قبل از ساعت ویزیت وارد اتاق شوید و منتظر پزشک بمانید.",
  },
];

export function ConsultationTrack({
  id,
  variant,
}: {
  id: string;
  variant: "web" | "app";
}) {
  const [item, setItem] = useState<TrackItem | null>(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resolvedJoinUrl, setResolvedJoinUrl] = useState("");
  const accountHref = variant === "app" ? ROUTES.app.account : ROUTES.web.account;
  const healthHref =
    variant === "app"
      ? `${ROUTES.app.healthRecord}?section=prescription`
      : `${ROUTES.web.healthRecord}?section=prescription`;

  const reload = useCallback(async () => {
    const data = await getConsultationApi(id);
    const next = data.item as TrackItem;
    setItem(next);
    if (next.videoMeetingUrl && canJoinConsultationVideoStatus(next.videoStatus)) {
      setResolvedJoinUrl(String(next.videoMeetingUrl));
    } else {
      setResolvedJoinUrl("");
    }
  }, [id]);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "بارگذاری ناموفق"));
  }, [reload]);

  async function ensureJoinUrl(): Promise<string> {
    if (!item) throw new Error("اطلاعات مشاوره موجود نیست.");
    const kind = consultationVideoJoinKind(item);
    if (kind === "external" && item.videoMeetingUrl) {
      return item.videoMeetingUrl;
    }
    if (resolvedJoinUrl && kind === "external") return resolvedJoinUrl;
    const token = await mintPatientConsultationVideoToken(item.id);
    setResolvedJoinUrl(token.url);
    return token.url;
  }

  async function joinVideo() {
    if (!item) return;
    setError("");
    setJoining(true);
    try {
      const url = await ensureJoinUrl();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "ورود به ویزیت تصویری ناموفق بود.");
      setJoining(false);
    }
  }

  async function copyLink() {
    setError("");
    try {
      const url = await ensureJoinUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "کپی لینک ناموفق بود.");
    }
  }

  if (error && !item) {
    return (
      <Card hover={false} className="p-5">
        <p className="text-sm font-bold text-red-600">{error}</p>
        <Button href={accountHref} variant="ghost" className="mt-4">
          بازگشت به پنل
        </Button>
      </Card>
    );
  }

  if (!item) {
    return <p className="text-sm text-slate-500">در حال بارگذاری...</p>;
  }

  const cancelled = item.status === "cancelled";
  const statusLabel =
    item.status === "answered" ? "پاسخ داده شد" : cancelled ? "لغو شده" : "در انتظار";
  const visitTime =
    item.preferredTimeLabel || item.preferredTime
      ? String(item.preferredTimeLabel || item.preferredTime)
      : "";
  const visitDate = item.preferredDateLabel ? String(item.preferredDateLabel) : "";
  const joinable = !cancelled && canJoinConsultationVideoStatus(item.videoStatus);
  const videoLabel = videoStatusLabel(item.videoStatus);
  const displayLink =
    resolvedJoinUrl ||
    (item.videoMeetingUrl && joinable ? String(item.videoMeetingUrl) : "");

  return (
    <div className="space-y-4">
      <Card hover={false} className="overflow-hidden border-cyan-100 p-0 shadow-sm">
        <div className="bg-gradient-to-l from-cyan-700 to-teal-600 px-5 py-4 text-white">
          <p className="text-xs font-bold text-cyan-50/90">پیگیری مشاوره تصویری</p>
          <h1 className="mt-1 text-xl font-extrabold">
            {item.typeLabel || item.categoryLabel || "مشاوره"}
          </h1>
          <p className="mt-1 text-sm text-cyan-50">
            {item.doctorName || item.specialtyLabel || "—"}
            {item.createdAt
              ? ` · ${new Date(item.createdAt).toLocaleDateString("fa-IR")}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 px-5 py-4">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
            درخواست: {statusLabel}
          </span>
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-900">
            ویدیو: {videoLabel}
          </span>
        </div>
      </Card>

      <Card hover={false} className="border-teal-200 bg-teal-50/80 p-5">
        {visitTime || visitDate ? (
          <p className="text-base font-extrabold text-teal-950">
            ویزیت شما
            {visitDate ? ` روز ${visitDate}` : ""}
            {visitTime ? ` ساعت ${visitTime}` : ""}
          </p>
        ) : (
          <p className="text-base font-extrabold text-teal-950">
            زمان دقیق ویزیت به‌زودی توسط مرکز اعلام می‌شود.
          </p>
        )}
        <p className="mt-3 rounded-xl border border-teal-300 bg-white px-3 py-3 text-sm font-extrabold leading-7 text-teal-900">
          ۵ دقیقه قبل از ویزیت روی لینک بزنید و در اتاق حاضر باشید تا پزشک حضور پیدا کند.
        </p>
      </Card>

      <Card hover={false} className="border-violet-100 bg-violet-50/50 p-5">
        <p className="text-sm font-extrabold text-violet-950">نسخه و پرونده سلامت</p>
        <p className="mt-1 text-xs leading-6 text-slate-600">
          اگر پزشک نسخه بنویسد، در بخش «نسخه» پرونده سلامت پاستور پلاس ذخیره می‌شود و از همان‌جا
          قابل مشاهده است.
        </p>
        <Link
          href={healthHref}
          className="mt-3 inline-flex rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-violet-800"
        >
          مشاهده نسخه در پرونده سلامت
        </Link>
      </Card>

      <Card hover={false} className="p-5">
        <p className="text-sm font-extrabold text-slate-900">راهنمای حضور در ویزیت</p>
        <ol className="mt-3 space-y-3">
          {GUIDE_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-700 text-xs font-extrabold text-white">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{step.title}</p>
                <p className="mt-0.5 text-xs leading-6 text-slate-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {cancelled ? (
        <Card hover={false} className="border-rose-200 bg-rose-50/70 p-5">
          <p className="text-sm font-extrabold text-rose-900">این مشاوره لغو شده است.</p>
          <p className="mt-1 text-xs leading-6 text-rose-800/80">
            در صورت نیاز به ویزیت جدید، دوباره از بخش مشاوره درخواست ثبت کنید.
          </p>
        </Card>
      ) : null}

      {!cancelled && joinable ? (
        <Card hover={false} className="border-cyan-200 p-5 shadow-sm">
          <p className="text-sm font-extrabold text-slate-900">ورود به ویزیت تصویری</p>
          <p className="mt-1 text-xs leading-6 text-slate-500">
            شما با اکانت خودتان وارد این صفحه شده‌اید. فقط دکمه زیر را بزنید تا مستقیم به اتاق
            ویزیت وصل شوید. ضبط جلسه برای بیمار غیرفعال است.
          </p>

          {displayLink ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p dir="ltr" className="break-all text-left text-xs font-semibold text-cyan-900">
                {displayLink}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              برای نمایش لینک، «آماده‌سازی لینک» یا «ورود به اتاق» را بزنید.
            </p>
          )}

          {error ? <p className="mt-3 text-sm font-bold text-red-600">{error}</p> : null}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              className="w-full !rounded-xl py-3.5 text-base font-extrabold"
              disabled={joining}
              onClick={() => void joinVideo()}
            >
              {joining ? "در حال اتصال…" : "ورود به اتاق ویزیت"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full !rounded-xl border-cyan-300 py-3.5 text-base font-extrabold text-cyan-900"
              disabled={joining}
              onClick={() => void copyLink()}
            >
              {copied ? "کپی شد ✓" : displayLink ? "کپی لینک" : "آماده‌سازی و کپی لینک"}
            </Button>
          </div>
        </Card>
      ) : !cancelled && item.videoStatus === "completed" ? (
        <Card hover={false} className="border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-extrabold text-slate-800">جلسه ویدیو پایان یافته است.</p>
        </Card>
      ) : !cancelled ? (
        <Card hover={false} className="border-amber-200 bg-amber-50/70 p-5">
          <p className="text-sm font-extrabold text-amber-950">
            لینک اتاق هنوز توسط مرکز بارگذاری نشده است.
          </p>
          <p className="mt-1 text-xs leading-6 text-amber-900/80">
            پس از آماده‌شدن لینک، از همین صفحه می‌توانید وارد شوید و راهنما را ببینید.
          </p>
        </Card>
      ) : null}

      <Button href={accountHref} variant="outline" className="w-full !rounded-xl">
        بازگشت به پنل کاربری
      </Button>
    </div>
  );
}
