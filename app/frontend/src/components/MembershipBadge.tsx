import type { MembershipStatus } from "@/lib/api";
import { TONES } from "./statusTones";

const badgeStyle: Partial<Record<MembershipStatus, string>> = {
  ACTIVE: TONES.good,
  DENIED: TONES.bad,
  INFORMATION_REQUESTED: TONES.attention,
};

// A membership's status (UC-09 steps 4 and 8)
export default function MembershipBadge({ status, label }: { status: MembershipStatus; label: string }) {
  return <span className={`pill shrink-0 ${badgeStyle[status] ?? TONES.neutral}`}>{label}</span>;
}
