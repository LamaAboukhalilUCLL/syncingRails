# APIs and data

## In use
- **Transitous** (https://transitous.org/api/): free pan-European public transport routing (MOTIS 2). No API key. Endpoint `https://api.transitous.org/api/`.
  - Usage policy: light, non-commercial, best effort, descriptive User-Agent. **In production we'd self-host MOTIS** (open source).
  - Gives timetables, **not prices** → we estimate fares in `app/src/lib/pricing.ts`.
- **Stripe Checkout** (test mode): hosted payment page, one line item per leg + booking fee. Docs: https://docs.stripe.com/payments/checkout
  - Test card: `4242 4242 4242 4242`, any future date, any CVC.

## Candidates (only if time)
- **Duffel** (flights, test mode): to add a "flight + train" comparison.
- **ElevenLabs**: text-to-speech / speech-to-text for the voice prize.
- **Stripe Connect**: pay each operator its share (multi-seller → "separate charges and transfers").

## Competitors
- Omio, Trainline, Skyscanner, Rome2Rio. Gaps we can point at: night trains buried, no CO₂ comparison, several payments for cross-border trips.
