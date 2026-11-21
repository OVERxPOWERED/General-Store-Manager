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

type Customer = {
  id: string;
  name: string;
  balance: number;
};

export default function BillingPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  useEffect(() => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, products]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

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
        customerId: selectedCustomerId || null,
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

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Customer</label>
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="w-full rounded border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-paper-raised)]"
        >
          <option value="">Walk-in (no customer)</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} (Balance: {formatMoney(c.balance)})
            </option>
          ))}
        </select>
        {selectedCustomer && (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Current balance: <span className="tnum font-medium">{formatMoney(selectedCustomer.balance)}</span>
          </p>
        )}
      </div>

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
          <div className="p-4 border-b border-[var(--color-border)]">
            <h2 className="font-medium">Cart</h2>
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {cart.map((line) => (
              <li key={line.product.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{line.product.name}</p>
                  <p className="text-sm text-[var(--color-ink-muted)] tnum">
                    {formatMoney(line.product.price)} × {line.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(line.product.id, line.quantity - 1)}
                    className="rounded border border-[var(--color-border)] px-2 py-1 text-sm hover:bg-[var(--color-paper)]"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="tnum w-8 text-center">{line.quantity}</span>
                  <button
                    onClick={() => updateQuantity(line.product.id, line.quantity + 1