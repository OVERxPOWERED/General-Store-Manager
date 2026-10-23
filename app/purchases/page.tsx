import { prisma } from '@/lib/prisma';
import { formatMoney, formatDate } from '@/lib/format';
import Link from 'next/link';

export default async function PurchasesPage() {
  const purchases = await prisma.purchase.findMany({
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text)]">
          Purchase History
        </h1>
        <Link
          href="/purchasing"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Purchase
        </Link>
      </div>

      {purchases.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-[var(--color-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h2 className="mt-4 font-heading text-xl font-semibold text-[var(--color-text)]">
            No purchases yet
          </h2>
          <p className="mt-2 text-[var(--color-muted)]">
            Start by creating your first purchase order.
          </p>
          <Link
            href="/purchasing"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            Create Purchase
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--color-muted)]/30 border-b border-[var(--color-border)]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  Purchase #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-[var(--color-muted)]/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-[var(--color-text)]">
                      {purchase.id.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-[var(--color-text)]">
                        {purchase.supplier.name}
                      </p>
                      {purchase.supplier.email && (
                        <p className="text-sm text-[var(--color-muted)]">
                          {purchase.supplier.email}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text)]">
                    {formatDate(purchase.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text)]">
                    {purchase.items.length} item{purchase.items.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-[var(--color-text)]">
                    {formatMoney(purchase.total)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/purchases/${purchase.id}`}
                      className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}