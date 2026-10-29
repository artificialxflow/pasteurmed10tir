import { AppShell } from "@/components/app/AppShell";
import { AssistantChat } from "@/components/ai/AssistantChat";
import { ROUTES } from "@/lib/routes";

export default function AppAssistantPage() {
  return (
    <AppShell title="دستیار هوشمند" backHref={ROUTES.app.home} showNav>
      <p className="mb-4 text-sm leading-7 text-slate-600">
        پاسخ‌ها بر اساس دانش رسمی سایت است؛ برای تشخیص پزشکی با پزشک معالج مشورت کنید.
      </p>
      <AssistantChat compact />
    </AppShell>
  );
}
