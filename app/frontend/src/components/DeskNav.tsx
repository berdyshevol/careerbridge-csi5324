"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/session";
import { ApplicationsIcon, HomeIcon, OrganizationsIcon, PostingsIcon, ProfileIcon, RequestsIcon, SearchIcon, StatusIcon, UsersIcon } from "./Icons";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  Icon: typeof StatusIcon;
};

// Each role sees only its own entries ("Navigation" in spec/screens/README.md). An entry joins its list
// when its page is built: the recruiter's Home and the administrator's Home are still missing.
const navigation: Record<Role, { caption: string; items: NavItem[] }> = {
  APPLICANT: {
    caption: "Your desk",
    items: [
      { href: "/", label: "Home", shortLabel: "Home", Icon: HomeIcon },
      { href: "/jobs", label: "Find jobs", shortLabel: "Jobs", Icon: SearchIcon },
      { href: "/applications", label: "Applications", shortLabel: "Applications", Icon: ApplicationsIcon },
      { href: "/profile", label: "Profile", shortLabel: "Profile", Icon: ProfileIcon },
    ],
  },
  RECRUITER: {
    caption: "Recruiting",
    items: [
      { href: "/recruiter/postings", label: "Postings", shortLabel: "Postings", Icon: PostingsIcon },
      { href: "/recruiter/organizations", label: "Organizations", shortLabel: "Organizations", Icon: OrganizationsIcon },
    ],
  },
  ADMINISTRATOR: {
    caption: "Administration",
    items: [
      { href: "/admin/postings", label: "Posting approvals", shortLabel: "Postings", Icon: StatusIcon },
      { href: "/admin/requests", label: "Recruiter requests", shortLabel: "Requests", Icon: RequestsIcon },
      { href: "/admin/users", label: "Users", shortLabel: "Users", Icon: UsersIcon },
    ],
  },
};

// Spelled out so Tailwind finds every class it may need
const tileColumns = ["", "md:grid-cols-1", "md:grid-cols-2", "md:grid-cols-3", "md:grid-cols-4"];

export default function DeskNav({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const section = role ? navigation[role] : null;
  if (!section?.items.length) {
    return null;
  }
  const { caption, items } = section;

  // "/" is the home of every role, so only an exact match marks it
  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav aria-label="Navigation" className="hidden w-64 shrink-0 flex-col gap-2 lg:flex">
        <p className="px-3 pb-2 pt-1 text-sm font-semibold uppercase tracking-wider text-muted">
          {caption}
        </p>
        {items.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent(href) ? "page" : undefined}
            // The current entry: tinted, with a bar in the role's color at its left edge
            className={`relative flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
              isCurrent(href)
                ? "bg-secondary font-semibold text-secondary-content before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-primary"
                : "text-muted hover:bg-base-100 hover:text-base-content"
            }`}
          >
            <Icon className={isCurrent(href) ? "size-5 text-primary" : undefined} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <nav aria-label="Navigation" className={`hidden gap-3 md:grid lg:hidden ${tileColumns[items.length]}`}>
        {items.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent(href) ? "page" : undefined}
            className={`flex min-h-24 flex-col justify-center gap-2 rounded-2xl border px-4 ${
              isCurrent(href)
                ? "border-primary bg-secondary font-semibold text-secondary-content ring-1 ring-primary"
                : "hover-raise border-base-300 bg-base-100 font-medium"
            }`}
          >
            <Icon className={isCurrent(href) ? "size-5 text-primary" : undefined} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <nav aria-label="Navigation" className="dock border-t border-base-300 bg-base-100 md:hidden">
        {items.map(({ href, shortLabel, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent(href) ? "page" : undefined}
            // daisyUI's own bar under the entry stays hidden; a short bar hangs from the dock's top edge instead
            // (-top-2 undoes the dock's padding)
            className={`transition-colors after:hidden ${
              isCurrent(href)
                ? "font-semibold text-primary before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:h-[3px] before:w-8 before:rounded-b-full before:bg-primary"
                : "text-muted hover:text-base-content"
            }`}
          >
            <Icon />
            <span className="dock-label">{shortLabel}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
