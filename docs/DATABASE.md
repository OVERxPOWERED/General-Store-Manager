# Database

PostgreSQL, accessed through Prisma. Schema lives in `prisma/schema.prisma`.

## Models

### Product

| Field      | Type      | Notes |
|------------|-----------|-------|
| id         | String    | `cuid()`, primary key |
| name       | String    | |
| sku        | String    | `@unique` — used for search and to prevent duplicate listings |
| category   | String?   | optional, freeform text (no category table in v1) |
| price      | Decimal(10,2) | current selling price |
| stock      | Int       | current quantity on hand, defaults to 0 |
| createdAt  | DateTime  | |
| updatedAt  | DateTime  | auto-updated by Prisma |

### Bill

| Field        | Type    | Notes |
|--------------|---------|-------|
| id           | String  | `cuid()`, primary key |
| billNumber   | Int     | `@unique @default(autoincrement())` — human-friendly sequential number, separate from `id` |
| createdAt    | DateTime| |
| totalAmount  | Decimal(10,2) | sum of all line items at the time of sale |

### BillItem

| Field        | Type    | Notes |
|--------------|---------|-------|
| id           | String  | `cuid()`, primary key |
| billId       | String  | FK → `Bill`, `onDelete: Cascade` |
| productId    | String  | FK → `Product` (not cascaded — see below) |
| quantity     | Int     | |
| priceAtSale  | Decimal(10,2) | **copied** from `Product.price` at sale time |

## Why `priceAtSale` is duplicated

`BillItem.priceAtSale` intentionally duplicates `Product.price`. If you raise
a product's price next month, last month's bills must still show what the
customer actually paid. Never compute a historical bill's total from the
*current* `Product.price` — always use `BillItem.priceAtSale`.

## Relationships

```
Product 1 ── * BillItem * ── 1 Bill
```

- Deleting a `Bill` cascades to its `BillItem` rows (`onDelete: Cascade`).
- Deleting a `Product` does **not** cascade — Prisma will reject the delete
  if `BillItem` rows reference it (this is why
  `app/api/products/[id]/route.ts` catches the delete failure and returns a
  friendly "used in past bills" error instead of a raw Prisma error).

## Decimal handling

Prisma's `Decimal` fields come back as `Decimal.js` objects, not plain
numbers or strings. They are not JSON-serializable by `NextResponse.json()`
without conversion. The pattern used throughout this codebase:

```ts
const serialized = {
  ...bill,
  totalAmount: bill.totalAmount.toString(),
};
```

Do this in any new route that returns a `Decimal` field. On the client, treat
prices as strings and parse with `Number()` only for calculations — never
store the parsed float back into the database.

## Migration workflow

```bash
# after editing prisma/schema.prisma
npx prisma generate          # regenerate the typed client
npx prisma migrate dev --name <short_description>   # create + apply a migration
```

`prisma migrate dev` is for local development only. For a real deployment,
use `prisma migrate deploy` in your release process instead — it doesn't
prompt interactively and doesn't try to reset the database.

## Seeding (not yet set up)

There's no `prisma/seed.ts` yet. If you add sample data for local
development, wire it up via the `prisma.seed` key in `package.json` and
`npx prisma db seed` — don't hand-write one-off SQL scripts for this.
