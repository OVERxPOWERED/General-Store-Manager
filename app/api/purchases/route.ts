import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplierId, items } = body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'supplierId and items array are required' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Each item must have productId and quantity > 0' },
          { status: 400 }
        );
      }
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        return NextResponse.json(
          { error: 'Each item must have unitPrice >= 0' },
          { status: 400 }
        );
      }
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    const productIds = items.map((item: { productId: string }) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map(p => p.id));
      const missingIds = productIds.filter((id: string) => !foundIds.has(id));
      return NextResponse.json(
        { error: `Products not found: ${missingIds.join(', ')}` },
        { status: 404 }
      );
    }

    const productMap = new Map(products.map(p => [p.id, p]));

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.unitPrice;
    }

    const purchase = await prisma.$transaction(async (tx) => {
      const createdPurchase = await tx.purchase.create({
        data: {
          supplierId,
          totalAmount,
          status: 'RECEIVED',
        },
      });

      const purchaseItemsData = items.map((item: { productId: string; quantity: number; unitPrice: number }) => ({
        purchaseId: createdPurchase.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

      await tx.purchaseItem.createMany({
        data: purchaseItemsData,
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      return createdPurchase;
    });

    const purchaseWithItems = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(purchaseWithItems, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase' },
      { status: 500 }
    );
  }
}