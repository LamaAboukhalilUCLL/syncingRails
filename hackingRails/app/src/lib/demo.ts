// Demo data so the app ALWAYS works on stage, even if the wifi or the
// Transitous API is down. Journeys are generated from real station
// coordinates with realistic speeds, and clearly marked as demo data.

import { buildJourney, type RawLeg } from "./journey";
import { haversineKm } from "./pricing";
import type { Journey, Place, Station } from "./types";

export const DEMO_STATIONS: Station[] = [
  { id: "demo:brussels", name: "Bruxelles-Midi / Brussel-Zuid", lat: 50.8357, lon: 4.3363, country: "BE" },
  { id: "demo:amsterdam", name: "Amsterdam Centraal", lat: 52.3791, lon: 4.9003, country: "NL" },
  { id: "demo:rotterdam", name: "Rotterdam Centraal", lat: 51.925, lon: 4.4689, country: "NL" },
  { id: "demo:paris", name: "Paris Gare du Nord", lat: 48.8809, lon: 2.3553, country: "FR" },
  { id: "demo:cologne", name: "Köln Hbf", lat: 50.943, lon: 6.9589, country: "DE" },
  { id: "demo:frankfurt", name: "Frankfurt (Main) Hbf", lat: 50.1071, lon: 8.6638, country: "DE" },
  { id: "demo:berlin", name: "Berlin Hbf", lat: 52.5251, lon: 13.3694, country: "DE" },
  { id: "demo:hamburg", name: "Hamburg Hbf", lat: 53.553, lon: 10.0067, country: "DE" },
  { id: "demo:munich", name: "München Hbf", lat: 48.1402, lon: 11.56, country: "DE" },
  { id: "demo:dresden", name: "Dresden Hbf", lat: 51.0405, lon: 13.732, country: "DE" },
  { id: "demo:prague", name: "Praha hlavní nádraží", lat: 50.0831, lon: 14.4353, country: "CZ" },
  { id: "demo:vienna", name: "Wien Hauptbahnhof", lat: 48.1852, lon: 16.3761, country: "AT" },
  { id: "demo:zurich", name: "Zürich HB", lat: 47.3779, lon: 8.5403, country: "CH" },
  { id: "demo:basel", name: "Basel SBB", lat: 47.5476, lon: 7.5897, country: "CH" },
  { id: "demo:milan", name: "Milano Centrale", lat: 45.4864, lon: 9.2046, country: "IT" },
  { id: "demo:lyon", name: "Lyon Part-Dieu", lat: 45.7606, lon: 4.8593, country: "FR" },
];

// Cities served by European Sleeper's night trains (used to label demo trains).
const EUROPEAN_SLEEPER = new Set(["demo:brussels", "demo:amsterdam", "demo:rotterdam", "demo:berlin", "demo:dresden", "demo:prague"]);

export function searchDemoStations(text: string): Station[] {
  const q = text.toLowerCase();
  return DEMO_STATIONS.filter((s) => s.name.toLowerCase().includes(q) || s.id.includes(q));
}

function addMin(d: Date, min: number): Date {
  return new Date(d.getTime() + min * 60_000);
}

/** Round up to the next :00 or :30 minus a few minutes, so times look realistic. */
function nextDeparture(d: Date, offsetMin: number): Date {
  const t = addMin(d, offsetMin);
  const m = t.getUTCMinutes();
  t.setUTCMinutes(m < 30 ? 28 : 58, 0, 0);
  return t;
}

function nearestDemo(s: Station): Station {
  if (s.id.startsWith("demo:")) return s;
  let best = DEMO_STATIONS[0];
  let bestD = Infinity;
  for (const d of DEMO_STATIONS) {
    const dist = haversineKm(s, d);
    if (dist < bestD) {
      best = d;
      bestD = dist;
    }
  }
  return bestD < 30 ? best : s;
}

export function demoJourneys(fromIn: Station, toIn: Station, when: Date): Journey[] {
  const from = nearestDemo(fromIn);
  const to = nearestDemo(toIn);
  const A: Place = { name: fromIn.name, lat: fromIn.lat, lon: fromIn.lon };
  const B: Place = { name: toIn.name, lat: toIn.lat, lon: toIn.lon };
  const km = haversineKm(A, B) * 1.15;
  const journeys: Journey[] = [];

  // 1) High-speed with one change at the best hub.
  const hub = DEMO_STATIONS.filter((h) => h.id !== from.id && h.id !== to.id)
    .map((h) => ({ h, extra: haversineKm(A, h) + haversineKm(h, B) - haversineKm(A, B) }))
    .sort((x, y) => x.extra - y.extra)[0];
  if (hub && hub.extra < haversineKm(A, B) * 0.25 && km > 250) {
    const H: Place = { name: hub.h.name, lat: hub.h.lat, lon: hub.h.lon };
    const dep1 = nextDeparture(when, 20);
    const arr1 = addMin(dep1, ((haversineKm(A, H) * 1.15) / 170) * 60);
    const dep2 = addMin(arr1, 38);
    const arr2 = addMin(dep2, ((haversineKm(H, B) * 1.15) / 170) * 60);
    const legs: RawLeg[] = [
      { mode: "HIGHSPEED_RAIL", from: A, to: H, departure: dep1.toISOString(), arrival: arr1.toISOString(), operator: "High-speed operator", service: "HS 9411" },
      { mode: "HIGHSPEED_RAIL", from: H, to: B, departure: dep2.toISOString(), arrival: arr2.toISOString(), operator: "High-speed operator", service: "HS 1023" },
    ];
    journeys.push(buildJourney("demo-hs", legs, A, B, "demo"));
  }

  // 2) Direct day train (slower, cheaper) for trips that fit in a day.
  if (km < 750) {
    const dep = nextDeparture(when, 75);
    const arr = addMin(dep, (km / 105) * 60);
    journeys.push(
      buildJourney("demo-ic", [{ mode: "LONG_DISTANCE", from: A, to: B, departure: dep.toISOString(), arrival: arr.toISOString(), operator: "Intercity", service: "IC 2104" }], A, B, "demo"),
    );
  }

  // 3) Night train for longer trips: leave in the evening, arrive in the morning.
  if (km > 450) {
    const evening = new Date(when);
    evening.setUTCHours(18, 22, 0, 0); // 19:22 Brussels time
    if (evening < when) evening.setUTCDate(evening.getUTCDate() + 1);
    const hours = Math.max(10, km / 75);
    const arr = addMin(evening, hours * 60);
    const isES = EUROPEAN_SLEEPER.has(from.id) && EUROPEAN_SLEEPER.has(to.id);
    journeys.push(
      buildJourney(
        "demo-night",
        [{ mode: "NIGHT_RAIL", from: A, to: B, departure: evening.toISOString(), arrival: arr.toISOString(), operator: isES ? "European Sleeper" : "Night train", service: isES ? "ES 453" : "EN 40" }],
        A,
        B,
        "demo",
      ),
    );
  }

  // 4) Coach: cheapest, slowest.
  {
    const dep = nextDeparture(when, 140);
    const arr = addMin(dep, (km / 68) * 60);
    journeys.push(
      buildJourney("demo-coach", [{ mode: "COACH", from: A, to: B, departure: dep.toISOString(), arrival: arr.toISOString(), operator: "Coach operator", service: "Bus 812" }], A, B, "demo"),
    );
  }

  return journeys;
}
