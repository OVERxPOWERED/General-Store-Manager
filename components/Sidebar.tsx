"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/products", label: "Products" },
  { href: "/billing", label: "New bill" },
  { href: "/bills", label: "Bill history" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="no-print w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-paper-raised)] px-4 py-6">
      <div className="mb-8 px-2">
        <p className="font-heading text-lg leading-tight">General Store</p>
        <p className="text-xs text-[var(--color-ink-muted)]">Management</p>
      </div>
      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-ink)] hover:bg-[var(--color-paper)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
