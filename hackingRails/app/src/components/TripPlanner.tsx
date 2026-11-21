"use client";

import { useMemo, useState } from "react";
import StationInput from "./StationInput";
import { day, duration, eur, modeUi, nextDay, time } from "@/lib/format";
import { DEMO_STATIONS } from "@/lib/demo";
import type { Journey, SearchResponse, Station } from "@/lib/types";

type Sort = "best" | "cheapest" | "fastest" | "greenest";

const QUICK_PICKS: [string, string][] = [
  ["Bruxelles-Midi", "Berlin Hbf"],
  ["Bruxelles-Midi", "Praha hlavní nádraží"],
  ["Bruxelles-Midi", "Milano Centrale"],
  ["Amsterdam Centraal", "Wien Hauptbahnhof"],
];

/** Resolve a station name via the live API, falling back to the built-in list. */
async function resolveStation(name: string): Promise<Station> {
  try {
    const res = await fetch(`/api/stations?q=${encodeURIComponent(name)}`);
    const data = await res.json();
    if (data.stations?.[0]) return data.stations[0];
  } catch {
    /* offline */
  }
  const q = name.toLowerCase().slice(0, 6);
  return DEMO_STATIONS.find((s) => s.name.toLowerCase().includes(q)) ?? DEMO_STATIONS[0];
}

export default function TripPlanner({ defaultTime }: { defaultTime: string }) {
  const [from, setFrom] = useState<Station | null>(null);
  const [to, setTo] = useState<Station | null>(null);
  const [when, setWhen] = useState(defaultTime);
  const [passengers, setPassengers] = useState(1);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("best");
  const [openId, setOpenId] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  async function search(f = from, t = to) {
    if (!f || !t) {
      setError("Pick a departure and a destination station from the list.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: f, to: t, time: when }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function quickPick(a: string, b: string) {
    setLoading(true);
    const [fa, tb] = await Promise.all([resolveStation(a), resolveStation(b)]);
    setFrom(fa);
    setTo(tb);
    await search(fa, tb);
  }

  async function book(j: Journey) {
    setPaying(j.id);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journey: j, passengers }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start payment");
      window.location.assign(data.url); // Stripe's hosted checkout page
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setPaying(null);
    }
  }

  const journeys = useMemo(() => {
    const list = [...(result?.journeys ?? [])];
    const score = (j: Journey) => j.priceEur / 40 + j.durationMin / 120 + j.transfers * 0.5 + j.co2Kg / 20;
    const by: Record<Sort, (a: Journey, b: Journey) => number> = {
      best: (a, b) => score(a) - score(b),
      cheapest: (a, b) => a.priceEur - b.priceEur,
      fastest: (a, b) => a.durationMin - b.durationMin,
      greenest: (a, b) => a.co2Kg - b.co2Kg,
    };
    return list.sort(by[sort]);
  }, [result, sort]);

  const cheapest = Math.min(...journeys.map((j) => j.priceEur));
  const fastest = Math.min(...journeys.map((j) => j.durationMin));

  return (
    <div className="w-full">
      {/* Search card */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
        className="rounded-3xl bg-white/95 p-5 shadow-2xl ring-1 ring-black/5 sm:p-6"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <StationInput label="From" value={from} onChange={setFrom} placeholder="Brussels, Amsterdam…" />
          <button
            type="button"
            aria-label="Swap stations"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            className="self-center rounded-full border border-slate-300 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50 md:mb-1"
          >
            ⇄
          </button>
          <StationInput label="To" value={to} onChange={setTo} placeholder="Berlin, Prague, Milan…" />
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Leaving after</label>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <div className="sm:w-40">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Travellers</label>
            <select
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "adult" : "adults"}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-500 px-8 py-3 font-semibold text-slate-950 shadow hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "Searching…" : "Search trips"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">Try:</span>
          {QUICK_PICKS.map(([a, b]) => (
            <button
              key={a + b}
              type="button"
              onClick={() => quickPick(a, b)}
              className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-amber-100"
            >
              {a.split(/[- ]/)[0]} → {b.split(/[- ]/)[0]}
            </button>
          ))}
        </div>
      </form>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      {/* Results */}
      {result && (
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              {journeys.length} trips found{" "}
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal text-slate-300">
                {result.source === "transitous" ? "Live timetables · Transitous" : "Demo data"}
              </span>
            </h2>
            <div className="flex rounded-full bg-white/10 p-1 text-sm">
              {(["best", "cheapest", "fastest", "greenest"] as Sort[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`rounded-full px-3 py-1 capitalize ${sort === s ? "bg-white text-slate-900" : "text-slate-200 hover:text-white"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {result.warning && <p className="mb-4 text-sm text-amber-300">{result.warning}</p>}

          <ul className="space-y-3">
            {journeys.map((j) => {
              const saved = Math.max(0, Math.round((1 - j.co2Kg / j.flightCo2Kg) * 100));
              const transit = j.legs.filter((l) => l.mode !== "WALK");
              return (
                <li key={j.id} className="overflow-hidden rounded-2xl bg-white shadow-lg">
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <button className="flex-1 text-left" onClick={() => setOpenId(openId === j.id ? null : j.id)}>
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold text-slate-900">{time(j.departure)}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-2xl font-bold text-slate-900">
                          {time(j.arrival)}
                          {nextDay(j.departure, j.arrival) && <sup className="ml-0.5 text-xs text-indigo-600">+1</sup>}
                        </span>
                        <span className="text-sm text-slate-500">
                          {duration(j.durationMin)} · {j.transfers === 0 ? "direct" : `${j.transfers} change${j.transfers > 1 ? "s" : ""}`}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {transit.map((l, i) => {
                          const m = modeUi(l.mode);
                          return (
                            <span key={i} className={`rounded-md px-2 py-0.5 text-xs font-medium ${m.color}`}>
                              {m.icon} {l.service || m.label}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {j.priceEur === cheapest && <span className="font-semibold text-emerald-700">Cheapest</span>}
                        {j.durationMin === fastest && <span className="font-semibold text-sky-700">Fastest</span>}
                        {j.tags.map((t) => (
                          <span key={t} className="text-slate-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    </button>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">{eur(j.priceEur * passengers)}</div>
                        <div className="text-xs text-slate-500">estimated · {passengers > 1 ? `${passengers} travellers` : "1 traveller"}</div>
                      </div>
                      <div className="text-right text-xs text-emerald-700">
                        🌱 {j.co2Kg} kg CO₂ · {saved}% less than flying
                      </div>
                      <button
                        onClick={() => book(j)}
                        disabled={paying !== null}
                        className="ml-auto rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60 sm:ml-0 sm:mt-2"
                      >
                        {paying === j.id ? "Opening payment…" : "Book whole trip"}
                      </button>
                    </div>
                  </div>

                  {openId === j.id && (
                    <ol className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm">
                      {j.legs.map((l, i) => {
                        const m = modeUi(l.mode);
                        return (
                          <li key={i} className="flex gap-4 py-2">
                            <div className="w-24 shrink-0 text-slate-500">
                              <div className="font-semibold text-slate-800">{time(l.departure)}</div>
                              <div className="text-xs">{day(l.departure)}</div>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-slate-900">
                                {l.from.name} → {l.to.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {m.icon} {m.label}
                                {l.service ? ` · ${l.service}` : ""}
                                {l.operator ? ` · ${l.operator}` : ""} · arrives {time(l.arrival)} · {l.distanceKm} km
                              </div>
                            </div>
                            <div className="text-right text-slate-700">{l.priceEur ? eur(l.priceEur) : ""}</div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
