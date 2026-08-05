"use client";

import { Button } from "@/components/ui/Button";
import {
  Card,
  EmptyState,
  FormInput,
  FormLabel,
} from "@/components/ui/Card";
import {
  getClubProfileApi,
  postClubBrushApi,
  postClubRedeemApi,
} from "@/lib/club/client";
import { PASTEUR_DATA, type ClubReward } from "@/lib/data";
import { PasteurStorage, type BrushStatus, type ClubProfile } from "@/lib/storage";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Variant = "web" | "app";

const INSTAGRAM_URL = "https://instagram.com/pastor.beauty.tbz";
const INSTAGRAM_USERNAME = "pastor.beauty.tbz";

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function ClubPage({ variant = "web" }: { variant?: Variant }) {
  const [phone, setPhone] = useState("");
  const [currentPhone, setCurrentPhone] = useState("");
  const [profile, setProfile] = useState<ClubProfile | null>(null);
  const [brushStatus, setBrushStatus] = useState<BrushStatus | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { user?: { phone?: string } };
        if (data.user?.phone) setPhone(digitsOnly(data.user.phone));
      })
      .catch(() => undefined);
  }, []);

  function showMessage(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  }

  function loadClub(rawPhone = phone) {
    const digits = digitsOnly(rawPhone);
    if (digits.length < 10) {
      showMessage(variant === "app" ? "شماره موبایل معتبر نیست" : "شماره موبایل معتبر وارد کنید.");
      return;
    }
    setCurrentPhone(digits);
    void getClubProfileApi(digits)
      .then((data) => {
        setProfile({ ...data.profile });
        setBrushStatus(data.brushStatus);
      })
      .catch((e: Error) => showMessage(e.message || "خطا در دریافت باشگاه"));
  }

  function redeem(reward: ClubReward) {
    if (!currentPhone || !profile) return;
    void postClubRedeemApi(currentPhone, { ...reward })
      .then((data) => {
        setProfile({ ...data.profile });
        showMessage(`پاداش «${reward.title}» با موفقیت فعال شد!`);
      })
      .catch((e: Error) => showMessage(e.message || "دریافت پاداش ناموفق"));
  }

  function recordBrush() {
    if (!currentPhone || !profile) {
      showMessage("ابتدا شماره موبایل باشگاه را وارد کنید.");
      return;
    }
    void postClubBrushApi(currentPhone)
      .then((data) => {
        setProfile({ ...data.profile });
        setBrushStatus(data.brushStatus);
        showMessage("مسواک شما ثبت شد! +۵ امتیاز");
      })
      .catch((e: Error) => showMessage(e.message || "ثبت مسواک ناموفق"));
  }

  const tier = profile ? PasteurStorage.getClubTier(profile.points) : null;
  const isApp = variant === "app";

  return (
    <div className={cn(isApp ? "space-y-4" : "mx-auto max-w-4xl space-y-8")}>
      {!isApp ? (
        <>
          <div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">🎁 باشگاه مشتریان</h1>
            <p className="text-slate-600">
              امتیاز جمع کنید، سطح خود را ارتقا دهید و از پاداش‌ها بهره‌مند شوید
            </p>
          </div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card hover={false}>
              <p className="mb-2 text-2xl">🦷</p>
              <h2 className="font-bold text-slate-900">مراجعه به مرکز</h2>
              <p className="mt-2 text-sm text-slate-600">
                هر رزرو و پرداخت موفق، ۵۰ امتیاز و یک مراجعه ثبت می‌کند.
              </p>
            </Card>
            <Card hover={false}>
              <p className="mb-2 text-2xl">👥</p>
              <h2 className="font-bold text-slate-900">معرفی بیمار جدید</h2>
              <p className="mt-2 text-sm text-slate-600">
                استفاده بیمار جدید از کد معرف، ۱۰۰ امتیاز برای معرف ثبت می‌کند.
              </p>
            </Card>
            <Card hover={false}>
              <p className="mb-2 text-2xl">💬</p>
              <h2 className="font-bold text-slate-900">مشاوره و ویزیت</h2>
              <p className="mt-2 text-sm text-slate-600">
                ثبت هر مشاوره یا ویزیت، ۲۰ امتیاز به حساب همان موبایل اضافه می‌کند.
              </p>
            </Card>
          </section>
        </>
      ) : null}

      <Card
        hover={false}
        className={cn(
          isApp ? "p-3" : "border-amber-200 bg-gradient-to-bl from-amber-50 to-teal-50 p-6",
        )}
      >
        {!isApp ? <FormLabel>شماره موبایل عضویت</FormLabel> : null}
        <div className="flex gap-3">
          <FormInput
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={isApp ? "شماره موبایل" : "۰۹۱۲۱۲۳۴۵۶۷"}
            className="flex-1"
          />
          <Button type="button" className="shrink-0" onClick={() => loadClub()}>
            {isApp ? "بررسی" : "مشاهده امتیاز"}
          </Button>
        </div>
      </Card>

      {profile && tier ? (
        <div className="space-y-6">
          <div
            className={cn(
              "grid gap-4",
              isApp ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
            )}
          >
            <Card hover={false} className="p-5 text-center">
              <p className="text-3xl font-bold text-teal-700">
                {profile.points.toLocaleString("fa-IR")}
              </p>
              <p className="text-sm text-slate-500">{isApp ? "امتیاز" : "امتیاز کل"}</p>
            </Card>
            <Card hover={false} className="p-5 text-center">
              <p className="text-3xl font-bold text-blue-700">
                {Number(profile.visits || 0).toLocaleString("fa-IR")}
              </p>
              <p className="text-sm text-slate-500">{isApp ? "مراجعه" : "تعداد مراجعه"}</p>
            </Card>
            <Card hover={false} className="p-5 text-center">
              <p className="text-3xl font-bold text-amber-700">
                {Number(profile.referrals || 0).toLocaleString("fa-IR")}
              </p>
              <p className="text-sm text-slate-500">{isApp ? "معرفی" : "تعداد معرفی بیمار"}</p>
            </Card>
            <Card hover={false} className="p-5 text-center">
              <p className={cn("font-bold", isApp ? "text-sm" : "text-2xl")}>
                {tier.emoji} {tier.name}
                {!isApp ? ` (${tier.discount}٪ تخفیف)` : ""}
              </p>
              <p className="text-sm text-slate-500">{isApp ? "سطح" : "سطح وفاداری"}</p>
            </Card>
          </div>

          <div className={cn("grid gap-4", isApp ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
            <Card hover={false} className="p-5">
              <h2 className="mb-2 text-lg font-bold">
                {isApp ? "مسواک زدم" : "🪥 مسواک زدم"}
              </h2>
              <p className="mb-4 text-sm leading-7 text-slate-600">
                با ثبت مسواک روزانه، هر بار {Number(5).toLocaleString("fa-IR")} امتیاز بگیرید.
                حداکثر {Number(3).toLocaleString("fa-IR")} بار در روز و با فاصله حداقل ۸ ساعت.
              </p>
              {brushStatus ? (
                <p className="mb-4 text-sm font-bold text-teal-700">
                  امروز: {brushStatus.brushesToday.toLocaleString("fa-IR")} از{" "}
                  {brushStatus.maxPerDay.toLocaleString("fa-IR")} بار
                </p>
              ) : null}
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={!brushStatus?.canBrush}
                onClick={recordBrush}
              >
                مسواک زدم (+۵ امتیاز)
              </Button>
              {brushStatus && !brushStatus.canBrush && brushStatus.errorMessage ? (
                <p className="mt-3 text-sm font-bold text-amber-800">{brushStatus.errorMessage}</p>
              ) : null}
            </Card>

            <Card hover={false} className="p-5">
              <h2 className="mb-2 text-lg font-bold">
                {isApp ? "اینستاگرام پاستور" : "📸 اینستاگرام پاستور"}
              </h2>
              <p className="mb-4 text-sm leading-7 text-slate-600">
                برای دیدن نمونه کارها، اخبار و پیشنهادهای ویژه، پیج ما را در اینستاگرام دنبال
                کنید.
              </p>
              <p className="mb-4 rounded-xl border border-pink-100 bg-pink-50 p-3 text-sm font-bold text-pink-800">
                @{INSTAGRAM_USERNAME}
              </p>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-slate-900 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition-all hover:bg-slate-50 sm:w-auto"
              >
                مشاهده پیج اینستاگرام
              </a>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold">{isApp ? "پاداش‌ها" : "🎁 پاداش‌های قابل دریافت"}</h2>
            <div className={cn("grid gap-4", isApp ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
              {PASTEUR_DATA.clubRewards.map((reward) => {
                const canRedeem = profile.points >= reward.points;
                return (
                  <Card
                    key={reward.id}
                    hover={false}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <span className="text-2xl">{reward.emoji}</span>
                      <p className="mt-1 font-bold">{reward.title}</p>
                      <p className="text-sm text-teal-700">{reward.points} امتیاز</p>
                    </div>
                    <Button
                      type="button"
                      disabled={!canRedeem}
                      className="shrink-0 px-3 py-2 text-sm"
                      onClick={() => redeem(reward)}
                    >
                      دریافت
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className={cn("grid gap-4", isApp ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
            <Card hover={false} className="p-5">
              <h2 className="mb-4 text-lg font-bold">
                {isApp ? "ماموریت‌ها" : "🎯 ماموریت‌ها / چالش‌ها"}
              </h2>
              <div className="space-y-3">
                {PASTEUR_DATA.clubMissions.map((mission) => (
                  <div
                    key={mission.title}
                    className="rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-sm"
                  >
                    <p className="font-bold text-slate-800">{mission.title}</p>
                    <p className="mt-1 text-teal-700">{mission.reward}</p>
                  </div>
                ))}
              </div>
            </Card>

            {!isApp ? (
              <>
                <Card hover={false} className="p-5">
                  <h2 className="mb-4 text-lg font-bold">👥 دعوت از دوستان</h2>
                  <p className="text-sm leading-7 text-slate-600">
                    با ثبت کد معرف در رزرو، عضویت یا VIP تجهیزات، برای معرف امتیاز و پورسانت ثبت
                    می‌شود.
                  </p>
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
                    کد دعوت پیشنهادی شما: PLUS-{currentPhone.slice(-4)}
                  </p>
                </Card>
                <Card hover={false} className="p-5">
                  <h2 className="mb-4 text-lg font-bold">⭐ پیشنهادهای ویژه اعضا</h2>
                  <div className="space-y-2 text-sm text-slate-600">
                    {PASTEUR_DATA.memberOnlyOffers.map((offer) => (
                      <div
                        key={offer}
                        className="rounded-xl border border-amber-100 bg-amber-50 p-3"
                      >
                        ✓ {offer}
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <>
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
                  کد دعوت: PLUS-{currentPhone.slice(-4)}
                </p>
                <Card hover={false} className="border-emerald-200 bg-emerald-50 p-4 text-center">
                  <p className="mb-3 text-sm text-slate-700">کیف اعتبار (جدا از امتیاز)</p>
                  <Button href={ROUTES.app.wallet} className="w-full">
                    مشاهده کیف اعتبار
                  </Button>
                </Card>
              </>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold">
              {isApp ? "تاریخچه امتیاز" : "📜 تاریخچه امتیازات"}
            </h2>
            <div className="space-y-2">
              {profile.history.length ? (
                (isApp ? profile.history.slice(0, 8) : profile.history).map((h, idx) => (
                  <Card
                    key={`${h.date}-${idx}`}
                    hover={false}
                    className="flex justify-between px-4 py-3 text-sm"
                  >
                    <span>{h.reason}</span>
                    <span
                      className={cn(
                        "font-bold",
                        h.points >= 0 ? "text-teal-700" : "text-red-600",
                      )}
                    >
                      {h.points >= 0 ? "+" : ""}
                      {h.points}
                    </span>
                  </Card>
                ))
              ) : (
                <EmptyState
                  title={
                    isApp
                      ? "هنوز امتیازی ثبت نشده"
                      : "هنوز امتیازی ثبت نشده — با رزرو نوبت، معرفی بیمار جدید یا مشاوره امتیاز بگیرید!"
                  }
                />
              )}
            </div>
          </div>

          {!isApp ? (
            <>
              <Card hover={false} className="border-emerald-200 bg-emerald-50 p-5 text-center">
                <p className="mb-3 text-slate-700">اعتبار مصرفی (تومان) — جدا از امتیاز باشگاه</p>
                <Button href={ROUTES.web.wallet}>مشاهده کیف اعتبار</Button>
              </Card>

              <Card hover={false} className="border-slate-200 bg-slate-50 p-5">
                <h2 className="mb-4 text-lg font-bold">📌 قوانین باشگاه</h2>
                <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-3">
                  {PASTEUR_DATA.clubRules.map((rule) => (
                    <div key={rule} className="rounded-xl border border-slate-200 bg-white p-3">
                      ✓ {rule}
                    </div>
                  ))}
                </div>
              </Card>

              <Card hover={false} className="border-teal-200 bg-teal-50 p-5 text-center">
                <p className="mb-3 text-slate-700">برای تخفیف‌های بیشتر، طرح عضویت ارتقا دهید</p>
                <Button href={ROUTES.web.dentalMembership}>مشاهده طرح‌های عضویت</Button>
              </Card>
            </>
          ) : null}
        </div>
      ) : null}

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
