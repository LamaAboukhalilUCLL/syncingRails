# 2026-11-21 08:40: starter app (Claude)

**Who:** Claude (AI), for the team
**What:** Generated the starter app now in `app/`.

- Next.js 16 app: station autocomplete, journey search via Transitous (with demo fallback), results sorted by best/cheapest/fastest/greenest, CO₂ vs flying.
- `POST /api/checkout`: Stripe Checkout Session, one line item per leg + 3% booking fee (min €1.50); prices recomputed server-side.
- `POST /api/webhooks/stripe`: verifies signature, logs "tickets issued" on `checkout.session.completed` / `async_payment_succeeded`.
- `/success`: booking reference, line items, total, CO₂.
- Verified: lint, production build, API routes, demo fallback, page screenshot. **Not yet verified:** real Stripe payment (needs a key), live Transitous responses (sandbox had no access).

**Next:** add keys, run locally, deploy to Vercel.
