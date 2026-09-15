# JobTrack AI

A job-application tracker: a Kanban pipeline (Saved → Applied → Screening →
Interview → Offer → Rejected), résumé/cover-letter version management with
diffing, deterministic résumé-vs-job-description match scoring, and interview
prep notes — all scoped so one user can never see another user's data.

A Chrome extension (in [`extension/`](extension/README.md)) captures job
postings from LinkedIn, Seek, and Indeed straight into your account.
Gmail-based auto status updates, Google Calendar / Notion export, weekly
digest emails, and production monitoring/CI-CD remain out of scope for now —
see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#deferred-scope) for what's
deferred and why.

## Stack

Next.js 14 (App Router, TypeScript) · PostgreSQL · Prisma · Tailwind CSS ·
Docker Compose. No external paid services required.

## Quick start

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

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — design decisions, data model, deferred scope
- [docs/SETUP.md](docs/SETUP.md) — local development, migrations, testing
- [extension/README.md](extension/README.md) — Chrome extension setup, build, and testing notes
