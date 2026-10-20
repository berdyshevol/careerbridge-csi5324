import Link from "next/link";
import { formatDate, type JobPosting } from "@/lib/api";

// search: the job board's query, carried to the posting so its back link returns to the same list
export default function PostingCard({ posting, search = "" }: { posting: JobPosting; search?: string }) {
  return (
    <li className="card border border-base-300 bg-base-100">
      <div className="card-body gap-1 p-5 text-base">
        <h3 className="font-semibold">
          <Link href={`/jobs/${posting.jobPostId}${search}`} className="link-hover link">
            {posting.title}
          </Link>
        </h3>
        <p className="text-muted">
          {posting.organization.name} · {posting.location} · {posting.employmentType}
        </p>
        <p className="text-sm text-muted">Apply by {formatDate(posting.applicationDeadline)}</p>
      </div>
    </li>
  );
}
