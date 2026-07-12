# Aspire Nursing — API

Central API service. All business logic (database writes, email) lives here.
The main website and admin panel call this service; they never touch Supabase or
SendGrid directly.

## Stack
- Next.js 16 (route handlers only)
- Supabase (Postgres) via `@supabase/supabase-js` (service role key)
- SendGrid via `@sendgrid/mail`

## Endpoints
| Method | Path                  | Auth              | Purpose                        |
|--------|-----------------------|-------------------|--------------------------------|
| GET    | `/api/health`         | none              | Health check                   |
| POST   | `/api/subscribe`      | `x-internal-key`  | Add a subscriber + send emails |
| GET    | `/api/subscriptions`  | `x-internal-key`  | List subscribers (admin)       |

## Setup
1. `npm install`
2. Fill in values in `.env` (single env file, gitignored).
3. In Supabase → SQL Editor, run `supabase/schema.sql`.
4. In Supabase → Project Settings → API keys, copy the **service_role** secret
   into `SUPABASE_SERVICE_ROLE_KEY`.
5. In SendGrid, verify the sender in `SENDGRID_FROM_EMAIL` (Single Sender or domain).
6. `npm run dev` → http://localhost:4000

## Deploy (Vercel)
- New Project → import this repo → add the same env vars from `.env` in the
  Vercel dashboard (Settings → Environment Variables).
- Point the `api.aspirenursing.com.au` domain at this project.

## Test locally
```bash
curl http://localhost:4000/api/health

curl -X POST http://localhost:4000/api/subscribe \
  -H "Content-Type: application/json" \
  -H "x-internal-key: YOUR_INTERNAL_API_KEY" \
  -d '{"email":"test@example.com"}'
```
