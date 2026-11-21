# API reference

All routes live under `app/api/` and return JSON unless noted otherwise. No
authentication in v1 — anything below is reachable by anyone who can reach
the server.

## Products

### `GET /api/products`

List all products, ordered by name.

**Response** `200`
```json
[
  { "id": "...", "name": "Sugar 1kg", "sku": "SUG-1", "category": "Grocery",
    "price": "45.00", "stock": 20, "createdAt": "...", "updatedAt": "..." }
]
```

### `POST /api/products`

Create a product.

**Body**
```json
{ "name": "Sugar 1kg", "sku": "SUG-1", "category": "Grocery", "price": 45.0, "stock": 20 }
```
`name`, `sku`, `price` are required. `category` and `stock` are optional
(`stock` defaults to 0).

**Responses**
- `201` — created product
- `400` — missing required field
- `409` — `sku` already exists

### `PUT /api/products/:id`

Update a product. Same body shape as `POST`. Returns `409` on SKU conflict,
`500` on other failures.

### `DELETE /api/products/:id`

**Responses**
- `200` — `{ "ok": true }`
- `400` — product is referenced by existing bills and can't be deleted (see
  `docs/DATABASE.md` on cascade behavior)

## Bills

### `GET /api/bills`

List all bills, newest first, each including its `items` (without nested
`product` details — just the raw `BillItem` rows).

### `POST /api/bills`

Create a bill. Runs as a single Prisma transaction: validates stock,
computes the total server-side from current prices, creates the bill + line
items, and decrements stock.

**Body**
```json
{ "items": [{ "productId": "...", "quantity": 2 }] }
```

**Responses**
- `201` — the created bill, including `items` with nested `product`
- `400` — empty `items` array, unknown `productId`, or insufficient stock
  (the error message names which product)

### `GET /api/bills/:id`

Fetch one bill with `items.product` populated.

**Responses**
- `200` — the bill
- `404` — `{ "error": "Bill not found" }`

### `GET /api/bills/:id/pdf`

Renders the bill as a PDF (`@react-pdf/renderer`) and streams it back.

**Response**: `Content-Type: application/pdf`, `Content-Disposition: inline`
(opens in the browser rather than forcing a download — the bill detail page
links to this with `target="_blank"`).

## Adding a new route

Follow the existing pattern: a `route.ts` (or `route.tsx` if it renders JSX,
like the PDF route) under `app/api/<resource>/`, using `NextResponse.json()`
for JSON responses and the async `params` pattern for dynamic segments:

```ts
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

Document it here in the same table format when you add it.
