import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bills = await prisma.bill.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return NextResponse.json(bills);
}

type IncomingItem = { productId: string; quantity: number };

export async function POST(req: NextRequest) {
  const body = await req.json();
  const items: IncomingItem[] = body.items;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Bill must have at least one item" }, { status: 400 });
  }

  try {
    const bill = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } },
      });

      let total = 0;
      const itemsData = items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (product.stock < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}`);
        }
        const price = Number(product.price);
        total += price * item.quantity;
        return {
          productId: product.id,
          quantity: item.quantity,
          priceAtSale: product.price,
        };
      });

      const newBill = await tx.bill.create({
        data: {
          totalAmount: total,
          items: { create: itemsData },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newBill;
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Could not create bill" },
      { status: 400 }
    );
  }
}
