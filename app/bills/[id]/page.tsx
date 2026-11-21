import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import PrintButton from "@/components/PrintButton";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!bill) notFound();

  return (
    <div className="max-w-xl">
      <div className="no-print mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl">Bill #{bill.billNumber}</h1>
        <div className="flex gap-3">
          <PrintButton />
          <a
            href={`/api/bills/${bill.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--color-primary-hover)]"
          >
            Download PDF
          </a>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-paper-raised)] p-6">
        <div className="mb-4 border-b border-[var(--color-border)] pb-4">
          <p className="font-heading text-lg">General Store</p>
          <p className="text-sm text-[var(--color-ink-muted)]">Bill #{bill.billNumber}</p>
          <p className="text-sm text-[var(--color-ink-muted)]">{formatDate(bill.createdAt)}</p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-ink-muted)]">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item) => (
              <tr key={item.id} className="border-b border-[var(--color-border)]">
                <td className="py-2">{item.product.name}</td>
                <td className="py-2 text-right tnum">{item.quantity}</td>
                <td className="py-2 text-right tnum">{formatMoney(item.priceAtSale.toString())}</td>
                <td className="py-2 text-right tnum">
                  {formatMoney(Number(item.priceAtSale) * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <p className="font-heading text-lg">
            Total&nbsp;&nbsp;{formatMoney(bill.totalAmount.toString())}
          </p>
        </div>
      </div>
    </div>
  );
}
