import { AppShell } from "@/components/app/AppShell";
import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/routes";

export default function AppPrivacyPage() {
  return (
    <AppShell title="حریم خصوصی" backHref={ROUTES.app.home} showNav>
      <Card hover={false} className="text-sm leading-8 text-slate-600">
        <p className="mb-2 font-bold text-slate-900">حریم خصوصی پاستور پلاس</p>
        <p>
          اطلاعات شخصی شما فقط برای ارائه خدمات درمانی، رزرو، مشاوره و پیگیری سفارش استفاده
          می‌شود.
        </p>
        <p className="mt-2">داده‌های این نسخه نمایشی در localStorage مرورگر ذخیره می‌شوند.</p>
      </Card>
    </AppShell>
  );
}
