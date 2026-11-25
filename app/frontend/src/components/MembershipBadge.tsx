import type { MembershipStatus } from "@/lib/api";

const badgeStyle: Partial<Record<MembershipStatus, string>> = {
  ACTIVE: "badge-secondary",
  DENIED: "badge-error badge-soft",
  INFORMATION_REQUESTED: "badge-warning",
};

// A membership's status (UC-09 steps 4 and 8)
export default function MembershipBadge({ status, label }: { status: MembershipStatus; label: string }) {
  return <span className={`badge shrink-0 ${badgeStyle[status] ?? ""}`}>{label}</span>;
}
