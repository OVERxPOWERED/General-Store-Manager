import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, sku, category, price, stock } = body;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { name, sku, category: category || null, price, stock },
    });
    return NextResponse.json(product);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "A product with that SKU already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Could not update product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not delete product (it may be used in past bills)" },
      { status: 400 }
    );
  }
}
