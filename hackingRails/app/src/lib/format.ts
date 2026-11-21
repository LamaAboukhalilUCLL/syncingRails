// Display helpers (safe to use in the browser).

const TZ = "Europe/Brussels";

export function time(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function day(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
}

export function duration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? String(m).padStart(2, "0") : ""}` : `${m} min`;
}

export function eur(n: number): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);
}

/** True when arrival is on a later calendar day than departure. */
export function nextDay(depIso: string, arrIso: string): boolean {
  return day(depIso) !== day(arrIso);
}

export const MODE_UI: Record<string, { label: string; icon: string; color: string }> = {
  NIGHT_RAIL: { label: "Night train", icon: "🌙", color: "bg-indigo-100 text-indigo-900" },
  HIGHSPEED_RAIL: { label: "High-speed", icon: "🚄", color: "bg-rose-100 text-rose-900" },
  LONG_DISTANCE: { label: "Train", icon: "🚆", color: "bg-sky-100 text-sky-900" },
  RAIL: { label: "Train", icon: "🚆", color: "bg-sky-100 text-sky-900" },
  REGIONAL_FAST_RAIL: { label: "Regional", icon: "🚈", color: "bg-teal-100 text-teal-900" },
  REGIONAL_RAIL: { label: "Regional", icon: "🚈", color: "bg-teal-100 text-teal-900" },
  SUBURBAN: { label: "Suburban", icon: "🚈", color: "bg-teal-100 text-teal-900" },
  COACH: { label: "Coach", icon: "🚌", color: "bg-amber-100 text-amber-900" },
  BUS: { label: "Bus", icon: "🚌", color: "bg-amber-100 text-amber-900" },
  TRAM: { label: "Tram", icon: "🚋", color: "bg-lime-100 text-lime-900" },
  SUBWAY: { label: "Metro", icon: "🚇", color: "bg-zinc-200 text-zinc-900" },
  METRO: { label: "Metro", icon: "🚇", color: "bg-zinc-200 text-zinc-900" },
  FERRY: { label: "Ferry", icon: "⛴️", color: "bg-cyan-100 text-cyan-900" },
  AIRPLANE: { label: "Flight", icon: "✈️", color: "bg-zinc-200 text-zinc-900" },
  WALK: { label: "Walk", icon: "🚶", color: "bg-zinc-100 text-zinc-700" },
};

export function modeUi(mode: string) {
  return MODE_UI[mode] ?? { label: mode.toLowerCase().replace(/_/g, " "), icon: "🚉", color: "bg-zinc-100 text-zinc-800" };
}
