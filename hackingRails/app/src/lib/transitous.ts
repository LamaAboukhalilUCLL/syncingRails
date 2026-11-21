// Client for Transitous (https://transitous.org), a free, community-run,
// pan-European public transport router built on MOTIS.
//
// Usage policy: light, non-commercial use, with a descriptive User-Agent.
// For a production version you would self-host MOTIS (MIT licensed).

import { buildJourney, type RawLeg } from "./journey";
import type { Journey, Place, Station } from "./types";

const BASE = process.env.TRANSITOUS_BASE_URL || "https://api.transitous.org";
const USER_AGENT = `HackTheRails-TripPlanner/0.1 (Brussels hackathon demo; ${process.env.TRANSITOUS_CONTACT || "no contact set"})`;

async function getJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = `${BASE}${path}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Transitous ${path} returned ${res.status}`);
  return (await res.json()) as T;
}

// --- Station search -------------------------------------------------------

interface MotisMatch {
  type: string;
  id: string;
  name: string;
  lat: number;
  lon: number;
  country?: string;
  importance?: number;
}

export async function searchStations(text: string): Promise<Station[]> {
  const matches = await getJson<MotisMatch[]>("/api/v1/geocode", { text, type: "STOP" });
  return matches.slice(0, 8).map((m) => ({ id: m.id, name: m.name, lat: m.lat, lon: m.lon, country: m.country }));
}

// --- Journey planning -----------------------------------------------------

interface MotisPlace {
  name: string;
  lat: number;
  lon: number;
  departure?: string;
  arrival?: string;
}

interface MotisLeg {
  mode: string;
  from: MotisPlace;
  to: MotisPlace;
  startTime: string;
  endTime: string;
  agencyName?: string;
  displayName?: string;
  routeShortName?: string;
  tripShortName?: string;
  headsign?: string;
}

interface MotisItinerary {
  startTime: string;
  endTime: string;
  legs: MotisLeg[];
}

interface MotisPlan {
  itineraries: MotisItinerary[];
}

/** Very short walks (station transfers) are noise in the UI. */
function keepLeg(l: MotisLeg): boolean {
  if (l.mode !== "WALK") return true;
  const ms = new Date(l.endTime).getTime() - new Date(l.startTime).getTime();
  return ms > 15 * 60_000;
}

export async function planJourneys(
  from: Station,
  to: Station,
  timeIso: string,
): Promise<Journey[]> {
  const params = {
    fromPlace: from.id || `${from.lat},${from.lon}`,
    toPlace: to.id || `${to.lat},${to.lon}`,
    time: timeIso,
    numItineraries: "6",
  };

  // Newer MOTIS versions expose /api/v6; older ones /api/v5. Try both.
  let plan: MotisPlan | null = null;
  let lastError: unknown = null;
  for (const version of ["v6", "v5"]) {
    try {
      plan = await getJson<MotisPlan>(`/api/${version}/plan`, params);
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (!plan) throw lastError ?? new Error("Transitous plan failed");

  const origin: Place = { name: from.name, lat: from.lat, lon: from.lon };
  const destination: Place = { name: to.name, lat: to.lat, lon: to.lon };

  return plan.itineraries
    .map((it, i) => {
      const legs: RawLeg[] = it.legs.filter(keepLeg).map((l) => ({
        mode: l.mode,
        from: { name: l.from.name, lat: l.from.lat, lon: l.from.lon },
        to: { name: l.to.name, lat: l.to.lat, lon: l.to.lon },
        departure: l.startTime,
        arrival: l.endTime,
        operator: l.agencyName,
        service: l.displayName || l.routeShortName || l.tripShortName || undefined,
      }));
      return legs.length ? buildJourney(`t${i}-${it.startTime}`, legs, origin, destination, "transitous") : null;
    })
    .filter((j): j is Journey => j !== null);
}
