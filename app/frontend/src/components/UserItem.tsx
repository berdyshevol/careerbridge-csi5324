"use client";

import { useState } from "react";
import { AccountChangeRefused, changeRecruiterAccount, SessionEnded, type UserRow } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/session";
import { TONES } from "./statusTones";

const STATUS_LABELS = {
  ACTIVE: "Active",
  PENDING_VERIFICATION: "Pending verification",
  PENDING_APPROVAL: "Pending approval",
  INACTIVE: "Inactive",
} as const;

type Change = "deactivate" | "reactivate";

// Only an approved recruiter is managed here; a pending or denied one is decided under Recruiter requests
function changeFor(user: UserRow): Change | null {
  if (user.role !== "RECRUITER") {
    return null;
  }
  if (user.accountStatus === "ACTIVE") {
    return "deactivate";
  }
  return user.deactivated ? "reactivate" : null;
}

// One user of the list, and for a recruiter the change that applies to their account (FR-ADM.2)
export default function UserItem({ user, token }: { user: UserRow; token: string }) {
  const [current, setCurrent] = useState(user);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = changeFor(current);
  const name = `${current.firstName} ${current.lastName}`;

  async function apply(next: Change) {
    setError("");
    setBusy(true);
    try {
      setCurrent(await changeRecruiterAccount(token, current.userId, next));
    } catch (err) {
      setError(
        err instanceof AccountChangeRefused
          ? err.message
          : err instanceof SessionEnded
            ? "Your session has ended. Log in again."
            : "The account could not be changed. Try again in a moment.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 border-b border-base-300 px-4 py-3.5 transition-colors last:border-b-0 hover:bg-base-200/50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{name}</span>
          <span className="rounded-lg bg-secondary px-2.5 py-0.5 text-sm font-semibold text-secondary-content">
            {ROLE_LABELS[current.role]}
          </span>
        </div>
        <span className="break-all text-sm text-muted">{current.email}</span>
        {current.accountStatus === "ACTIVE" ? (
          <span className="text-xs text-muted">Active</span>
        ) : (
          <span className={`pill w-fit ${TONES.attention}`}>
            {current.deactivated ? "Deactivated" : STATUS_LABELS[current.accountStatus]}
          </span>
        )}
        {error && (
          <p role="alert" className="alert alert-soft alert-error mt-1 text-sm">
            {error}
          </p>
        )}
      </div>
      {change && (
        <button
          type="button"
          className="btn btn-sm shrink-0"
          disabled={busy}
          onClick={() => void apply(change)}
          aria-label={`${change === "deactivate" ? "Deactivate" : "Reactivate"} ${name}`}
        >
          {change === "deactivate" ? "Deactivate" : "Reactivate"}
        </button>
      )}
    </li>
  );
}
