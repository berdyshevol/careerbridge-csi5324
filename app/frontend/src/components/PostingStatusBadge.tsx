// The posting's stage in its own life, apart from the applicants' stages (spec/screens/recruiter-postings.html)
const LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  RETURNED: "Returned",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  CLOSED: "Closed",
};

const TONES: Record<string, string> = {
  PUBLISHED: "bg-secondary text-secondary-content",
  RETURNED: "bg-warning text-warning-content",
  PENDING_APPROVAL: "bg-base-200 text-base-content",
  DRAFT: "border border-base-300 bg-transparent text-muted",
  EXPIRED: "bg-error/15 text-error",
  REJECTED: "bg-error/15 text-error",
  CLOSED: "border border-base-300 bg-transparent text-muted",
};

export default function PostingStatusBadge({
  postStatus,
  closingReason,
  className = "",
}: {
  postStatus: string;
  closingReason?: string | null;
  className?: string;
}) {
  const label = LABELS[postStatus] ?? postStatus;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-center text-sm font-semibold whitespace-nowrap ${
        TONES[postStatus] ?? TONES.DRAFT
      } ${className}`}
    >
      {postStatus === "CLOSED" && closingReason ? `${label} · ${closingReason}` : label}
    </span>
  );
}
