import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const PAGE_SIZE = 20;

export const metadata: Metadata = {
  title: 'Purchase History',
  description: 'View all purchase records',
};

interface SearchParams {
  page?: string;
}

interface PurchaseWithRelations {
  id: string;
  purchaseNumber: string;
  purchaseDate: Date;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes: string | null;
  supplier: {
    id: string;
    name: string;
  } | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
      id: string;
      name: string;
      sku: string | null;
    } | null;
  }[];
}

async function getPurchases(page: number): Promise<{
  purchases: PurchaseWithRelations[];
  totalCount: number;
  hasNextPage: boolean;
  totalPages: number;
}> {
  const skip = (page - 1) * PAGE_SIZE;
  
  const [purchases, totalCount] = await Promise.all([
    prisma.purchase.findMany({
      skip,
      take: PAGE_SIZE + 1,
      orderBy: { purchaseDate: 'desc' },
      include: {
        supplier: {
          select: { id: true, name: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
    }),
    prisma.purchase.count(),
  ]);

  const hasNextPage = purchases.length > PAGE_SIZE;
  const paginatedPurchases = hasNextPage ? purchases.slice(0, PAGE_SIZE) : purchases;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return {
    purchases: paginatedPurchases,
    totalCount,
    hasNextPage,
    totalPages,
  };
}

export default async function PurchaseHistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedSearchParams.page || '1', 10));
  
  const { purchases, totalCount, hasNextPage, totalPages } = await getPurchases(page);

  const createPageUrl = (pageNum: number) => {
    const params = new SearchParams();
    if (pageNum > 1) {
      params.set('page', pageNum.toString());
    }
    return `/purchases/history?${params.toString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Purchase History</h1>
        <Link
          href="/purchases/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Purchase
        </Link>
      </div>

      {purchases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No purchases found.</p>
          <Link
            href="/purchases/new"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create your first purchase
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {purchase.purchaseNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(purchase.purchaseDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.supplier?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.items.length} item{purchase.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(purchase.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          purchase.status === 'RECEIVED'
                            ? 'bg-green-100 text-green-800'
                            : purchase.status === 'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-800'
                            : purchase.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue