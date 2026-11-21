# Architecture

## Stack

| Layer      | Choice                              | Why |
|------------|--------------------------------------|-----|
| Framework  | Next.js 16 (App Router, TypeScript)  | One project for UI + API, server components by default |
| Database   | PostgreSQL                           | Relational data (products/bills/line-items), transactional writes |
| ORM        | Prisma 7                             | Type-safe queries, migrations, transactions |
| Styling    | Tailwind CSS v4                      | Utility classes, CSS-variable theming via `@theme` |
| PDF        | `@react-pdf/renderer`                | Generates the receipt PDF server-side, no headless browser needed |

There is no separate backend service. `app/api/*` route handlers run in the
same Next.js server process and call Prisma directly.

## Folder structure

```
app/
  layout.tsx              Root layout: fonts, sidebar shell
  globals.css             Design tokens (see DESIGN_SYSTEM.md)
  page.tsx                Overview dashboard (server component)
  products/
    page.tsx              Product list + add/edit/delete (client component)
  billing/
    page.tsx              Cart-building UI, creates a bill on checkout (client)
  bills/
    page.tsx              Bill history list (server component)
    [id]/page.tsx          Bill detail: printable view + PDF download link
  api/
    products/route.ts             GET (list), POST (create)
    products/[id]/route.ts        PUT (update), DELETE
    bills/route.ts                GET (list), POST (create bill, deducts stock)
    bills/[id]/route.ts           GET (single bill with items)
    bills/[id]/pdf/route.tsx      GET, streams a rendered PDF

components/
  Sidebar.tsx              Left nav, active-route highlighting
  PrintButton.tsx          Client component wrapping window.print()
  BillPdfDocument.tsx      @react-pdf/renderer document definition

lib/
  prisma.ts                Prisma client singleton (avoids exhausting
                            connections during Next.js dev hot-reload)
  format.ts                formatMoney / formatDate helpers

prisma/
  schema.prisma            Product / Bill / BillItem models
```

## Request flow: creating a bill

This is the one non-trivial flow in the app, worth understanding end to end:

1. `app/billing/page.tsx` (client) lets the user search products and build a
   cart in local React state — nothing is persisted yet.
2. On checkout, it `POST`s `{ items: [{ productId, quantity }] }` to
   `/api/bills`.
3. `app/api/bills/route.ts` opens a `prisma.$transaction`:
   - re-fetches the products server-side (never trusts client-sent prices),
   - checks each has enough stock,
   - computes the total from the *current* `product.price`,
   - creates the `Bill` + nested `BillItem` rows, capturing `priceAtSale`,
   - decrements `Product.stock` for each line.
4. If any step throws (e.g. insufficient stock), the whole transaction rolls
   back — no partial bill, no partial stock deduction.
5. The client redirects to `/bills/[id]`, a server component that re-reads
   the bill fresh from the database.
6. From there, `/api/bills/[id]/pdf` renders `BillPdfDocument` to a buffer
   and streams it back as `application/pdf`.

## Rendering strategy

- Pages that only read data (`/`, `/bills`, `/bills/[id]`) are **server
  components** — they query Prisma directly at render time, no client-side
  fetch/loading state needed.
- Pages that need interactivity (`/products`, `/billing`) are **client
  components** that call the JSON API routes.
- `PrintButton` is pulled out as its own tiny client component so the rest of
  the bill detail page can stay a server component — only the button itself
  needs `window`.

## Known simplifications (intentional, for v1)

- No authentication — single user, runs locally or on a private deployment.
- No pagination on products/bills lists — fine at general-store scale, would
  need addressing before it's used somewhere with thousands of SKUs.
- Duplicate `productId` entries within one bill request aren't merged
  server-side (the billing UI already merges them client-side, so this
  hasn't come up in practice).
