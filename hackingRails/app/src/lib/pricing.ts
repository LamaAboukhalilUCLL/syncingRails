// Fare and CO2 estimates.
//
// Transitous gives timetables but NOT prices, so we estimate fares per km.
// These numbers are rough averages for European rail in 2026 and are clearly
// labelled "estimated" in the UI. Replace with real fares if you get access
// to an operator API during the hackathon.

import type { JourneyLeg, Place } from "./types";

/** Straight-line distance in km between two points. */
export function haversineKm(a: Place, b: Place): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Tracks are not straight lines: rail/road distance is ~15% longer. */
export const NETWORK_FACTOR = 1.15;

type ModeGroup = "night" | "highspeed" | "rail" | "regional" | "coach" | "local" | "flight" | "walk";

export function modeGroup(mode: string): ModeGroup {
  switch (mode) {
    case "NIGHT_RAIL":
      return "night";
    case "HIGHSPEED_RAIL":
      return "highspeed";
    case "LONG_DISTANCE":
    case "RAIL":
      return "rail";
    case "REGIONAL_FAST_RAIL":
    case "REGIONAL_RAIL":
    case "SUBURBAN":
      return "regional";
    case "COACH":
      return "coach";
    case "AIRPLANE":
      return "flight";
    case "WALK":
    case "BIKE":
      return "walk";
    default:
      return "local"; // BUS, TRAM, SUBWAY, METRO, FERRY, ...
  }
}

// € per km and a fixed part per leg.
const FARE: Record<ModeGroup, { perKm: number; base: number }> = {
  night: { perKm: 0.08, base: 29 }, // base includes a couchette/seat reservation
  highspeed: { perKm: 0.13, base: 5 },
  rail: { perKm: 0.1, base: 3 },
  regional: { perKm: 0.12, base: 1.5 },
  coach: { perKm: 0.05, base: 4 },
  local: { perKm: 0, base: 2.5 },
  flight: { perKm: 0.09, base: 45 },
  walk: { perKm: 0, base: 0 },
};

// kg CO2 per passenger-km (approximate, based on EEA averages).
const CO2_PER_KM: Record<ModeGroup, number> = {
  night: 0.035,
  highspeed: 0.025,
  rail: 0.03,
  regional: 0.04,
  coach: 0.03,
  local: 0.06,
  flight: 0.25, // short-haul incl. non-CO2 effects
  walk: 0,
};

/** Round to a "nice" price like 49.90. */
function nicePrice(eur: number): number {
  if (eur <= 0) return 0;
  return Math.max(1, Math.round(eur) - 0.1);
}

export function priceLeg(mode: string, distanceKm: number): number {
  const f = FARE[modeGroup(mode)];
  return nicePrice(f.base + f.perKm * distanceKm);
}

export function co2Leg(mode: string, distanceKm: number): number {
  return Math.round(CO2_PER_KM[modeGroup(mode)] * distanceKm * 10) / 10;
}

/** CO2 if the whole origin→destination trip were flown instead. */
export function flightCo2(from: Place, to: Place): number {
  return Math.round(haversineKm(from, to) * CO2_PER_KM.flight * 10) / 10;
}

/** Recompute price/co2 for a leg from its coordinates (used server-side, never trust client prices). */
export function repriceLeg(leg: Pick<JourneyLeg, "mode" | "from" | "to">): { distanceKm: number; priceEur: number; co2Kg: number } {
  const distanceKm = Math.round(haversineKm(leg.from, leg.to) * NETWORK_FACTOR);
  return { distanceKm, priceEur: priceLeg(leg.mode, distanceKm), co2Kg: co2Leg(leg.mode, distanceKm) };
}

/** Our platform fee: 3%, minimum €1.50. This is part of the business model. */
export function serviceFee(subtotalEur: number): number {
  return Math.round(Math.max(1.5, subtotalEur * 0.03) * 100) / 100;
}
