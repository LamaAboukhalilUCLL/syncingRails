// Shared types used by the API routes and the UI.

export interface Station {
  id: string; // Transitous stop id (or a demo id)
  name: string;
  lat: number;
  lon: number;
  country?: string;
}

export interface Place {
  name: string;
  lat: number;
  lon: number;
}

export interface JourneyLeg {
  mode: string; // e.g. NIGHT_RAIL, HIGHSPEED_RAIL, RAIL, COACH, BUS, WALK
  from: Place;
  to: Place;
  departure: string; // ISO date-time
  arrival: string; // ISO date-time
  operator?: string; // e.g. "SNCB", "European Sleeper"
  service?: string; // e.g. "ICE 15", "EN 453"
  distanceKm: number;
  priceEur: number; // estimated fare for 1 passenger
  co2Kg: number; // estimated CO2 for 1 passenger
}

export interface Journey {
  id: string;
  legs: JourneyLeg[];
  departure: string;
  arrival: string;
  durationMin: number;
  transfers: number;
  priceEur: number;
  co2Kg: number;
  flightCo2Kg: number; // what the same trip would emit by plane
  tags: string[]; // e.g. "Night train", "Direct"
  source: "transitous" | "demo";
}

export interface SearchResponse {
  journeys: Journey[];
  source: "transitous" | "demo";
  warning?: string;
}
