// POST /api/checkout  { journey: Journey, passengers: number }
// Creates a Stripe Checkout Session with one line item per leg + our service fee,
// then the browser is redirected to Stripe's hosted payment page.
import { NextRequest, NextResponse } from "next/server";
import { modeGroup, repriceLeg, serviceFee } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";
import type { Journey } from "@/lib/types";

const MODE_LABEL: Record<string, string> = {
  night: "Night train",
  highspeed: "High-speed train",
  rail: "Train",
  regional: "Regional train",
  coach: "Coach",
  local: "Local transport",
  flight: "Flight",
};

function fmt(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Brussels",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const journey = body?.journey as Journey | undefined;
  const passengers = Math.min(9, Math.max(1, Number(body?.passengers) || 1));
  if (!journey?.legs?.length) return NextResponse.json({ error: "Missing journey" }, { status: 400 });

  // SECURITY: never trust prices sent by the browser. Recompute them here.
  const legs = journey.legs.filter((l) => modeGroup(l.mode) !== "walk");
  const priced = legs.map((l) => ({ leg: l, ...repriceLeg(l) }));
  const subtotal = priced.reduce((s, p) => s + p.priceEur, 0) * passengers;
  const fee = serviceFee(subtotal);

  const lineItems = priced
    .filter((p) => p.priceEur > 0)
    .map((p) => ({
      quantity: passengers,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(p.priceEur * 100),
        product_data: {
          name: `${MODE_LABEL[modeGroup(p.leg.mode)] ?? "Ticket"}: ${p.leg.from.name} → ${p.leg.to.name}`.slice(0, 250),
          description: [fmt(p.leg.departure), p.leg.operator, p.leg.service].filter(Boolean).join(" · ").slice(0, 250),
        },
      },
    }));
  lineItems.push({
    quantity: 1,
    price_data: {
      currency: "eur",
      unit_amount: Math.round(fee * 100),
      product_data: { name: "Booking fee", description: "One payment, every ticket of your trip." },
    },
  });

  const origin = req.headers.get("origin") || req.nextUrl.origin;
  const first = legs[0];
  const last = legs[legs.length - 1];

  try {
    // Note: no payment_method_types → Stripe shows the best payment methods automatically.
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: {
        route: `${first.from.name} → ${last.to.name}`.slice(0, 500),
        departure: first.departure,
        passengers: String(passengers),
        legs: String(legs.length),
        co2_kg: String(journey.co2Kg),
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[checkout] Stripe error:", e);
    const message = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
