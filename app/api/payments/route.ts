import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, amount, note } = body;

    if (!customerId || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid input: customerId (string) and amount (number) are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('CUSTOMER_NOT_FOUND');
      }

      const payment = await tx.payment.create({
        data: {
          customerId,
          amount,
          note: note ?? null,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      return payment;
    });

    const paymentWithCustomer = await prisma.payment.findUnique({
      where: { id: result.id },
      include: { customer: true },
    });

    return NextResponse.json(paymentWithCustomer, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'CUSTOMER_NOT_FOUND') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}