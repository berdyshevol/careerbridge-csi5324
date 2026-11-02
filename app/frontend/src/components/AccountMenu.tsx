"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { clearSession, ROLE_LABELS, type SessionUser } from "@/lib/session";

export default function AccountMenu({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const pathname = usePathname();

  if (!user) {
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
    // The search too, read at the click: useSearchParams would need a Suspense boundary around the header
    const withSearch = (event: React.MouseEvent) => {
      if (next && window.location.search) {
        event.preventDefault();
        router.push(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
      }
    };
    return (
      // The log-in and register pages offer only the other one (mockups visitor-login, visitor-register)
      <div className="flex items-center gap-2">
        {pathname !== "/login" && (
          <Link href={`/login${next}`} onClick={withSearch} className="btn btn-ghost btn-sm">
            Log in
          </Link>
        )}
        {pathname !== "/register" && (
          <Link href="/register" className="btn btn-sm border-base-300 bg-base-100">
            Register
          </Link>
        )}
      </div>
    );
  }

  return <SignedIn user={user} />;
}

// Who is logged in, and behind the avatar the account menu: rare actions stay out of the dock
// (spec/ui-drafts.md, Navigation 9)
function SignedIn({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const avatar = useRef<HTMLButtonElement>(null);
  // /styleguide draws a second menu beside the header's
  const menuId = useId();

  function logOut() {
    clearSession();
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    const closeOutside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        avatar.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const name = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div
      ref={menu}
      // Tabbing past Log out leaves the menu, so it closes rather than stay open over the page. No
      // relatedTarget is a click (Safari does not focus a clicked button): the pointerdown handles it.
      onBlur={(event) => {
        if (event.relatedTarget && !menu.current?.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
      className="relative flex items-center gap-3"
    >
      <span className="hidden text-right text-sm leading-tight sm:block">
        <span className="block font-medium">{name}</span>
        <span className="block text-muted">{ROLE_LABELS[user.role]}</span>
      </span>
      <button
        ref={avatar}
        type="button"
        aria-label={`Account menu for ${name}, ${ROLE_LABELS[user.role]}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(!open)}
        className="btn btn-circle btn-primary font-semibold"
      >
        {initials}
      </button>
      {open && (
        <ul
          id={menuId}
          className="menu absolute right-0 top-full z-10 mt-2 w-44 rounded-box border border-base-300 bg-base-100 p-2"
        >
          <li>
            <button type="button" onClick={logOut}>
              Log out
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
