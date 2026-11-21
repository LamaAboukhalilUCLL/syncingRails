// GET /api/stations?q=brux  → list of matching stations
import { NextRequest, NextResponse } from "next/server";
import { searchDemoStations } from "@/lib/demo";
import { searchStations } from "@/lib/transitous";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ stations: [] });

  try {
    const stations = await searchStations(q);
    if (stations.length) return NextResponse.json({ stations, source: "transitous" });
  } catch (e) {
    console.warn("[stations] Transitous unavailable, using demo stations:", e);
  }
  return NextResponse.json({ stations: searchDemoStations(q), source: "demo" });
}
