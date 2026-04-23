# Gastitos

A quiet, elegant subscription tracker — installable as a PWA, fully offline, with support for **USD**, **EUR**, and **ARS**, inflation-aware **raises**, **per-person** tracking, and up to **3 local reminders** per subscription.

Inspired by the polished calendar-of-logos UI of modern subscription apps, with a warm, candle-lit aesthetic and an editorial serif accent.

## Features

- **Monthly calendar** with brand logos (via [logo.dev](https://www.logo.dev)) for each payment day
- **Totals**: current month and yearly pace, with the biggest single charge highlighted
- **Add a raise**: pick a date and either a percentage increase or a new absolute price. Prices are rebuilt from the timeline of raises, so past months stay accurate
- **Multi-currency** with live FX via `exchangerate.host` (USD / EUR / ARS)
- **People** ("who pays?") and **categories** — fully customizable
- **Metrics** — last 6 months bar chart, breakdown by category and by person
- **Local reminders** — up to 3 per subscription (e.g. 30 days / 10 days / payment day). Best-effort without a backend: they fire the next time the app is opened after a threshold is crossed
- **Fixed-duration subscriptions** — e.g. "only 5 payments" (great for courses, payment plans)
- **Tap any day** — see what's due that day and add a new subscription anchored to it
- **Offline-first** — data lives in IndexedDB on the device, synced to Supabase when online
- **Cloud sync** — sign in with an email one-time code (OTP); two-way sync + realtime across devices
- **Installable PWA**

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS, Framer Motion
- Dexie (IndexedDB) for storage
- `vite-plugin-pwa` (Workbox) for the service worker

## Getting started

```bash
cp .env.example .env   # optional, only needed for cloud sync
npm install
npm run dev
```

Open `http://localhost:5173`.

### Supabase sync (optional)

1. Create a free project at <https://supabase.com>.
2. Open **SQL editor** and run the migration in `supabase/schema.sql` (creates 4 tables with RLS by `auth.uid()`).
3. **Authentication → URL configuration**: set **Site URL** to your production app (e.g. `https://afranchetti-gastitos.vercel.app`). Under **Redirect URLs**, add that URL and `http://localhost:5173` for local dev. **Authentication → Providers → Email**: enable email sign-in; ensure **email OTP** / one-time code is available (not magic-link–only) so it matches the in-app code flow.
4. Copy your **Project URL** and **anon public key** into `.env`:

   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

5. Restart dev server. In the app, open **Settings → Account**, enter your email, paste the 6-digit code from the email. From then on, every local change is pushed upstream and realtime changes from any other device flow back in.

If you leave `.env` unset the app still works — just as a local-only PWA.

### Logo.dev API key

Grab a free key at <https://www.logo.dev/docs/platform/api-keys> and paste it in **Settings → Logo.dev → API key**. The key is stored locally on your device (IndexedDB) and appended as a query string to `https://img.logo.dev/<domain>` requests.

### FX rates

`exchangerate.host` is called with your primary currency as the base. Rates are cached by the service worker and can be refreshed manually from **Settings → FX rates → Refresh**.

### Notifications

1. Flip **Settings → Notifications → Enable reminders**. The browser will ask for permission.
2. In each subscription's edit sheet, enable up to 3 rules (days before due).

Because PWAs cannot reliably schedule truly-background push without a server, reminders fire on app open / visibility-change. If you want fire-at-exact-time push, add a backend with Web Push + VAPID.

## Build

```bash
npm run build
npm run preview
```

## Data model

See `src/lib/types.ts`. Subscriptions store a base `price` and a list of `raises`; `priceOn(sub, date)` replays the raise timeline to get the effective price on any date. This keeps historical months accurate even as prices change.
