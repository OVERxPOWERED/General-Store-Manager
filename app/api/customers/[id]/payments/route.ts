import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { id: true, balance: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const payments = await prisma.payment.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        note: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      customer: { id: customer.id, balance: customer.balance },
      payments,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, note } = body;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { id: true, balance: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          customerId: id,
          amount,
          note: note ?? null,
        },
        select: {
          id: true,
          amount: true,
          note: true,
          createdAt: true,
        },
      });

      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: { balance: { decrement: amount } },
        select: { balance: true },
      });

      return { payment, balance: updatedCustomer.balance };
    });

    return NextResponse.json(
      {
        payment: result.payment,
        customer: { id, balance: result.balance },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}