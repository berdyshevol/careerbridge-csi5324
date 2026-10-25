"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, ROLE_LABELS, type SessionUser } from "@/lib/session";

export default function AccountMenu({ user }: { user: SessionUser | null }) {
  const router = useRouter();

  // Register is the only way to start a session until Log In is built
  if (!user) {
    return (
      <Link href="/register" className="btn btn-ghost">
        Register
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
      <Link href="/profile" aria-label={label} className="btn btn-circle btn-primary font-semibold">
        {initials}
      </Link>
      <button type="button" onClick={logOut} className="btn btn-ghost btn-sm">
        Log out
      </button>
    </div>
  );
}
