"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/session";
import { ApplicationsIcon, HomeIcon, PostingsIcon, ProfileIcon, SearchIcon, StatusIcon } from "./Icons";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  Icon: typeof StatusIcon;
};

// Each role sees only its own entries ("Navigation" in spec/ui-drafts.md). An entry joins its list
// when its page is built: the recruiter's Home and Organizations and the administrator's Home and
// Recruiter requests are still missing. Until the recruiter's postings list exists, Postings opens
// the posting form, the only recruiter page there is.
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
    items: [{ href: "/recruiter/postings/new", label: "Postings", shortLabel: "Postings", Icon: PostingsIcon }],
  },
  ADMINISTRATOR: {
    caption: "Administration",
    items: [{ href: "/admin/postings", label: "Posting approvals", shortLabel: "Postings", Icon: StatusIcon }],
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
            className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 ${
              isCurrent(href) ? "bg-secondary font-semibold" : "hover:bg-base-100"
            }`}
          >
            <Icon />
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
            className={`flex min-h-24 flex-col justify-center gap-2 rounded-2xl px-4 ${
              isCurrent(href) ? "bg-secondary font-semibold" : "border border-base-300 bg-base-100 font-medium"
            }`}
          >
            <Icon />
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
