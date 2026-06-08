import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold">🐄 HerdTrack</h1>
      <p className="text-neutral-400 text-lg">Онлайн-мониторинг стада</p>

      <div className="flex gap-4 mt-4">
        <Link
          href="/dashboard"
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/tracker"
          className="rounded-xl bg-green-600 px-6 py-3 font-semibold hover:bg-green-500 transition-colors"
        >
          Tracker
        </Link>
      </div>
    </main>
  );
}
