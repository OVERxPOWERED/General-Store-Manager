import { prisma } from '@/lib/prisma';
import { formatMoney, formatDate } from '@/lib/format';
import Link from 'next/link';

export default async function PurchasesHistoryPage() {
  const purchases = await prisma.purchase.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Purchase History</h1>
        <Link
          href="/purchases"
          className="btn btn-primary"
        >
          New Purchase
        </Link>
      </div>

      {purchases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--color-ink-muted)] mb-4">No purchases recorded yet.</p>
          <Link href="/purchases" className="btn btn-primary">
            Create First Purchase
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-3 px-4 font-medium text-[var(--color-ink-muted)]">Purchase #</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--color-ink-muted)]">Supplier</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--color-ink-muted)]">Date</th>
                <th className="text-right py-3 px-4 font-medium text-[var(--color-ink-muted)]">Items</th>
                <th className="text-right py-3 px-4 font-medium text-[var(--color-ink-muted)]">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
                const totalQuantity = purchase.items.reduce((sum, item) => sum + item.quantity, 0);
                const totalAmount = purchase.items.reduce(
                  (sum, item) => sum + item.quantity * Number(item.unitCost),
                  0
                );

                return (
                  <tr
                    key={purchase.id}
                    className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-[var(--color-ink)]">
                      {purchase.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-[var(--color-ink)]">
                      {purchase.supplier.name}
                    </td>
                    <td className="py-3 px-4 text-[var(--color-ink-muted)]">
                      {formatDate(purchase.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--color-ink-muted)]">
                      {totalQuantity}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[var(--color-ink)]">
                      {formatMoney(totalAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}