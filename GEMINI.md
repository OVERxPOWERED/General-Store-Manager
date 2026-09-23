# Project context for AI agents (Antigravity / Gemini)

This file is loaded automatically by Google Antigravity and Gemini CLI. Read it,
plus the linked docs, before making changes.

## What this project is

A minimal business management app for a general store: inventory tracking and
billing. One person runs it, in a browser, against their own Postgres database.
It is deliberately small — resist the urge to add auth, multi-tenancy, or
generic "framework" abstractions unless a task explicitly asks for them.

Full documentation lives in `docs/`:

- `docs/ARCHITECTURE.md` — stack, folder structure, how a request flows through the app
- `docs/DATABASE.md` — Prisma schema, relationships, migration workflow
- `docs/API.md` — every route handler: method, path, request/response shape
- `docs/SETUP.md` — local environment setup and troubleshooting
- `docs/DESIGN_SYSTEM.md` — color/type tokens; use these instead of inventing new ones
- `docs/ROADMAP.md` — prioritized backlog of what to build next

Read the relevant doc(s) before touching that part of the codebase — don't
infer schema or API shapes from memory when `docs/DATABASE.md` and
`docs/API.md` already state them.

## Stack

Next.js (App Router, TypeScript) + Prisma + PostgreSQL + Tailwind CSS v4.
No separate backend — API routes live under `app/api/*` in the same project.

There is also a repo-managed `AGENTS.md` in this project, auto-written by
`next dev` itself, warning that this Next.js version may differ from your
training data. Treat it as authoritative for Next.js API specifics and check
`node_modules/next/dist/docs/` if something about routing, caching, or
`params` typing looks unfamiliar — don't assume an older Next.js convention
is still correct.

## Conventions

- **Server components by default.** Only add `"use client"` where the file
  needs state, effects, or browser APIs (forms, buttons with handlers). See
  `app/products/page.tsx` (client, needs state) vs `app/bills/page.tsx`
  (server, just reads data) for the pattern.
- **Money is `Decimal` in Postgres.** Prisma returns `Decimal` objects, which
  are not JSON-serializable as-is — call `.toString()` before returning them
  from an API route (see `app/api/bills/[id]/pdf/route.tsx`). Never do
  floating-point arithmetic on money across a network boundary; convert with
  `Number()` only for a single calculation, not for storage.
- **Multi-step writes are transactions.** Anything that touches stock and a
  bill together goes in `prisma.$transaction(...)` — see
  `app/api/bills/route.ts`. Don't split a stock-deduction from the write that
  depends on it.
- **Formatting helpers live in `lib/format.ts`.** Use `formatMoney` /
  `formatDate` rather than calling `Intl` directly in a component, so the
  currency/locale stays in one place.
- **Design tokens live in `app/globals.css`** as CSS variables (`--color-*`,
  `--font-*`). Use them (`var(--color-primary)`, etc.) instead of hard-coded
  hex values or default Tailwind grays — see `docs/DESIGN_SYSTEM.md`.
- **Route params are async.** This Next.js version types dynamic route
  `params` as a `Promise` — every existing route handler and page already
  does `const { id } = await params;`. Follow that pattern for new ones.

## Before you start a task

1. Check `docs/ROADMAP.md` — it's the backlog, ordered by what makes sense to
   build next.
2. Run `npx prisma generate` after pulling or changing `prisma/schema.prisma`
   — nothing type-checks correctly until you do.
3. `npm run dev` and manually click through the affected flow before calling
   a task done — there are no automated tests yet (that's on the roadmap).
