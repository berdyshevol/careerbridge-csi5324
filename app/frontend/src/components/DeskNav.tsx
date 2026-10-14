
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  OfferIcon,
  ProfileIcon,
  SearchIcon,
  StatusIcon,
} from "./Icons";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  Icon: typeof StatusIcon;
};

const deskItems: NavItem[] = [
  {
    href: "/applications",
    label: "Track status",
    shortLabel: "Status",
    Icon: StatusIcon,
  },
  {
    href: "/jobs",
    label: "Find jobs",
    shortLabel: "Jobs",
    Icon: SearchIcon,
  },
  {
    href: "/offers",
    label: "Job offers",
    shortLabel: "Offers",
    Icon: OfferIcon,
  },
  {
    href: "/profile",
    label: "Profile & resume",
    shortLabel: "Profile",
    Icon: ProfileIcon,
  },
];

const recruiterItems: NavItem[] = [
  {
    href: "/recruiter/register",
    label: "Recruiter registration",
    shortLabel: "Register",
    Icon: ProfileIcon,
  },
  {
    href: "/recruiter/postings/new",
    label: "Create job posting",
    shortLabel: "Create",
    Icon: OfferIcon,
  },
];

const adminItems: NavItem[] = [
  {
    href: "/admin/postings",
    label: "Job posting approvals",
    shortLabel: "Approvals",
    Icon: StatusIcon,
  },
];

const allItems = [...deskItems, ...recruiterItems, ...adminItems];

export default function DeskNav() {
  const pathname = usePathname();

  const isCurrent = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  function renderDesktopLink({ href, label, Icon }: NavItem) {
    return (
      <Link
        key={href}
        href={href}
        aria-current={isCurrent(href) ? "page" : undefined}
        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 ${
          isCurrent(href)
            ? "bg-secondary font-semibold"
            : "hover:bg-base-100"
        }`}
      >
        <Icon />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        aria-label="CareerBridge navigation"
        className="hidden w-64 shrink-0 flex-col gap-2 lg:flex"
      >
        <p className="px-3 pb-2 pt-1 text-sm font-semibold uppercase tracking-wider text-muted">
          Your desk
        </p>

        {deskItems.map(renderDesktopLink)}

        <div className="my-3 border-t border-base-300" />

        <p className="px-3 pb-2 text-sm font-semibold uppercase tracking-wider text-muted">
          Recruiter workspace
        </p>

        {recruiterItems.map(renderDesktopLink)}

        <div className="my-3 border-t border-base-300" />

        <p className="px-3 pb-2 text-sm font-semibold uppercase tracking-wider text-muted">
          Administration
        </p>

        {adminItems.map(renderDesktopLink)}
      </nav>

      {/* Tablet navigation */}
      <nav
        aria-label="CareerBridge navigation"
        className="hidden grid-cols-2 gap-3 sm:grid-cols-3 md:grid lg:hidden"
      >
        {allItems.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent(href) ? "page" : undefined}
            className={`flex min-h-24 flex-col justify-center gap-2 rounded-2xl px-4 ${
              isCurrent(href)
                ? "bg-secondary font-semibold"
                : "border border-base-300 bg-base-100 font-medium"
            }`}
          >
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Mobile navigation */}
      <nav
        aria-label="CareerBridge navigation"
        className="dock border-t border-base-300 bg-base-100 md:hidden"
      >
        {deskItems.map(({ href, shortLabel, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent(href) ? "page" : undefined}
            className={
              isCurrent(href)
                ? "dock-active font-semibold text-primary"
                : "text-muted"
            }
          >
            <Icon />
            <span className="dock-label">{shortLabel}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
