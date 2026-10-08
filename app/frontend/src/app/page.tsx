import Link from "next/link";
import ApplicationRow from "@/components/ApplicationRow";
import BackendDown from "@/components/BackendDown";
import PostingCard from "@/components/PostingCard";
import { formatDate, searchPostings, type JobPosting } from "@/lib/api";
import { APPLICATION_LIMIT, applicant, applications, offer, resume } from "@/lib/sampleDesk";

function longDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// The applicant's desk. Postings come from the backend; the applications,
// the offer and the resume are sample data (see src/lib/sampleDesk.ts).
export default async function DeskPage() {
  let postings: JobPosting[] | null = null;
  try {
    postings = await searchPostings();
  } catch {
    postings = null;
  }
  const slots = Array.from({ length: APPLICATION_LIMIT }, (_, index) => index < applications.length);

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
      {/* On phones and tablets this wrapper disappears and its sections are
          ordered around the side column; on laptops it is the white canvas. */}
      <div className="contents min-w-0 lg:flex lg:flex-1 lg:flex-col lg:gap-6 lg:rounded-2xl lg:border lg:border-base-300 lg:bg-base-100 lg:p-8">
        <div className="order-1">
          <h1 className="font-display text-2xl font-semibold md:text-3xl">
            Welcome back, {applicant.firstName}
          </h1>
          <p className="mt-1 text-muted">One offer is waiting for your answer.</p>
        </div>

        <section className="order-3 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Your applications</h2>
            <span className="text-muted">
              {applications.length} of {APPLICATION_LIMIT} active
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            {applications.map((application) => (
              <ApplicationRow key={application.applicationId} application={application} />
            ))}
          </ul>
        </section>

        <section className="order-4 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Recently published</h2>
            <Link href="/jobs" className="link link-primary font-semibold no-underline hover:underline">
              See all open jobs
            </Link>
          </div>
          {postings === null ? (
            <BackendDown />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {postings.slice(0, 2).map((posting) => (
                <PostingCard key={posting.jobPostId} posting={posting} />
              ))}
            </ul>
          )}
        </section>

        <p className="order-5 text-sm text-muted">
          Applications, the offer and the resume are sample data until UC-05, UC-07 and UC-03 are
          implemented.
        </p>
      </div>

      <aside className="order-2 flex flex-col gap-4 lg:order-none lg:w-80 lg:shrink-0">
        <section className="flex flex-col gap-3 rounded-2xl bg-warning p-5 md:flex-row md:items-center md:gap-5 lg:flex-col lg:items-stretch lg:gap-3">
          <div className="min-w-0 grow">
            <p className="text-sm font-semibold uppercase tracking-wider text-warning-content">
              Offer waiting
            </p>
            <p className="mt-1 font-display text-xl font-semibold">{offer.title}</p>
            <p className="text-[#4a3a26]">
              {offer.organizationName} · Respond by {longDate(offer.expirationDate)}
            </p>
          </div>
          <Link href="/offers" className="btn btn-neutral h-12">
            Review offer
          </Link>
        </section>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 lg:gap-4">
          <section className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5">
            <h2 className="font-semibold">Application slots</h2>
            <p className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold leading-none">
                {applications.length}
              </span>
              <span className="text-muted">of {APPLICATION_LIMIT} in use</span>
            </p>
            <div aria-hidden="true" className="flex gap-1.5">
              {slots.map((used, index) => (
                <span
                  key={index}
                  className={`h-2.5 grow rounded-full ${used ? "bg-primary" : "bg-base-300"}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted">
              A slot frees up when you withdraw an application or it reaches a final stage.
            </p>
          </section>

          <section className="flex flex-col gap-1 rounded-2xl border border-base-300 bg-base-100 p-5">
            <h2 className="font-semibold">Resume on file</h2>
            {resume ? (
              <>
                <p>{resume.fileName}</p>
                <p className="text-sm text-muted">Uploaded {formatDate(resume.uploadDate)}</p>
              </>
            ) : (
              <p className="text-muted">No resume yet.</p>
            )}
            <div className="grow" />
            <Link
              href="/profile"
              className="link link-primary pt-2 font-semibold no-underline hover:underline"
            >
              {resume ? "Replace resume" : "Upload a resume"}
            </Link>
          </section>
        </div>
      </aside>
    </div>
  );
}
