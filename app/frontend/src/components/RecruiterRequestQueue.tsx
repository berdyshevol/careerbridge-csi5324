import Link from "next/link";
import { formatInstantDay, type RecruiterRequestEntry } from "@/lib/api";

// UC-10 step 2, oldest first; extension 2a when empty
export default function RecruiterRequestQueue({ requests }: { requests: RecruiterRequestEntry[] }) {
  if (requests.length === 0) {
    return (
      <section className="card border border-base-300 bg-base-100">
        <div className="card-body">
          <p className="font-display text-lg font-semibold">No pending requests.</p>
        </div>
      </section>
    );
  }
  return (
    <ul aria-label="Requests" className="card divide-y divide-base-300 overflow-hidden border border-base-300 bg-base-100">
      {requests.map((request) => (
        <li key={request.requestId}>
          <Link
            href={`/admin/requests/${request.requestId}`}
            className="flex flex-col gap-1 px-5 py-4 hover:bg-base-200"
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{request.requesterName}</span>
              <span className="badge badge-outline">{request.requestTypeLabel}</span>
              {request.status === "INFORMATION_REQUESTED" && (
                <span className="badge badge-warning">Information requested</span>
              )}
            </span>
            <span className="text-sm text-muted">{request.organizationName}</span>
            <span className="text-sm text-muted">Submitted {formatInstantDay(request.requestedAt)}</span>
            {request.reviewFlag && (
              <span className="text-sm">
                <span className="badge badge-warning badge-sm mr-2">Flagged</span>
                {request.reviewFlag}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
