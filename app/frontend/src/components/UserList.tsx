import type { UserDirectory } from "@/lib/api";
import { ROLE_LABELS, type Role } from "@/lib/session";
import UserItem from "./UserItem";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

function count(role: Role, users: number) {
  const word = ROLE_LABELS[role].toLowerCase();
  return `${users} ${users === 1 ? word : `${word}s`}`;
}

// Minimum scope Administrator 2: every user with their role and account status, and how many each role has;
// Administrator 3: deactivate and reactivate recruiter accounts (FR-ADM.2)
export default function UserList({ directory, token }: { directory: UserDirectory; token: string }) {
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
            <UserItem key={user.userId} user={user} token={token} />
          ))}
        </ul>
      </section>
    </div>
  );
}
