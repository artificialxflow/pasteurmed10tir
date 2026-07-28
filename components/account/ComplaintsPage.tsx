"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { PasteurStorage } from "@/lib/storage";
import { FormEvent, useState } from "react";

export function ComplaintsPage({ variant = "web" }: { variant?: "web" | "app" }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    PasteurStorage.initPatientDomainIfNeeded();
    PasteurStorage.saveComplaint({
      id: PasteurStorage.generateId(),
      name: name.trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: "new",
      createdAt: new Date().toISOString(),
    });
    setDone(true);
  }

  if (done) {
    return (
      <Card hover={false} className="mx-auto max-w-lg border-green-200 bg-green-50 p-6 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-2 font-bold text-green-800">شکایت شما ثبت شد</p>
        <p className="mt-2 text-sm text-slate-600">کارشناسان رسیدگی می‌کنند.</p>
      </Card>
    );
  }

  return (
    <div className={variant === "app" ? "space-y-4" : "mx-auto max-w-lg space-y-4 px-4 py-10"}>
      <h1 className="text-xl font-extrabold text-slate-900">رسیدگی به شکایات</h1>
      <p className="text-sm text-slate-600">موضوع و شرح شکایت خود را ارسال کنید.</p>
      <Card hover={false} className="p-5">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <FormLabel>نام</FormLabel>
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <FormLabel>موبایل</FormLabel>
            <FormInput value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <FormLabel>موضوع</FormLabel>
            <FormInput value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div>
            <FormLabel>شرح</FormLabel>
            <FormTextarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="min-h-[120px]"
            />
          </div>
          <Button type="submit" className="w-full">
            ارسال شکایت
          </Button>
        </form>
      </Card>
    </div>
  );
}
