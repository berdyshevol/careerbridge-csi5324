import Link from "next/link";
import { notFound } from "next/navigation";
import BackendDown from "@/components/BackendDown";
import PageTitle from "@/components/PageTitle";
import { formatDate, isOpen, viewPosting, type JobPosting } from "@/lib/api";

export default async function PostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let posting: JobPosting | null;
  try {
    posting = await viewPosting(id);
  } catch {
    return <BackendDown />;
  }
  if (!posting) {
    notFound();
  }
  const open = isOpen(posting);

  return (
    <article className="card border border-base-300 bg-base-100">
      <div className="card-body gap-5">
        <Link href="/jobs" className="link link-primary font-semibold">
          All jobs
        </Link>

        <PageTitle
          subtitle={`${posting.organization.name} · ${posting.location} · ${posting.employmentType}`}
        >
          {posting.title}
        </PageTitle>

        {!open && (
          <div role="status" className="alert alert-warning">
            This posting no longer accepts applications.
          </div>
        )}

        <section>
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="mt-1">{posting.description}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Requirements</h2>
          <p className="mt-1">{posting.jobRequirements}</p>
        </section>

        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <dt className="text-sm text-muted">Salary range</dt>
            <dd className="font-medium">{posting.salaryRange ?? "Not stated"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Openings</dt>
            <dd className="font-medium">{posting.numberOfOpenings}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Posted</dt>
            <dd className="font-medium">{formatDate(posting.datePosted)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Apply by</dt>
            <dd className="font-medium">{formatDate(posting.applicationDeadline)}</dd>
          </div>
        </dl>

        {open && (
          <div>
            <Link href={`/jobs/${posting.jobPostId}/apply`} className="btn btn-primary">
              Apply
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
