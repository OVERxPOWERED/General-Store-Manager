# Roadmap

v1 (done) covers: products (CRUD + stock), billing (cart → bill, stock
deduction), bill history, printable/PDF receipts. Everything below is
not yet built — pick items top-down; later items sometimes depend on earlier
ones.

## 1. Purchases (stock coming in from suppliers)

Right now stock only goes down (via bills) or gets hand-edited on the
Products page. A general store needs to record restocking too.

- [ ] Add a `Supplier` model (name, contact info) and a `Purchase` +
      `PurchaseItem` model, mirroring the shape of `Bill`/`BillItem`
- [ ] `POST /api/purchases` — same transactional pattern as bill creation,
      but **increments** stock instead of decrementing it
- [ ] A `/purchases` page: pick a supplier, add line items, submit
- [ ] Purchase history list, similar to `/bills`

## 2. Customers with running credit/dues

Common in general stores: regulars run a tab and pay it off periodically.

- [ ] `Customer` model (name, phone, running balance)
- [ ] Optional `customerId` on `Bill` — a bill can be "on credit" instead of
      paid immediately
- [ ] A way to record a payment against a customer's balance (a `Payment`
      model, or a signed-amount ledger table — decide based on whether you
      need a full payment history or just a running total)
- [ ] Customer picker in the billing flow; customer list + balance page

## 3. Reports

No new schema needed — this is read-only queries over existing tables.

- [ ] Daily/weekly/monthly revenue (`SUM(Bill.totalAmount)` grouped by date)
- [ ] Best-selling products (`GROUP BY BillItem.productId`, sum quantity)
- [ ] Low-stock report (already have the indicator on `/products`; this
      would be a dedicated, printable/exportable view)
- [ ] Consider whether these need to be pages or would be better as a
      `/reports` dashboard with a date-range picker

## 4. Auth (only if more than one person will use this)

Skip this entirely if it stays single-user. If it grows to multiple staff:

- [ ] Pick something proportionate — NextAuth/Auth.js with a single
      credentials provider is enough; don't reach for a full IAM setup
- [ ] A `User` model with a role (`owner` / `staff`) if you need to restrict
      who can delete products or view reports

## 5. Quality-of-life, any time

- [ ] Pagination on `/products` and `/bills` once lists get long
- [ ] `prisma/seed.ts` with sample products, for faster local development
      and demos
- [ ] Basic tests — there are none yet. Start with the bill-creation
      transaction logic in `app/api/bills/route.ts`, since it's the one
      place a bug would actually cost money (wrong stock deduction, wrong
      total)
- [ ] Barcode scanner support in the billing search box (most scanners just
      type + Enter, so this may already work — verify with real hardware)

## Explicitly out of scope for now

Multi-store/multi-branch support, offline mode, a native mobile app. Don't
build toward these speculatively — the schema above doesn't preclude adding
them later, but designing for them now would slow down everything else.
