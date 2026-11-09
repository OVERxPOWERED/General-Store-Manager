import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const supplierId = searchParams.get('supplierId') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const validSortFields = ['createdAt', 'totalAmount'];
    const validSortOrders = ['asc', 'desc'];

    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100);

    const where = supplierId ? { supplierId } : {};

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { [safeSortBy]: safeSortOrder },
        skip,
        take,
      }),
      prisma.purchase.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: purchases,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Purchase list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}

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
      if (!item.productId || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
        return NextResponse.json(
          { error: 'Each item must have productId, quantity (number), and unitPrice (number)' },
          { status: 400 }
        );
      }
      if (item.quantity <= 0 || item.unitPrice < 0) {
        return NextResponse.json(
          { error: 'Quantity must be positive and unitPrice must be non-negative' },
          { status: 400 }
        );
      }
    }

    const purchase = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({
        where: { id: supplierId },
      });

      if (!supplier) {
        throw new Error('SUPPLIER_NOT_FOUND');
      }

      const productIds = items.map((item: { productId: string }) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        const foundIds = new Set(products.map((p) => p.id));
        const missingIds = productIds.filter((id: string) => !foundIds.has(id));
        throw new Error(`PRODUCTS_NOT_FOUND:${missingIds.join(',')}`);
      }

      const totalAmount = items.reduce(
        (sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice,
        0
      );

      const createdPurchase = await tx.purchase.create({
        data: {
          supplierId,
          totalAmount,
          status: 'RECEIVED',
          items: {
            create: items.map((item: { productId: string; quantity: number; unitPrice: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          supplier: true,
        },
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

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'SUPPLIER_NOT_FOUND') {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
      }
      if (error.message.startsWith('PRODUCTS_NOT_FOUND:')) {
        const missingIds = error.message.split(':')[1];
        return NextResponse.json(
          { error: `Products not found: ${missingIds}` },
          { status: 404 }
        );
      }
    }

    console.error('Purchase creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase' },
      { status: 500 }
    );
  }
}