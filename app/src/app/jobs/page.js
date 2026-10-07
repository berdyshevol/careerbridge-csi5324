import Link from "next/link";
import { listOpenPostings } from "@/services/jobPostingService";

// Read the sample file on every request, not once at build time.
export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const postings = await listOpenPostings();

  return (
    <section>
      <h1>Open job postings</h1>
      <ul className="card-list">
        {postings.map((posting) => (
          <li key={posting.jobPostId} className="card">
            <h2>{posting.title}</h2>
            <p>
              {posting.organizationName} · {posting.location} · {posting.employmentType}
            </p>
            <p className="muted">Apply by {posting.applicationDeadline}</p>
            <p>
              <Link href={`/jobs/${posting.jobPostId}/apply`}>Apply</Link>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
