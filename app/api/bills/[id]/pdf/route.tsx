import { NextRequest, NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import BillPdfDocument from "@/components/BillPdfDocument";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  const serialized = {
    ...bill,
    totalAmount: bill.totalAmount.toString(),
    items: bill.items.map((item) => ({
      ...item,
      priceAtSale: item.priceAtSale.toString(),
    })),
  };

  const buffer = await pdf(<BillPdfDocument bill={serialized} />).toBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="bill-${bill.billNumber}.pdf"`,
    },
  });
}
