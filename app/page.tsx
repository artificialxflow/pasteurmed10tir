export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-3 text-sm font-bold text-brand-cyan">pasteur.plus</p>
      <h1 className="text-3xl font-bold text-brand-blue sm:text-4xl">
        پاستور پلاس
      </h1>
      <p className="mt-4 max-w-md text-base leading-8 text-slate-600">
        اسکلت پروژه Next.js آماده است. طرح مرجع در پوشه{" "}
        <span className="font-bold text-slate-800">pastour</span> نگه داشته شده
        و از گیت نادیده گرفته می‌شود. مرحله بعد: پیاده‌سازی ظاهر و مسیرهای
        درمانگاه بر اساس همان طرح.
      </p>
    </main>
  );
}
