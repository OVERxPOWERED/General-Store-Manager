import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";

export default async function BillsPage() {
  const bills = await prisma.bill.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <h1 className="font-heading text-2xl mb-6">Bill history</h1>

      {bills.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">
          No bills yet.{" "}
          <Link href="/billing" className="text-[var(--color-primary)] hover:underline">
            Create your first one.
          </Link>
        </p>
      ) : (
        <table className="w-full max-w-2xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-ink-muted)]">
              <th className="py-2">Bill #</th>
              <th className="py-2">Date</th>
              <th className="py-2 text-right">Items</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id} className="border-b border-[var(--color-border)]">
                <td className="py-2">
                  <Link
                    href={`/bills/${bill.id}`}
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    #{bill.billNumber}
                  </Link>
                </td>
                <td className="py-2 text-[var(--color-ink-muted)]">
                  {formatDate(bill.createdAt)}
                </td>
                <td className="py-2 text-right tnum">{bill.items.length}</td>
                <td className="py-2 text-right tnum">{formatMoney(bill.totalAmount.toString())}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
