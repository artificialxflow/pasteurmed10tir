"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, Logo } from "@/components/ui/Card";
import { PasteurStorage } from "@/lib/storage";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("pasteur1403");
  const [error, setError] = useState("");

  useEffect(() => {
    PasteurStorage.initAdminAccessIfNeeded();
    if (PasteurStorage.isAdminLoggedIn()) {
      router.replace(PasteurStorage.adminHomePath());
    }
  }, [router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const session = PasteurStorage.adminLogin(username, password);
    if (session) {
      router.push(PasteurStorage.adminHomePath());
      return;
    }
    setError("نام کاربری یا رمز عبور اشتباه است، یا حساب غیرفعال است.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#e8f7fc_0%,#f8fafc_55%,#fff7ed_100%)] p-4">
      <Card hover={false} className="w-full max-w-md border-cyan-100 bg-white/95 p-8 shadow-[0_24px_60px_-36px_rgb(8_145_178_/_0.45)]">
        <div className="mb-8 text-center">
          <Logo className="mx-auto mb-4 h-20 w-auto max-w-[12rem]" />
          <p className="text-lg font-extrabold text-slate-900">پاستور پلاس</p>
          <h1 className="mt-1 text-base font-bold text-cyan-800">ورود به پنل مدیریت</h1>
          <p className="mt-2 text-xs text-slate-500">نسخه نمایشی فرانت — سطح دسترسی mock</p>
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
        <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 text-xs leading-6 text-slate-600">
          <p className="font-bold text-cyan-900">حساب‌های نمونه:</p>
          <p>admin / pasteur1403 — مدیر کل</p>
          <p>ops / ops1403 — منشی</p>
          <p>content / content1403 — محتوا</p>
          <p>finance / finance1403 — مالی</p>
        </div>
        <Link
          href={ROUTES.web.home}
          className="mt-4 block text-center text-sm text-teal-700 hover:underline"
        >
          بازگشت به سایت
        </Link>
      </Card>
    </div>
  );
}
