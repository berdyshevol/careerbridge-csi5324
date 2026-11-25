import type { UserDirectory, UserRow } from "@/lib/api";
import { ROLE_LABELS, type Role } from "@/lib/session";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

function count(role: Role, users: number) {
  const word = ROLE_LABELS[role].toLowerCase();
  return `${users} ${users === 1 ? word : `${word}s`}`;
}

function UserItem({ user }: { user: UserRow }) {
  return (
    <li className="flex flex-col gap-1 border-b border-base-300 px-4 py-3.5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">
          {user.firstName} {user.lastName}
        </span>
        <span className="badge badge-secondary font-semibold">
          {ROLE_LABELS[user.role]}
        </span>
      </div>
      <span className="break-all text-sm text-muted">{user.email}</span>
      {user.accountStatus === "ACTIVE" ? (
        <span className="text-xs text-muted">Active</span>
      ) : (
        <span className="badge badge-warning w-fit font-semibold">
          Pending verification
        </span>
      )}
    </li>
  );
}

// Minimum scope Administrator 2: every user with their role and account status, and how many each role has
export default function UserList({ directory }: { directory: UserDirectory }) {
  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="Users by role" className="flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <li key={role} className="badge badge-outline font-semibold text-muted">
            {count(role, directory.usersByRole[role] ?? 0)}
          </li>
        ))}
      </ul>
      <section aria-label="Users" className="card overflow-hidden border border-base-300 bg-base-100">
        <ul>
          {directory.users.map((user) => (
            <UserItem key={user.userId} user={user} />
          ))}
        </ul>
      </section>
    </div>
  );
}
