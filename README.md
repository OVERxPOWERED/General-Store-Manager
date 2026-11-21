# General Store Manager

A minimal inventory + billing app for a general store, built with Next.js (App Router), Prisma, and PostgreSQL.

## Features (v1)

- **Products** — add, edit, delete, track stock, low-stock indicator
- **Billing** — search products, build a cart, checkout deducts stock automatically
- **Bill history** — every bill is saved to Postgres for later analysis
- **Bill detail** — printable view, plus a downloadable PDF receipt

## Documentation

Full docs live in `docs/`, and `GEMINI.md` (root) is the project context file
that Google Antigravity / Gemini CLI load automatically if you're developing
this there.

| Doc | Covers |
|---|---|
| [`GEMINI.md`](./GEMINI.md) | Agent-facing project context and conventions |
| [`docs/SETUP.md`](./docs/SETUP.md) | Detailed setup + troubleshooting |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Stack, folder structure, request flow |
| [`docs/DATABASE.md`](./docs/DATABASE.md) | Prisma schema, relationships, migrations |
| [`docs/API.md`](./docs/API.md) | Every route handler, request/response shapes |
| [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) | Color/type tokens |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | Prioritized backlog of what to build next |

## Quick start

```bash
npm install
# set DATABASE_URL in .env, then:
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000. See `docs/SETUP.md` for the full walkthrough and
troubleshooting.

## A note on this sandbox

This project was scaffolded in an environment without access to Prisma's binary download server, so `prisma generate` / `prisma migrate` were not run here. Do that on your own machine — it needs real internet access and a reachable Postgres database. See `docs/SETUP.md` if it errors.
# General-Store-Manager
