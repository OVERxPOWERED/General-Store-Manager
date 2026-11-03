'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatMoney } from '@/lib/format';

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

interface PurchasePayload {
  supplierId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export default function PurchasesPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to load suppliers');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, [fetchSuppliers, fetchProducts]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.price }];
    });
    setQuery('');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const getSubtotal = (item: CartItem) => {
    return item.quantity * item.unitPrice;
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + getSubtotal(item), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedSupplierId) {
      setError('Please select a supplier');
      return;
    }

    if (cart.length === 0) {
      setError('Please add at least one product to the cart');
      return;
    }

    setSubmitting(true);

    try {
      const payload: PurchasePayload = {
        supplierId: selectedSupplierId,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create purchase');
      }

      setSuccess('Purchase created successfully!');
      setCart([]);
      setSelectedSupplierId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const isLowStock = (product: Product) => {
    return product.stock <= product.lowStockThreshold;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text)]">
          New Purchase
        </h1>
      </div>

      {(error || success) && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            error
              ? 'bg-red-500/10 border border-red-500/30 text-red-500'
              : 'bg-green-500/10 border border-green-500/30 text-green-500'
          }`}
          role="alert"
        >
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-heading text-lg font-semibold text-[var(--color-text)] mb-4">
              Supplier
            </h2>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            >
              <option value="">Select a supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} {supplier.email && `(${supplier.email})`}
                </option>
              ))}
            </select>
          </section>

          <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-heading text-lg font-semibold text-[var(--color-text)] mb-4">
              Add Products
            </h2>
            <div className="mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-[var(--color-muted)] py-8">
                  {query ? 'No products match your search' : 'No products available'}
                </p>
              ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                  {filteredProducts.map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center justify-between p-4 hover:bg-[var(--color-muted)]/20 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--color-text)] truncate">
                            {product.name}
                          </span>
                          <span className="text-sm text-[var(--color-muted)] font-mono">
                            {product.sku}
                          </span>
                          {isLowStock(product) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30">
                              Low Stock
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-[var(--color-muted)]">
                          <span>Stock: {product.stock}</span>
                          <span className="font-medium text-[var(--color-text)]">
                            {formatMoney(product.price)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-2 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors whitespace-nowrap"
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 sticky top-24">
            <h2 className="font-heading text-lg font-semibold text-[var(--color-text)] mb-4">
              Cart ({cart.length})
            </h2>
            {cart.length === 0 ? (
              <div className="text-center text-[var(--color-muted)] py-12">
                <svg
                  className="mx-auto h-12 w-12 text-[var(--color-muted)]/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <p className="mt-4">Cart is empty</p>
                <p className="text-sm">Add products from the list</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-muted)] border-b border-[var(--color-border)]">
                        <th className="pb-2">Product</th>
                        <th className="pb-2 text-right">Qty</th>
                        <th className="pb-2 text-right">Subtotal</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {cart.map((item) => (
                        <tr key={item.product.id}>
                          <td className="py-3">
                            <div className="font-medium text-[var(--color-text)]">
                              {item.product.name}
                            </div>
                            <div className="text-xs text-[var(--color-muted)] font-mono">
                              {item.product.sku}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity - 1)
                                }
                                className="w-8 h-8 flex items-center justify-center rounded border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-10 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity + 1)
                                }
                                className="w-8 h-8 flex items-center justify-center rounded border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
                                aria-label="Increase quantity"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-right font-medium text-[var(--color-text)]">
                            {formatMoney(getSubtotal(item))}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-[var(--color-muted)] hover:text-red-500 transition-colors"
                              aria-label="Remove item"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
                  <div className="flex justify-between text-[var(--color-text)]">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatMoney(getTotal())}</span>
                  </div>
                  <div className="flex justify-between text-[var(--color-text)] font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatMoney(getTotal())}</span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedSupplierId || cart.length === 0}
                    className="w-full py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creating...' : 'Create Purchase'}
                  </button>
                  {!selectedSupplierId && cart.length > 0 && (
                    <p className="text-sm text-amber-500 text-center">
                      Please select a supplier to proceed
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}