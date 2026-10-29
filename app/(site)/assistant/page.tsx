import { AssistantChat } from "@/components/ai/AssistantChat";
import { WEB_PAGE_CONTAINER } from "@/lib/layout";

export default function AssistantPage() {
  return (
    <div className={`${WEB_PAGE_CONTAINER} space-y-6 py-8`}>
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">دستیار هوشمند</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          سوالات خود را درباره مسیرهای سایت، خدمات و موارد ثبت‌شده در دانش رسمی پاستور پلاس بپرسید.
        </p>
      </div>
      <AssistantChat />
    </div>
  );
}
