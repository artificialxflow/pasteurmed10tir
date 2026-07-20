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
    if (PasteurStorage.isAdminLoggedIn()) {
      router.replace(ROUTES.admin.dashboard);
    }
  }, [router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (username === "admin" && password === "pasteur1403") {
      PasteurStorage.adminLogin();
      router.push(ROUTES.admin.dashboard);
      return;
    }
    setError("نام کاربری یا رمز عبور اشتباه است.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card hover={false} className="w-full max-w-md bg-white p-8">
        <div className="mb-8 text-center">
          <Logo className="mx-auto mb-4 h-14 w-14" />
          <h1 className="text-xl font-bold text-slate-900">ورود به پنل مدیریت</h1>
          <p className="mt-1 text-sm text-slate-500">پاستور پلاس</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FormLabel>نام کاربری</FormLabel>
            <FormInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <FormLabel>رمز عبور</FormLabel>
            <FormInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full">
            ورود
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          نسخه نمایشی — admin / pasteur1403
        </p>
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
