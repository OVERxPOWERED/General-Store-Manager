# Setup

## Requirements

- Node.js 20+
- A reachable PostgreSQL database — local install, Docker, or a free hosted
  one (Neon, Supabase, Railway all work fine for this project's size)

## First-time setup

```bash
npm install
```

Set `DATABASE_URL` in `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/general_store?schema=public"
```

Generate the Prisma client and create the tables:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npx prisma studio` | Browse/edit the database in a GUI |
| `npx prisma generate` | Regenerate the typed client after a schema change |
| `npx prisma migrate dev --name X` | Create + apply a new migration named X |

## Troubleshooting

**`npm install` fails with `Cannot read properties of null (reading 'edgesOut')`**
This is a known npm/Arborist bug unrelated to this project. Retry with:
```bash
npm install --legacy-peer-deps
```

**`npx prisma generate` / `migrate` fails trying to fetch from `binaries.prisma.sh`**
Prisma downloads its query/schema engine binaries on first use. This needs
outbound internet access to `binaries.prisma.sh`. If you're behind a
restrictive firewall or a sandboxed dev environment, this is the one step
that needs a normal, unrestricted machine — run it there once, then the
binaries are cached locally.

**TypeScript errors like `Parameter 'x' implicitly has an 'any' type` on
Prisma-related code**
This means the Prisma client hasn't been generated yet. Run
`npx prisma generate` — Prisma writes the actual types (`Product`, `Bill`,
etc.) based on `prisma/schema.prisma`, and everything resolves once that
exists.

**Bill total or prices look wrong after editing a product's price**
This is expected — see `docs/DATABASE.md` on `priceAtSale`. Past bills
freeze the price at the time of sale by design.

**PDF download shows a blank/broken page**
Check the server console for errors from `@react-pdf/renderer` — this
usually means a style property it doesn't support was used (e.g.
`borderBottom` instead of `borderBottomWidth`; react-pdf's style API is a
subset of CSS, not the full spec).
