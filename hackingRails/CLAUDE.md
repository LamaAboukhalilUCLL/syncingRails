# CLAUDE.md: read this first (every Claude on the team)

This repo is our **shared team brain**: an Obsidian vault (notes) + the code (`app/`). It auto-syncs to GitHub every few minutes, so other teammates and their Claudes see what you write.

## Project
Hack The Rails, Brussels, Sat 21 Nov 2026. **Track 2: Trip Planner built with Stripe.**
A Skyscanner/Omio challenger for European trains: search, compare, combine and **pay for multi-leg trips in one Stripe payment**.
Jury: European Sleeper, SNCB, City of Brussels, Collibra (rail people). **Live demo at 17:40. Feature freeze 16:00.**

## Before you do anything
1. Read `Status.md` (what's done, in progress, next) and `04 Decisions/Decision log.md`.
2. Don't redo work someone else is on (see "In progress" in `Status.md`).

## Rules for notes
- **Don't edit another person's note** in `05 Build log/`. Create a new one: `05 Build log/YYYY-MM-DD HHMM topic (name).md` (template in `05 Build log/_How to log.md`).
- `Status.md`: small, quick edits only (tick a box, change one line).
- Made or recommended a decision the human accepted? Add a row at the **top** of `04 Decisions/Decision log.md`.
- Used a new AI tool, dataset, API, library or image? Add it to `06 Submission/Declarations.md`.
- Use Obsidian links like `[[Status]]`. Keep notes short.

## Rules for code (`app/`)
- See `app/AGENTS.md` for stack details. Next.js 16: read `app/node_modules/next/dist/docs/` before using unfamiliar APIs.
- Stripe: follow `.claude/skills/stripe-best-practices/SKILL.md` (official Stripe skill).
- Never trust prices from the browser; keep the demo-data fallback working (the demo must never break).
- Run `npm run lint` and `npm run build` in `app/` before saying something is done.

## Secrets
**NEVER commit API keys.** They go in `app/.env.local` (ignored by Git). Never paste keys into notes.
