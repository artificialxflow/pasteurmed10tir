"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { PasteurStorage } from "@/lib/storage";
import { FormEvent, useMemo, useState } from "react";

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

  const stats = useMemo(() => {
    const list = PasteurStorage.getApprovedReviewsForDoctor(doctorId);
    if (!list.length) return null;
    const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
    return { avg, count: list.length };
  }, [doctorId, done]);

  function submit(e: FormEvent) {
    e.preventDefault();
    PasteurStorage.saveDoctorReview({
      id: PasteurStorage.generateId(),
      doctorId,
      doctorName,
      doctorKind,
      phone: phone.trim(),
      rating: Number(rating) || 5,
      comment: comment.trim(),
      status: "approved",
      createdAt: new Date().toISOString(),
    });
    setDone(true);
    setComment("");
  }

  return (
    <Card hover={false} className="mt-3 space-y-3 border-cyan-100 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-slate-900">نظر بیماران</p>
        {stats ? (
          <p className="text-xs font-bold text-amber-700">
            ★ {stats.avg.toFixed(1)} از {stats.count.toLocaleString("fa-IR")} نظر
          </p>
        ) : (
          <p className="text-xs text-slate-500">هنوز نظری ثبت نشده</p>
        )}
      </div>
      {done ? <p className="text-xs font-bold text-green-700">نظر شما ثبت شد.</p> : null}
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
      <p className="text-[11px] text-slate-400">
        نمونه پزشکان دمو: {PASTEUR_DATA.physicians[0]?.name}
      </p>
    </Card>
  );
}
