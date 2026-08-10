import Link from "next/link";

import { cn } from "@/lib/utils";
import { toRoute } from "@/lib/routes";

const links = [
  { href: "/supplier", label: "Dashboard" },
  { href: "/supplier/orders/new", label: "New orders" },
  { href: "/supplier/orders/accepted", label: "Accepted" },
  { href: "/supplier/orders/in-production", label: "In production" },
  { href: "/supplier/orders/ready-to-ship", label: "Ready to ship" },
  { href: "/supplier/orders/shipped", label: "Shipped" },
  { href: "/supplier/remakes", label: "Remakes" },
  { href: "/supplier/products", label: "Product mappings" },
  { href: "/supplier/invoices", label: "Invoices" },
  { href: "/supplier/team", label: "Team settings" },
];

export function SupplierSectionNav({ current }: { current?: string }) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2 text-sm" aria-label="Supplier sections">
      {links.map((link) => (
        <Link
          key={link.href}
          href={toRoute(link.href)}
          className={cn(
            "rounded-lg border border-border px-3 py-1.5 hover:bg-muted",
            current === link.href && "bg-muted font-medium",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
