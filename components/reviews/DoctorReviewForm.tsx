"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormSelect, FormTextarea } from "@/components/ui/Card";
import { fetchPublicOps, postPublicOps } from "@/lib/operations/client";
import { FormEvent, useCallback, useEffect, useState } from "react";

type PublicReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ReviewStats = { avg: number; count: number };

export function DoctorReviewForm({
  doctorId,
  doctorName,
  doctorKind,
}: {
  doctorId: string | number;
  doctorName: string;
  doctorKind: "dental" | "medical";
}) {
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPublicOps<{
        items: PublicReview[];
        stats: ReviewStats;
      }>(`/api/operations/reviews?doctorId=${encodeURIComponent(String(doctorId))}`);
      setReviews(data.items);
      setStats(data.stats.count > 0 ? data.stats : null);
    } catch {
      setReviews([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    void postPublicOps("/api/operations/reviews", {
      doctorId,
      doctorName,
      doctorKind,
      phone: phone.trim(),
      rating: Number(rating) || 5,
      comment: comment.trim(),
    })
      .then(() => {
        setDone(true);
        setComment("");
        void loadReviews();
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "ثبت نظر ناموفق بود.");
      });
  }

  return (
    <Card hover={false} className="mt-3 space-y-3 border-cyan-100 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-slate-900">نظر بیماران</p>
        {loading ? (
          <p className="text-xs text-slate-500">در حال بارگذاری...</p>
        ) : stats ? (
          <p className="text-xs font-bold text-amber-700">
            ★ {stats.avg.toFixed(1)} از {stats.count.toLocaleString("fa-IR")} نظر
          </p>
        ) : (
          <p className="text-xs text-slate-500">هنوز نظری ثبت نشده</p>
        )}
      </div>

      {!loading && reviews.length > 0 ? (
        <ul className="max-h-48 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
              <p className="text-xs font-bold text-amber-700">
                {"★".repeat(review.rating)}
                <span className="mr-1 font-normal text-slate-400">
                  {"☆".repeat(5 - review.rating)}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-slate-800">{review.comment}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {done ? (
        <p className="text-xs font-bold text-green-700">
          نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.
        </p>
      ) : null}
      {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
      <form onSubmit={submit} className="space-y-2">
        <FormInput
          placeholder="موبایل"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <FormSelect value={rating} onChange={(e) => setRating(e.target.value)}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ستاره
            </option>
          ))}
        </FormSelect>
        <FormTextarea
          placeholder="نظر شما..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          className="min-h-[80px]"
        />
        <Button type="submit" className="w-full text-sm">
          ثبت امتیاز
        </Button>
      </form>
    </Card>
  );
}
