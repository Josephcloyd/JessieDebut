# Jessiemae: The Grand Debut

A digital invitation and admin dashboard for an 18th birthday debut, built with Next.js, Supabase and Motion.

Follow [docs/SETUP.md](docs/SETUP.md) to connect Supabase, create the admin account and deploy to Vercel.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Run locally. Without Supabase, shows sample content. |
| `npm test` | Unit tests, plus database security tests on an embedded Postgres. |
| `npm run test:coverage` | The same tests, enforcing 80% coverage on business rules. |
| `npm run test:e2e` | Browser tests. The full journey needs the variables in docs/SETUP.md. |
| `npm run lint` / `npm run typecheck` | Static checks. |
| `npm run create-admin -- email "password"` | Creates the dashboard account. |

## Project layout

```
src/app/                Routes: invitation (/), personal links (/i/[code]), guest uploads (/upload), dashboard (/admin)
src/components/public/  The guest-facing invitation
src/components/admin/   The dashboard
src/lib/actions/        Server actions, all validated on the server
src/lib/data/           Database reads
src/lib/domain/         Pure business rules
src/lib/validation/     Zod schemas
supabase/migrations/    Tables, functions, Row Level Security, storage buckets
supabase/seed.sql       Starting content, all editable in the dashboard
tests/                  Unit, database and browser tests
```

## How publishing works

- **Publish required:** event details, hero, about, FAQ and tradition settings. These save to a private draft until you press Publish Changes.
- **Live on save:** photos, participants, program items, wish moderation, RSVP open/closed, slideshow and music settings. Each item has its own show/hide control where that applies.
