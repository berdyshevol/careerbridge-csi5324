import Link from "next/link";
import { formatDate, type JobPosting } from "@/lib/api";
import { CalendarIcon } from "./Icons";

// search: the job board's query, carried to the posting so its back link returns to the same list
export default function PostingCard({ posting, search = "" }: { posting: JobPosting; search?: string }) {
  return (
    <li className="card hover-raise relative border border-base-300 bg-base-100">
      <div className="card-body gap-1 p-5 text-base">
        <h3 className="font-semibold">
          {/* The link covers the whole card, so the card is one target and the title stays its name */}
          <Link
            href={`/jobs/${posting.jobPostId}${search}`}
            className="link-hover link after:absolute after:inset-0 after:rounded-box"
          >
            {posting.title}
          </Link>
        </h3>
        <p className="text-muted">
          {posting.organization.name} · {posting.location} · {posting.employmentType}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <CalendarIcon className="size-4" />
          Apply by {formatDate(posting.applicationDeadline)}
        </p>
      </div>
    </li>
  );
}
