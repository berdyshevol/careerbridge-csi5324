"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OfferIcon, ProfileIcon, SearchIcon, StatusIcon } from "./Icons";

const items = [
  { href: "/applications", label: "Track status", shortLabel: "Status", Icon: StatusIcon },
  { href: "/jobs", label: "Find jobs", shortLabel: "Jobs", Icon: SearchIcon },
  { href: "/offers", label: "Job offers", shortLabel: "Offers", Icon: OfferIcon },
  { href: "/profile", label: "Profile & resume", shortLabel: "Profile", Icon: ProfileIcon },
];

export default function DeskNav() {
  const pathname = usePathname();
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav aria-label="Your desk" className="hidden w-56 shrink-0 flex-col gap-2 lg:flex">
        <p className="px-3 pb-2 pt-1 text-sm font-semibold uppercase tracking-wider text-muted">
          Your desk
        </p>
        {items.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent(href) ? "page" : undefined}
            className={`flex h-14 items-center gap-3 rounded-xl px-3 ${
              isCurrent(href) ? "bg-secondary font-semibold" : "hover:bg-base-100"
            }`}
          >
            <Icon />
            {label}
          </Link>
        ))}
      </nav>

      <nav aria-label="Your desk" className="hidden grid-cols-4 gap-3 md:grid lg:hidden">
        {items.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent(href) ? "page" : undefined}
            className={`flex h-22 flex-col justify-center gap-2 rounded-2xl px-4 ${
              isCurrent(href)
                ? "bg-secondary font-semibold"
                : "border border-base-300 bg-base-100 font-medium"
            }`}
          >
            <Icon />
            {label}
          </Link>
        ))}
      </nav>

      <nav aria-label="Your desk" className="dock border-t border-base-300 bg-base-100 md:hidden">
        {items.map(({ href, shortLabel, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent(href) ? "page" : undefined}
            className={isCurrent(href) ? "dock-active font-semibold text-primary" : "text-muted"}
          >
            <Icon />
            <span className="dock-label">{shortLabel}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
