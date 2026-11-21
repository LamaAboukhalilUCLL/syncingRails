// POST /api/search  { from: Station, to: Station, time: "2026-11-21T18:00", demo?: boolean }
import { NextRequest, NextResponse } from "next/server";
import { demoJourneys } from "@/lib/demo";
import { planJourneys } from "@/lib/transitous";
import type { SearchResponse, Station } from "@/lib/types";

function isStation(s: unknown): s is Station {
  const x = s as Station;
  return !!x && typeof x.name === "string" && Number.isFinite(x.lat) && Number.isFinite(x.lon);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !isStation(body.from) || !isStation(body.to) || typeof body.time !== "string") {
    return NextResponse.json({ error: "Expected { from, to, time }" }, { status: 400 });
  }
  const from: Station = body.from;
  const to: Station = body.to;
  // The form gives local Brussels time without an offset; November = UTC+1.
  const when = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(body.time) ? body.time : `${body.time}:00+01:00`);
  if (Number.isNaN(when.getTime())) return NextResponse.json({ error: "Invalid time" }, { status: 400 });

  // Live data first, demo data as a safety net.
  if (!body.demo && !from.id.startsWith("demo:") && !to.id.startsWith("demo:")) {
    try {
      const journeys = await planJourneys(from, to, when.toISOString());
      if (journeys.length) {
        return NextResponse.json<SearchResponse>({ journeys, source: "transitous" });
      }
    } catch (e) {
      console.warn("[search] Transitous failed, falling back to demo data:", e);
    }
  }

  return NextResponse.json<SearchResponse>({
    journeys: demoJourneys(from, to, when),
    source: "demo",
    warning: body.demo ? undefined : "Live timetables unavailable for this search. Showing demo journeys.",
  });
}
