// POST /api/webhooks/stripe
// Stripe calls this after a payment. This is where tickets are "issued".
// Fulfilment happens here (not on the success page) because a customer can pay
// and close the tab before the success page loads.
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

async function fulfil(session: Stripe.Checkout.Session) {
  if (session.payment_status === "unpaid") return; // wait for async_payment_succeeded
  // TODO (hackathon): call each operator's booking API here, or simulate it.
  // With Stripe Connect you would also transfer each operator's share now.
  console.log(
    `[webhook] ✅ Tickets issued for ${session.metadata?.route} · ${session.metadata?.passengers} passenger(s) · ` +
      `${(session.amount_total ?? 0) / 100} ${session.currency?.toUpperCase()} · session ${session.id}`,
  );
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook secret or signature missing" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    // Verifies the request really comes from Stripe.
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    console.error("[webhook] Invalid signature:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfil(event.data.object);
      break;
    case "checkout.session.async_payment_failed":
      console.warn(`[webhook] ❌ Payment failed for session ${event.data.object.id}`);
      break;
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
