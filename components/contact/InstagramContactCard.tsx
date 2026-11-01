import { Card } from "@/components/ui/Card";
import { instagramProfileUrl } from "@/lib/data";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

type Props = {
  username: string;
  /** compact for app layout */
  variant?: "card" | "compact";
};

export function InstagramContactCard({ username, variant = "card" }: Props) {
  const url = instagramProfileUrl(username);
  const handle = `@${username.replace(/^@/, "")}`;

  if (variant === "compact") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <InstagramIcon className="h-8 w-8 shrink-0 text-pink-600" />
            <div>
              <p className="font-bold text-slate-900">اینستاگرام</p>
              <span className="text-sm font-bold text-pink-700 underline-offset-2 hover:underline" dir="ltr">
                {handle}
              </span>
            </div>
          </div>
        </Card>
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full">
      <Card className="h-full bg-white p-6 hover:border-pink-400">
        <div className="flex items-start justify-between gap-2">
          <InstagramIcon className="h-10 w-10 shrink-0 text-pink-600" />
          <h2 className="text-lg font-bold text-slate-900">اینستاگرام</h2>
        </div>
        <p className="mt-3">
          <span
            className="text-2xl font-extrabold text-pink-700 underline decoration-pink-300 underline-offset-4 hover:decoration-pink-600"
            dir="ltr"
          >
            {handle}
          </span>
        </p>
        <p className="mt-2 text-sm text-slate-500">اخبار، نمونه کارها و پیشنهادهای ویژه — کلیک برای باز کردن پیج</p>
      </Card>
    </a>
  );
}
