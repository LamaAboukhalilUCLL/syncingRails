import { Suspense } from "react";
import { connection } from "next/server";
import TripPlanner from "@/components/TripPlanner";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Couchette";

/** "YYYY-MM-DDTHH:mm" one hour from now, in Brussels time. */
function defaultTime(): string {
  const d = new Date(Date.now() + 60 * 60_000);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Brussels",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:00`;
}

/** Rendered per request so the default time is always "now". */
async function Planner() {
  await connection();
  return <TripPlanner defaultTime={defaultTime()} />;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900">
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:pt-16">
        <header className="mb-8 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">🌙 {APP_NAME}</div>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            Cross Europe by train.
            <br />
            <span className="text-slate-300">One search. One payment.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Compare night trains, high-speed trains and coaches across borders, see the CO₂ you save, and pay for every leg in a
            single checkout.
          </p>
        </header>
        <Suspense fallback={<div className="h-56 animate-pulse rounded-3xl bg-white/10" />}>
          <Planner />
        </Suspense>
      </div>
    </main>
  );
}
