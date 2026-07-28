"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/activities", label: "Activities" },
  { href: "/admin/xp", label: "XP adjustments" },
  { href: "/admin/feedback", label: "Feedback" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1.5">
      {ADMIN_NAV.map((item) => {
        // "/admin" is a prefix of every other admin route, so it can only
        // ever match exactly — everything else uses normal prefix matching.
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/dashboard"
        className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Exit
      </Link>
    </nav>
  );
}
