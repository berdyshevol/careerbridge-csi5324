import { TONES } from "./statusTones";

// The posting's stage in its own life, apart from the applicants' stages (spec/screens/recruiter-postings.html)
const STATUSES: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: "Draft", tone: TONES.ended },
  PENDING_APPROVAL: { label: "Pending approval", tone: TONES.neutral },
  RETURNED: { label: "Returned", tone: TONES.attention },
  PUBLISHED: { label: "Published", tone: TONES.good },
  REJECTED: { label: "Rejected", tone: TONES.bad },
  EXPIRED: { label: "Expired", tone: TONES.bad },
  CLOSED: { label: "Closed", tone: TONES.ended },
};

// The backend's reason "Closed by recruiter" would read "Closed · Closed by recruiter"
const REASON_LABELS: Record<string, string> = { "Closed by recruiter": "by recruiter" };

export default function PostingStatusBadge({
  postStatus,
  closingReason,
  className = "",
}: {
  postStatus: string;
  closingReason?: string | null;
  className?: string;
}) {
  const { label, tone } = STATUSES[postStatus] ?? { label: postStatus, tone: TONES.ended };
  return (
    <span
      className={`pill ${tone} ${className}`}
    >
      {postStatus === "CLOSED" && closingReason ? `${label} · ${REASON_LABELS[closingReason] ?? closingReason}` : label}
    </span>
  );
}
