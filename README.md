# StumpStream

Production-focused live cricket scores, news, teams and series application. It uses CricketData/CricAPI through an Express service, so API credentials are never exposed to the browser.

## Run locally

1. Copy `.env.example` to `.env` and add a free [CricAPI](https://cricketdata.org/) key plus your Supabase credentials.
2. Run `npm install`.
3. Run the SQL migration in `supabase/migrations/001_initial.sql` in Supabase SQL Editor.
4. Run `npm run dev`, then open `http://localhost:5173`.

## Deployment

Push this repository to GitHub. Import it into Vercel using the included `vercel.json`, setting `VITE_API_URL` to the deployed API URL. Create a Render Blueprint from `render.yaml` and set `CRICKET_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CLIENT_URL`. The GitHub Actions workflow validates each push.

## Architecture

- `client/`: React 19, Vite, Tailwind, Router, React Query, Framer Motion and Supabase client.
- `server/`: Express API, provider adapter, rate limit/security middleware and short-lived cache fallback.
- `supabase/migrations/`: schema, RLS and policies for news, profiles, favorites, bookmarks and comments.

The adapter isolates provider-specific endpoints in `server/src/services/cricket.ts`; changing providers only affects this module. Live score endpoints refresh on a 30-second React Query interval and retain cached API data when an upstream request fails.
