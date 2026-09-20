# JobTrack AI

A job-application tracker: a Kanban pipeline (Not Applied → Applied →
Interview → Offer → Rejected), résumé/cover-letter version management with
diffing, deterministic résumé-vs-job-description match scoring, and interview
prep notes — all scoped so one user can never see another user's data. The
board supports searching by company/role and hiding rejected applications out
of the way, since a long job search accumulates a lot of both.

A Chrome extension (in [`extension/`](extension/README.md)) captures job
postings from LinkedIn, Seek, and Indeed straight into your account — point
it at your deployed app's URL (not `localhost`) so it works without needing
your machine or Docker running.

Gmail-based auto status updates, Google Calendar / Notion export, weekly
digest emails, and production monitoring/CI-CD remain out of scope for now —
see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#deferred-scope) for what's
deferred and why.

## Stack

Next.js 16 (App Router, TypeScript, React 19) · PostgreSQL · Prisma ·
Tailwind CSS · Docker Compose. No external paid services required.

## Quick start (local development)

```bash
cp .env.example .env
docker compose up
```

Then, in another terminal, apply the database schema:

```bash
docker compose exec app npx prisma migrate dev
```

Visit http://localhost:3000, sign up, and start tracking applications.

See [docs/SETUP.md](docs/SETUP.md) for running without Docker, seeding data,
and troubleshooting.

## Deploying

The app is a standard Next.js server plus Postgres — it deploys cleanly to
any host that runs a persistent container with a writable disk (for uploaded
résumés/cover letters). It does **not** fit a serverless host like Vercel
as-is, since `src/lib/storage.ts` writes to local disk; swapping in an
S3-compatible backend first (the interface is already designed for that) is
a prerequisite there.

[Railway](https://railway.com) is the tested path: connect this repo, add a
Postgres plugin, attach a persistent volume for `UPLOAD_DIR`, and set
`DATABASE_URL` / `SESSION_SECRET` as environment variables — `railway.json`
and `package.json`'s `start` script (`prisma migrate deploy && next start`)
handle the rest. See [docs/SETUP.md](docs/SETUP.md) for the full variable
list and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for why the Dockerfile
defaults to a production build unless `NODE_ENV=development` is explicitly
set.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — design decisions, data model, deferred scope
- [docs/SETUP.md](docs/SETUP.md) — local development, migrations, testing, deployment variables
- [extension/README.md](extension/README.md) — Chrome extension setup, build, and testing notes
