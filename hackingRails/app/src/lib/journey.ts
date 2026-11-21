// Helpers to turn a list of legs into a priced, tagged Journey.

import { co2Leg, flightCo2, haversineKm, modeGroup, NETWORK_FACTOR, priceLeg } from "./pricing";
import type { Journey, JourneyLeg, Place } from "./types";

export type RawLeg = Omit<JourneyLeg, "distanceKm" | "priceEur" | "co2Kg">;

export function enrichLeg(raw: RawLeg): JourneyLeg {
  const distanceKm = Math.round(haversineKm(raw.from, raw.to) * NETWORK_FACTOR);
  return {
    ...raw,
    distanceKm,
    priceEur: priceLeg(raw.mode, distanceKm),
    co2Kg: co2Leg(raw.mode, distanceKm),
  };
}

export function buildJourney(
  id: string,
  rawLegs: RawLeg[],
  origin: Place,
  destination: Place,
  source: Journey["source"],
): Journey {
  const legs = rawLegs.map(enrichLeg);
  const transitLegs = legs.filter((l) => modeGroup(l.mode) !== "walk");
  const departure = legs[0].departure;
  const arrival = legs[legs.length - 1].arrival;
  const durationMin = Math.round((new Date(arrival).getTime() - new Date(departure).getTime()) / 60000);
  const priceEur = Math.round(legs.reduce((s, l) => s + l.priceEur, 0) * 100) / 100;
  const co2Kg = Math.round(legs.reduce((s, l) => s + l.co2Kg, 0) * 10) / 10;

  const tags: string[] = [];
  if (transitLegs.some((l) => l.mode === "NIGHT_RAIL")) tags.push("Night train · saves a hotel night");
  if (transitLegs.length === 1) tags.push("Direct");
  if (transitLegs.some((l) => l.mode === "HIGHSPEED_RAIL")) tags.push("High-speed");

  return {
    id,
    legs,
    departure,
    arrival,
    durationMin,
    transfers: Math.max(0, transitLegs.length - 1),
    priceEur,
    co2Kg,
    flightCo2Kg: flightCo2(origin, destination),
    tags,
    source,
  };
}
