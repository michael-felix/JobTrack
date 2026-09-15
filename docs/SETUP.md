# Setup

## With Docker (recommended)

```bash
cp .env.example .env
docker compose up
```

First run only, apply the schema:

```bash
docker compose exec app npx prisma migrate dev
```

The app is at http://localhost:3000. Uploaded résumés/cover letters persist
in the `uploads` named volume; Postgres data persists in `pgdata`.

To stop: `docker compose down` (add `-v` to also wipe the volumes/data).

## Without Docker

Requires a local PostgreSQL 16 instance and Node 20+.

```bash
cp .env.example .env
# edit .env: DATABASE_URL=postgresql://jobtrack:jobtrack@localhost:5432/jobtrack
npm install
npx prisma migrate dev
npm run dev
```

## Testing

```bash
npm test
```

Runs all unit tests (`match-score`, `diff`, `resume-parser`, `auth`) with no
database required. The repository row-level-isolation tests
(`src/lib/repositories/applications.integration.test.ts`) are skipped by
default since they need a live Postgres; run them explicitly against a
running database:

```bash
RUN_DB_TESTS=1 DATABASE_URL=postgresql://jobtrack:jobtrack@localhost:5432/jobtrack npm test
```

## Useful commands

- `npx prisma studio` — browse the database in a GUI
- `npx prisma migrate dev --name <change>` — create a new migration after editing `prisma/schema.prisma`
- `npm run build` — production build (also type-checks and lints)

## Chrome extension

The extension is a separate project — see [extension/README.md](../extension/README.md)
for its own install/build/test/load-unpacked instructions. It talks to
whatever `DATABASE_URL`-backed app you have running above via a personal
access token generated from the app's `/settings` page.

## Environment variables

See `.env.example` for the full list. `SESSION_SECRET` isn't currently used
to sign anything (sessions are opaque random tokens, not JWTs) but is kept as
a placeholder for a future move to signed cookies; set it to a random value
in any non-local environment regardless.
