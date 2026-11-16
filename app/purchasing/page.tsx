import { Metadata } from "next";
import { PrismaClient, Prisma } from "@prisma/client";
import Link from "next/link";
import { formatMoney, formatDate } from "@/lib/format";

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: "Purchase History",
  description: "View and manage purchase orders",
};

interface SearchParams {
  page?: string;
  pageSize?: string;
  sort?: string;
  supplierId?: string;
}

async function getPurchases(searchParams: SearchParams) {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize || "10", 10)));
  const sort = searchParams.sort || "createdAt:desc";
  const supplierId = searchParams.supplierId;

  const [sortField, sortOrder] = sort.split(":") as [keyof Prisma.PurchaseOrderByWithRelationInput, "asc" | "desc"];

  const where: Prisma.PurchaseWhereInput = {};
  if (supplierId) {
    where.supplierId = supplierId;
  }

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    }),
    prisma.purchase.count({ where }),
  ]);

  return { purchases, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

async function getSuppliers() {
  return prisma.supplier.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

function SortLink({ href, children, currentSort, params }: {
  href: string;
  children: React.ReactNode;
  currentSort: string;
  params: SearchParams;
}) {
  const [field, order] = currentSort.split(":");
  const newOrder = field === params.sort?.split(":")[0] && order === "asc" ? "desc" : "asc";
  const newSort = `${field}:${newOrder}`;
  
  const searchParams = new URLSearchParams(params as Record<string, string>);
  searchParams.set("sort", newSort);
  searchParams.delete("page");

  return (
    <a href={`${href}?${searchParams.toString()}`} className="flex items-center gap-1 hover:underline">
      {children}
      {field === params.sort?.split(":")[0] && (
        <span>{order === "asc" ? "↑" : "↓"}</span>
      )}
    </a>
  );
}

function Pagination({ 
  page, 
  pageSize, 
  totalPages, 
  total,
  params,
  href 
}: {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  params: SearchParams;
  href: string;
}) {
  if (totalPages <= 1) return null;

  const searchParams = new URLSearchParams(params as Record<string, string>);
  
  const createPageLink = (p: number) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("page", p.toString());
    return `${href}?${sp.toString()}`;
  };

  const createPageSizeLink = (size: number) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("pageSize", size.toString());
    sp.delete("page");
    return `${href}?${sp.toString()}`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50">
      <div className="text-sm text-gray-700">
        Showing {Math.min((page - 1) * pageSize + 1, total)} to {Math.min(page * pageSize, total)} of {total} purchases
      </div>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => window.location.href = createPageSizeLink(parseInt(e.target.value, 10))}
          className="border rounded px-2 py-1 text-sm"
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>{size} per page</option>
          ))}
        </select>
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <a
            href={page > 1 ? createPageLink(page - 1) : "#"}
            className={`px-3 py-1 rounded border text-sm ${page > 1 ? "bg-white hover:bg-gray-50" : "opacity-50 pointer-events-none"}`}
            aria-label="Previous"
          >
            ← Prev
          </a>
          <span className="px-3 py-1 text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <a
            href={page < totalPages ? createPageLink(page + 1) : "#"}
            className={`px-3 py-1 rounded border text-sm ${page < totalPages ? "bg-white hover:bg-gray-50" : "opacity-50 pointer-events-none"}`}
            aria-label="Next"
          >
            Next →
          </a>
        </nav>
      </div>
    </div>
  );
}

export default async function PurchasingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { purchases, total, page, pageSize, totalPages } = await getPurchases(params);
  const suppliers = await getSuppliers();

  const currentSort = params.sort || "createdAt:desc";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Purchase History</h1>
        <Link
          href="/purchasing/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Purchase
        </Link>
      </div>

      {/* Supplier Filter */}
      <form className="mb-6 flex flex-wrap gap-4 items-end" method="GET">
        <div>
          <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Supplier
          </label>
          <select
            id="supplierId"
            name="supplierId"
            value={params.supplierId || ""}
            onChange={(e) => {
              const sp = new URLSearchParams(params as Record<string, string>);
              if (e.target.value) {
                sp.set("supplierId", e.target.value);
              } else {
                sp.delete("supplierId");
              }
              sp.delete("page");
              window.location.href = `/purchasing?${sp.toString()}`;
            }}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
        {params.supplierId && (
          <a
            href="/purchasing"
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 underline self-end"
          >
            Clear filter
          </a>
        )}
      </form>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortLink href="/purchasing" currentSort={currentSort} params={params}>
                  Purchase #
                </SortLink>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortLink href="/purchasing" currentSort={currentSort} params={params}>
                  Date
                </SortLink>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortLink href="/purchasing" currentSort={currentSort} params={params}>
                  Supplier
                </SortLink>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortLink href="/purchasing" currentSort={currentSort} params={params}>
                  Total
                </SortLink>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  No purchases found
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-mono text-gray-900">
                    {purchase.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {formatDate(purchase.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <Link
                      href={`/suppliers/${purchase.supplier.id}`}
                      className="hover:underline"
                    >
                      {purchase.supplier.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {purchase.items.length} item{purchase.items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                    {formatMoney(purchase.total)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right">
                    <Link
                      href={`/purchasing/${purchase.id}`}
                      className="text-blue-600 hover:text-blue-900 underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          total={total}
          params={params}
          href="/purchasing"
        />
      </div>
    </div>
  );
}