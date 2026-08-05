"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, Logo } from "@/components/ui/Card";
import { firstAllowedAdminPath, type AdminSession } from "@/lib/adminAccess";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { session?: AdminSession };
        return data.session ?? null;
      })
      .then((session) => {
        if (session) {
          router.replace(firstAllowedAdminPath(session.permissions));
        }
      });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { session?: AdminSession; error?: string };
      if (!res.ok || !data.session) {
        setError(data.error || "نام کاربری یا رمز عبور اشتباه است، یا حساب غیرفعال است.");
        return;
      }
      router.push(firstAllowedAdminPath(data.session.permissions));
    } catch {
      setError("خطا در ارتباط با سرور.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#e8f7fc_0%,#f8fafc_55%,#fff7ed_100%)] p-4">
      <Card hover={false} className="w-full max-w-md border-cyan-100 bg-white/95 p-8 shadow-[0_24px_60px_-36px_rgb(8_145_178_/_0.45)]">
        <div className="mb-8 text-center">
          <Logo className="mx-auto mb-4 h-20 w-auto max-w-[12rem]" />
          <p className="text-lg font-extrabold text-slate-900">پاستور پلاس</p>
          <h1 className="mt-1 text-base font-bold text-cyan-800">ورود به پنل مدیریت</h1>
          <p className="mt-2 text-xs text-slate-500">ورود با دیتابیس — سطح دسترسی بر اساس نقش</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FormLabel>نام کاربری</FormLabel>
            <FormInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <FormLabel>رمز عبور</FormLabel>
            <FormInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full">
            ورود
          </Button>
        </form>
        <Link
          href={ROUTES.web.home}
          className="mt-6 block text-center text-sm text-teal-700 hover:underline"
        >
          بازگشت به سایت
        </Link>
      </Card>
    </div>
  );
}
