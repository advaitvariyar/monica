"use client";

import { CalendarClock, House, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "Home", icon: House },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/availability", label: "Availability", icon: CalendarClock },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Inline links for the desktop top bar. */
export function TopNavLinks() {
  const isActive = useIsActive();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
      {items.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
            isActive(href) && "bg-muted text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Fixed tab bar for phones. */
export function BottomTabBar() {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="grid grid-cols-3">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground",
                isActive(href) && "text-primary",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
