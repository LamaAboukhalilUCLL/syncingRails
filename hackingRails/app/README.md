# Couchette: Hack The Rails, Track 2 (Trip Planner)

Cross Europe by train. One search, one payment.

- **Search** live European train timetables (Transitous, free, no key needed)
- **Compare** by price, duration, changes and CO₂, with night trains highlighted
- **Pay once** for every leg of the trip with Stripe Checkout (test mode)
- **Demo mode**: if the internet or the timetable API fails during your pitch, the app automatically shows realistic demo trips, so the demo never breaks.

---

## First-time setup on Windows (step by step)

### 1. Install the tools (once per laptop)
1. **Node.js**: download the **LTS** version from https://nodejs.org and install it (click Next everywhere).
2. **VS Code**: https://code.visualstudio.com (you probably have it already).
3. **Git**: https://git-scm.com/download/win (Next everywhere).
4. **Stripe CLI**: open **PowerShell** and run:
   ```powershell
   winget install Stripe.StripeCli
   ```
   If `winget` doesn't work, download the Windows `.zip` from https://github.com/stripe/stripe-cli/releases/latest, unzip it, and put `stripe.exe` in this project folder.
5. **Close PowerShell and open it again** (so it sees the new tools). Check:
   ```powershell
   node -v
   npm -v
   stripe version
   ```

### 2. Open the project
1. Unzip `hacktherails.zip` into `Documents`.
2. In VS Code: **File → Open Folder… → Documents\hacktherails**.
3. Open the terminal inside VS Code: **Terminal → New Terminal**.

### 3. Add your keys
1. In VS Code, right-click `.env.example` → **Copy**, then right-click → **Paste**, and rename the copy to **`.env.local`**.
2. In the Stripe Dashboard (test mode): **Developers → API keys**. Copy the **Secret key** (`sk_test_...`) and paste it after `STRIPE_SECRET_KEY=`.
3. Put your email after `TRANSITOUS_CONTACT=`. Save the file (Ctrl+S).

### 4. Run it
In the VS Code terminal:
```powershell
npm install
npm run dev
```
Open http://localhost:3000. Click **"Bruxelles → Praha"**, then **Book whole trip**.
On the Stripe page use the test card **4242 4242 4242 4242**, any future date, any CVC.

### 5. Turn on webhooks (this is what "issues the tickets" after payment)
Open a **second** terminal (the **+** button in VS Code's terminal panel):
```powershell
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copy the `whsec_...` value it prints into `.env.local` after `STRIPE_WEBHOOK_SECRET=`. Then stop `npm run dev` (Ctrl+C) and start it again.
Pay again: the first terminal now shows `✅ Tickets issued for ...`.

### 6. Share with your team (GitHub)
1. Create an empty repo on https://github.com/new (name: `hacktherails`, **Private**, no README).
2. In the terminal:
   ```powershell
   git init
   git add .
   git commit -m "Starter app"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/hacktherails.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Collaborators → Add people** → add your teammates.
4. Teammates run `git clone https://github.com/YOUR-USERNAME/hacktherails.git`, then steps 3–4 above. Send them the keys privately, never in the repo.

### 7. Put it online (Vercel)
1. https://vercel.com/new → **Import** your `hacktherails` repo.
2. Under **Environment Variables**, add `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_APP_NAME` and `TRANSITOUS_CONTACT`.
3. Click **Deploy**. You get a public link for the demo, and every `git push` redeploys automatically.
4. Webhooks online: Stripe Dashboard → **Developers → Webhooks → Add endpoint** → `https://YOUR-APP.vercel.app/api/webhooks/stripe`, events `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed`. Copy its signing secret into Vercel as `STRIPE_WEBHOOK_SECRET` and redeploy.

---

## How the code is organised

| File | What it does |
| --- | --- |
| `src/app/page.tsx` | Home page (header + planner) |
| `src/components/TripPlanner.tsx` | Search form, results list, sorting, "Book whole trip" |
| `src/components/StationInput.tsx` | Station box with suggestions |
| `src/app/api/stations/route.ts` | Station search (Transitous, demo fallback) |
| `src/app/api/search/route.ts` | Journey search (Transitous, demo fallback) |
| `src/app/api/checkout/route.ts` | Creates the Stripe payment (one line per leg + booking fee). **Prices are recomputed on the server.** |
| `src/app/api/webhooks/stripe/route.ts` | Stripe tells us the payment succeeded → issue tickets |
| `src/app/success/page.tsx` | Confirmation page |
| `src/lib/pricing.ts` | Fare and CO₂ estimates, booking fee (the business model) |
| `src/lib/demo.ts` | Demo stations and journeys (safety net for the pitch) |
| `src/lib/transitous.ts` | Talks to the Transitous timetable API |

## Ideas to win more prizes (pick 1–2, not all)
- **Best Use of Voice (ElevenLabs)**: a mic button, "Brussels to Prague tonight under 100 euros" → search. Read the best option aloud.
- **Best Sustainability**: CO₂ is already shown; add a "greenest" badge, and "trees saved" on the success page.
- **Best Business Model (Stripe)**: the booking fee is already there. Add Stripe Connect so each operator receives its share automatically (multi-seller cart = *separate charges and transfers*), plus a subscription "rail pass" with Stripe Billing.
- **Best Cyber Security (Aikido)**: server-side repricing and webhook signature checks are already done. Add rate limiting and run Aikido's scanner on the repo.

## Honest limits (say them in the pitch, juries like it)
- Prices are **estimates**: there is no open API for rail fares. Real fares would come from operator partnerships.
- Ticket issuing is **simulated** in the webhook.
- Transitous is a free community service for light, non-commercial use. In production we'd self-host MOTIS, the open-source engine it runs on.
