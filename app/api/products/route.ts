import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, sku, category, price, stock } = body;

  if (!name || !sku || price === undefined) {
    return NextResponse.json(
      { error: "name, sku and price are required" },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category: category || null,
        price,
        stock: stock ?? 0,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "A product with that SKU already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Could not create product" }, { status: 500 });
  }
}
