"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";

interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

interface PurchaseLine {
  product: Product;
  quantity: number;
  costPrice: number;
}

export default function PurchasingPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<PurchaseLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCostModal, setShowCostModal] = useState<{ product: Product } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [suppliersRes, productsRes] = await Promise.all([
          fetch("/api/suppliers"),
          fetch("/api/products"),
        ]);
        if (suppliersRes.ok) {
          const data = await suppliersRes.json();
          setSuppliers(data);
        }
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load suppliers or products");
      }
    }
    loadData();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  );

  const handleAddToCart = (product: Product) => {
    setShowCostModal({ product });
  };

  const confirmAddToCart = (costPrice: number) => {
    if (!showCostModal) return;
    const { product } = showCostModal;
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [...prev, { product, quantity: 1, costPrice }];
    });
    setShowCostModal(null);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((line) =>
        line.product.id === productId ? { ...line, quantity } : line
      )
    );
  };

  const updateCostPrice = (productId: string, costPrice: number) => {
    setCart((prev) =>
      prev.map((line) =>
        line.product.id === productId ? { ...line, costPrice } : line
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((line) => line.product.id !== productId));
  };

  const subtotal = cart.reduce(
    (sum, line) => sum + line.costPrice * line.quantity,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const supplierId = (e.target as HTMLFormElement).elements.namedItem(
      "supplierId"
    ) as HTMLSelectElement;
    const selectedSupplierId = supplierId?.value;

    if (!selectedSupplierId) {
      setError("Please select a supplier");
      return;
    }
    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          items: cart.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            costPrice: line.costPrice,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create purchase");
      }

      setCart([]);
      router.push("/purchases");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create purchase");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Create Purchase Order</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label htmlFor="product-search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Products
            </label>
            <input
              id="product-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan