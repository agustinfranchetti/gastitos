# Gastitos

A quiet, elegant **subscription tracker** in the browser — installable as a **PWA**, offline-friendly, with a calendar-of-logos feel, support for **USD / EUR / ARS**, per-person and category tags, and optional **cloud sync** when you bring your own Supabase project.

## Features

- Calendar view with logos ([logo.dev](https://www.logo.dev)), monthly totals, metrics (6‑month bar, breakdowns)
- **Raises** (percent or new price) with a clear price timeline so past months stay correct
- People, categories, multi-currency with cached FX, up to 3 local reminders per subscription, fixed number of payments when you need it

## Run locally

```bash
cp .env.example .env   # only if you use Supabase — see below
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Quick links

| What | Where |
| --- | --- |
| **Demo (read-only sample data)** | Open **`/demo`** in the address bar (e.g. `http://localhost:5173/demo`). No in-app link; use **Back to app** in the bar to return to `/`. On static hosting, use an SPA fallback so `/demo` serves `index.html`. |
| **Types / pricing model** | `src/lib/types.ts` — `raises` + `priceOn()` for the effective price on any date. |
| **DB schema (sync)** | `supabase/schema.sql` |

## Optional: Supabase sync

The app is fully usable **without** backend: data stays in **IndexedDB**. To sync across devices, create a [Supabase](https://supabase.com) project, run `supabase/schema.sql` in the SQL editor, set **URL + Email auth** in the dashboard, put **Project URL** and **anon key** in `.env` (see `.env.example`), then sign in with **Settings → Account** and the email OTP. For the code to appear in the email, adjust the **Magic link** template so it includes the token (see [Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless#with-otp)). Redirect URLs should include your production site and `http://localhost:5173` for dev.

## Other settings (all optional)

- **Logo.dev**: free API key in Settings — stored on the device, used for `img.logo.dev` URLs.
- **FX**: refetched in the background; manual **Refresh** under Settings. Implementation uses a public rates API; see `src/lib/money.ts` if you need to change the source.
- **Reminders**: browser permission; they run when the app is opened, not as guaranteed background push (that would need a server).

## Build

```bash
npm run build
npm run preview
```

`npm run typecheck` — TypeScript check.
