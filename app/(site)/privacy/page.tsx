import { Card } from "@/components/ui/Card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "حریم خصوصی",
  description: "سیاست حریم خصوصی پاستور پلاس",
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Card hover={false} className="bg-white p-6 leading-8 text-slate-700 sm:p-8">
          <h1 className="mb-4 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            سیاست حریم خصوصی پاستور پلاس
          </h1>
          <p className="mb-4">
            پاستور پلاس برای ثبت درخواست‌های رزرو، مشاوره، عضویت، فروشگاه و همکاری، اطلاعاتی مانند
            نام، شماره تماس، شرح درخواست و اطلاعات انتخاب‌شده توسط کاربر را دریافت می‌کند.
          </p>
          <h2 className="mt-6 mb-2 text-lg font-bold text-slate-900">استفاده از اطلاعات</h2>
          <p>
            اطلاعات فقط برای پیگیری خدمات، هماهنگی تماس، بررسی درخواست‌ها و بهبود تجربه کاربری
            استفاده می‌شود.
          </p>
          <h2 className="mt-6 mb-2 text-lg font-bold text-slate-900">نگهداری داده‌ها</h2>
          <p>
            در نسخه فعلی، داده‌ها به صورت نمایشی در مرورگر کاربر ذخیره می‌شوند و برای نسخه عمومی
            باید به سرور امن و API واقعی منتقل شوند.
          </p>
          <h2 className="mt-6 mb-2 text-lg font-bold text-slate-900">تماس</h2>
          <p>
            برای سوال درباره حریم خصوصی، از صفحه تماس با ما یا شماره‌های رسمی پاستور پلاس استفاده
            کنید.
          </p>
        </Card>
      </div>
    </main>
  );
}
