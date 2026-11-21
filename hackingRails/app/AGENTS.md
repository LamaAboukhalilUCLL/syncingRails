<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project context (for any AI coding agent: Claude Code, Codex, Copilot)

Hackathon project, Hack The Rails, Brussels, 21 Nov 2026, **Track 2: Trip Planner built with Stripe**.
Goal: a Skyscanner/Omio challenger for European trains. Search, compare, combine and pay for multi-leg trips in one flow.
Jury: European Sleeper, SNCB, City of Brussels, Collibra (rail people: trains first, night trains are a highlight).
Live demos at 17:40. **The demo must never break**: keep the demo-data fallback in `src/lib/demo.ts` working.

Stack: Next.js 16 (App Router, `src/`), TypeScript, Tailwind v4, Stripe Node SDK, Transitous (MOTIS) for timetables.

Rules:
- Stripe: follow `../.claude/skills/stripe-best-practices/SKILL.md` (official Stripe skill). Checkout Sessions, no `payment_method_types`,
  fulfil in the webhook, verify signatures, use `getStripe()` from `src/lib/stripe.ts` (server only).
- Never trust prices from the browser: recompute them on the server (`repriceLeg` in `src/lib/pricing.ts`).
- Secrets live in `.env.local` only. Never commit them.
- Run `npm run lint` and `npm run build` before pushing.
