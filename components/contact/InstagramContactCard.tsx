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
      <defs>
        <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f58529" />
          <stop offset="50%" stopColor="#dd2a7b" />
          <stop offset="100%" stopColor="#8134af" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#igGrad)" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" stroke="url(#igGrad)" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="url(#igGrad)" />
    </svg>
  );
}

type Props = {
  username: string;
  variant?: "card" | "compact";
};

export function InstagramContactCard({ username, variant = "card" }: Props) {
  const url = instagramProfileUrl(username);
  const handle = `@${username.replace(/^@/, "")}`;

  if (variant === "compact") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <Card className="border-pink-100 bg-gradient-to-bl from-pink-50/80 to-white p-4 hover:border-pink-300">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <InstagramIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="font-bold text-slate-900">اینستاگرام</p>
              <span
                className="text-sm font-extrabold text-pink-700 underline decoration-pink-300 underline-offset-2"
                dir="ltr"
              >
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
      <Card className="h-full border-pink-100 bg-gradient-to-bl from-pink-50/90 via-white to-purple-50/40 p-6 hover:border-pink-300 hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-pink-100">
            <InstagramIcon className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">اینستاگرام</h2>
        </div>
        <p className="mt-4">
          <span
            className="text-2xl font-extrabold text-pink-700 underline decoration-pink-300 decoration-2 underline-offset-4"
            dir="ltr"
          >
            {handle}
          </span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          اخبار، نمونه کارها و پیشنهادهای ویژه — برای باز کردن پیج کلیک کنید
        </p>
      </Card>
    </a>
  );
}
