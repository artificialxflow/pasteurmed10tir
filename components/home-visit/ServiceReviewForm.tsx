"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormSelect, FormTextarea } from "@/components/ui/Card";
import { postPatientOps } from "@/lib/operations/client";
import { FormEvent, useState } from "react";

export function ServiceReviewForm({
  requestId,
  onDone,
}: {
  requestId: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    void postPatientOps(`/api/operations/home-visits/${encodeURIComponent(requestId)}/review`, {
      rating: Number(rating) || 5,
      comment: comment.trim(),
    })
      .then(() => onDone())
      .catch((err) => setError(err instanceof Error ? err.message : "ثبت امتیاز ناموفق بود."))
      .finally(() => setBusy(false));
  }

  return (
    <Card hover={false} className="space-y-3 border-amber-100 bg-amber-50/60 p-4">
      <p className="text-sm font-extrabold text-slate-900">رضایت و امتیاز</p>
      <p className="text-xs text-slate-600">پس از تأیید ادمین، امتیاز در گزارش نظرات دیده می‌شود.</p>
      <form onSubmit={submit} className="space-y-3">
        <FormSelect value={rating} onChange={(e) => setRating(e.target.value)}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ستاره
            </option>
          ))}
        </FormSelect>
        <FormTextarea
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="نظر شما درباره نیرو و خدمت..."
          className="min-h-[90px]"
        />
        {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
        <Button type="submit" disabled={busy} className="w-full">
          ثبت امتیاز
        </Button>
      </form>
    </Card>
  );
}
