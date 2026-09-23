"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  sku: string;
  price: string;
  stock: number;
};

type CartLine = { product: Product; quantity: number };

export default function BillingPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, products]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setQuery("");
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, quantity } : l))
    );
  }

  const total = cart.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0);

  async function handleCheckout() {
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Could not create bill");
      return;
    }
    const bill = await res.json();
    router.push(`/bills/${bill.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl mb-6">New bill</h1>

      <div className="relative mb-6">
        <input
          placeholder="Search product by name or SKU…"
          className="w-full rounded border border-[var(--color-border)] px-3 py-2 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded border border-[var(--color-border)] bg-[var(--color-paper-raised)] shadow-sm">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[var(--color-paper)] disabled:opacity-40"
                >
                  <span>
                    {p.name} <span className="text-[var(--color-ink-muted)]">· {p.sku}</span>
                  </span>
                  <span className="tnum">
                    {formatMoney(p.price)}{" "}
                    {p.stock <= 0 && <span className="text-[var(--color-danger)]">(out of stock)</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cart.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Search for a product above to start the bill.
        </p>
      ) : (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-paper-raised)]">
          {cart.map((line) => (
            <div
              key={line.product.id}
              className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="text-sm">{line.product.name}</p>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  {formatMoney(line.product.price)} each
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={line.product.stock}
                  value={line.quantity}
                  onChange={(e) =>
                    updateQuantity(line.product.id, parseInt(e.target.value || "0", 10))
                  }
                  className="w-16 rounded border border-[var(--color-border)] px-2 py-1 text-right text-sm tnum"
                />
                <p className="w-20 text-right text-sm tnum">
                  {formatMoney(Number(line.product.price) * line.quantity)}
                </p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3">
            <p className="font-heading text-lg">Total</p>
            <p className="font-heading text-lg tnum">{formatMoney(total)}</p>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <button
        onClick={handleCheckout}
        disabled={cart.length === 0 || submitting}
        className="mt-6 rounded bg-[var(--color-primary)] px-5 py-2.5 text-sm text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {submitting ? "Creating bill…" : "Create bill"}
      </button>
    </div>
  );
}
