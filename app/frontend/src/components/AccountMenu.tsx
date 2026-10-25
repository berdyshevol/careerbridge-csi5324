"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, ROLE_LABELS, type SessionUser } from "@/lib/session";

export default function AccountMenu({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const pathname = usePathname();

  if (!user) {
    const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
    // The search too, read at the click: useSearchParams would need a Suspense boundary around the header
    const withSearch = (event: React.MouseEvent) => {
      if (next && window.location.search) {
        event.preventDefault();
        router.push(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
      }
    };
    return (
      <Link href={`/login${next}`} onClick={withSearch} className="btn btn-ghost">
        Log in
      </Link>
    );
  }

  function logOut() {
    clearSession();
    router.push("/");
    router.refresh();
  }

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  const label = `${user.firstName} ${user.lastName}, ${ROLE_LABELS[user.role]}`;

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-right text-sm leading-tight sm:block">
        <span className="block font-medium">
          {user.firstName} {user.lastName}
        </span>
        <span className="block text-muted">{ROLE_LABELS[user.role]}</span>
      </span>
      {user.role === "APPLICANT" ? (
        <Link href="/profile" aria-label={label} className="btn btn-circle btn-primary font-semibold">
          {initials}
        </Link>
      ) : (
        <span aria-label={label} className="btn btn-circle btn-primary pointer-events-none font-semibold">
          {initials}
        </span>
      )}
      <button type="button" onClick={logOut} className="btn btn-ghost btn-sm">
        Log out
      </button>
    </div>
  );
}
