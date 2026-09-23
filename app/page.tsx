import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";

const LOW_STOCK_THRESHOLD = 5;

export default async function OverviewPage() {
  const [productCount, lowStockCount, billCount, todaysBills] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lt: LOW_STOCK_THRESHOLD } } }),
    prisma.bill.count(),
    prisma.bill.findMany({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      select: { totalAmount: true },
    }),
  ]);

  const todaysRevenue = todaysBills.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const stats = [
    { label: "Products", value: productCount, href: "/products" },
    { label: "Low stock items", value: lowStockCount, href: "/products", warn: lowStockCount > 0 },
    { label: "Bills issued", value: billCount, href: "/bills" },
    { label: "Today's revenue", value: formatMoney(todaysRevenue), href: "/bills" },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl mb-6">Overview</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-paper-raised)] p-4 hover:border-[var(--color-primary)]"
          >
            <p className="text-xs text-[var(--color-ink-muted)]">{stat.label}</p>
            <p
              className={`mt-1 font-heading text-2xl tnum ${
                stat.warn ? "text-[var(--color-accent)]" : ""
              }`}
            >
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/billing"
          className="rounded bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--color-primary-hover)]"
        >
          New bill
        </Link>
        <Link
          href="/products"
          className="rounded border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-paper-raised)]"
        >
          Manage products
        </Link>
      </div>
    </div>
  );
}
