// Server-only Stripe client. Never import this from a "use client" file.
import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily create one Stripe client (follows Stripe's recommended pattern). */
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is missing. Copy .env.example to .env.local and paste your test key (sk_test_... or rk_test_...).",
      );
    }
    client = new Stripe(key);
  }
  return client;
}
