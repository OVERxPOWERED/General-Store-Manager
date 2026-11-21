"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  price: string;
  stock: number;
};

const LOW_STOCK_THRESHOLD = 5;

const emptyForm = { name: "", sku: "", category: "", price: "", stock: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  async function loadProducts() {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        sku: form.sku,
        category: form.category || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock || "0", 10),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Could not add product");
      return;
    }
    setForm(emptyForm);
    loadProducts();
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      sku: p.sku,
      category: p.category ?? "",
      price: p.price,
      stock: String(p.stock),
    });
  }

  async function saveEdit(id: string) {
    setError(null);
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        sku: editForm.sku,
        category: editForm.category || null,
        price: parseFloat(editForm.price),
        stock: parseInt(editForm.stock || "0", 10),
      }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Could not update product");
      return;
    }
    setEditingId(null);
    loadProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Could not delete product");
      return;
    }
    loadProducts();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl mb-6">Products</h1>

      <form
        onSubmit={handleAdd}
        className="mb-8 grid grid-cols-6 gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper-raised)] p-4"
      >
        <input
          required
          placeholder="Name"
          className="col-span-2 rounded border border-[var(--color-border)] px-3 py-2 text-sm"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          required
          placeholder="SKU"
          className="rounded border border-[var(--color-border)] px-3 py-2 text-sm"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
        />
        <input
          placeholder="Category"
          className="rounded border border-[var(--color-border)] px-3 py-2 text-sm"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          required
          type="number"
          step="0.01"
          placeholder="Price"
          className="rounded border border-[var(--color-border)] px-3 py-2 text-sm"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <input
          type="number"
          placeholder="Stock"
          className="rounded border border-[var(--color-border)] px-3 py-2 text-sm"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />
        <button
          type="submit"
          disabled={submitting}
          className="col-span-6 mt-1 w-fit rounded bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
        >
          Add product
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--color-ink-muted)]">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">
          No products yet. Add your first one above.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-ink-muted)]">
              <th className="py-2">Name</th>
              <th className="py-2">SKU</th>
              <th className="py-2">Category</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Stock</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isEditing = editingId === p.id;
              const lowStock = p.stock < LOW_STOCK_THRESHOLD;
              return (
                <tr key={p.id} className="border-b border-[var(--color-border)]">
                  {isEditing ? (
                    <>
                      <td className="py-2 pr-2">
                        <input
                          className="w-full rounded border border-[var(--color-border)] px-2 py-1"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          className="w-full rounded border border-[var(--color-border)] px-2 py-1"
                          value={editForm.sku}
                          onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          className="w-full rounded border border-[var(--color-border)] px-2 py-1"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          className="w-24 rounded border border-[var(--color-border)] px-2 py-1 text-right"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <input
                          type="number"
                          className="w-20 rounded border border-[var(--color-border)] px-2 py-1 text-right"
                          value={editForm.stock}
                          onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                        />
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => saveEdit(p.id)}
                          className="mr-2 text-[var(--color-primary)] hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-[var(--color-ink-muted)] hover:underline"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2">{p.name}</td>
                      <td className="py-2 text-[var(--color-ink-muted)]">{p.sku}</td>
                      <td className="py-2 text-[var(--color-ink-muted)]">{p.category ?? "—"}</td>
                      <td className="py-2 text-right tnum">{formatMoney(p.price)}</td>
                      <td className="py-2 text-right tnum">
                        {p.stock}
                        {lowStock && (
                          <span className="ml-2 rounded bg-[var(--color-accent)]/15 px-1.5 py-0.5 text-xs text-[var(--color-accent)]">
                            Low stock
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => startEdit(p)}
                          className="mr-3 text-[var(--color-primary)] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-[var(--color-danger)] hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
