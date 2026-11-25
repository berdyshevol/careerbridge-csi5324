// The posting's stage in its own life, apart from the applicants' stages (spec/screens/recruiter-postings.html)
const STATUSES: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: "Draft", tone: "border border-base-300 bg-transparent text-muted" },
  PENDING_APPROVAL: { label: "Pending approval", tone: "bg-base-200 text-base-content" },
  RETURNED: { label: "Returned", tone: "bg-warning text-warning-content" },
  PUBLISHED: { label: "Published", tone: "bg-secondary text-secondary-content" },
  REJECTED: { label: "Rejected", tone: "bg-error/15 text-error" },
  EXPIRED: { label: "Expired", tone: "bg-error/15 text-error" },
  CLOSED: { label: "Closed", tone: "border border-base-300 bg-transparent text-muted" },
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
  const { label, tone } = STATUSES[postStatus] ?? { label: postStatus, tone: STATUSES.DRAFT.tone };
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-center text-sm font-semibold whitespace-nowrap ${tone} ${className}`}
    >
      {/* "Closed by recruiter" reads "Closed · by recruiter" */}
      {postStatus === "CLOSED" && closingReason ? `${label} · ${closingReason.replace(/^Closed /, "")}` : label}
    </span>
  );
}
