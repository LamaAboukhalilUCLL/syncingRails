# Decision log

_Add new decisions at the top. One line for what, one for why._

| When | Decision | Why | Who |
| --- | --- | --- | --- |
| Sat 12:30 | One GitHub repo = Obsidian vault + code (`app/`), auto-synced every 5 min | Everyone (and every Claude) sees the same notes, status and code | team |
| Sat 08:40 | Demo-data fallback when live timetables fail | The live demo must never break on bad wifi | starter |
| Sat 08:40 | Fares are **estimated** per km, recomputed on the server at checkout | No open rail-fare API; never trust prices from the browser | starter |
| Sat 08:40 | Stack: Next.js 16 + TypeScript + Tailwind, Stripe Checkout (hosted), Transitous for timetables, Vercel hosting | Fastest path to a working, deployable demo; Stripe's recommended integration | starter |
| Sat 08:30 | Track 2: Trip Planner built with Stripe; trains first, night trains as the hero | Rail-heavy jury; we keep the IP | team |
