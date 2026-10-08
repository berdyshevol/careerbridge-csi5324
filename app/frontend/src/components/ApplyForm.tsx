"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, type JobPosting } from "@/lib/api";
import { checkApplication, submitApplication, type Desk } from "@/lib/apply";
import { APPLICATION_LIMIT, applicant } from "@/lib/sampleDesk";
import PageTitle from "./PageTitle";
import SlotMeter from "./SlotMeter";

// UC-04 Apply for Job: the summary before submission (FR-UC04.1), the
// confirmation (FR-UC04.2) and the result (FR-UC04.5). The desk is the
// applicant's state: resume on file and active applications.
export default function ApplyForm({ posting, initialDesk }: { posting: JobPosting; initialDesk: Desk }) {
  const [desk, setDesk] = useState(initialDesk);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitted, setSubmitted] = useState<number | null>(null); // applicationId

  if (submitted !== null) {
    return <Submitted posting={posting} activeCount={desk.applications.length} />;
  }

  const check = checkApplication(posting, desk);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = submitApplication(posting, desk);
    if (result.ok) {
      setDesk(result.desk);
      setSubmitted(result.application.applicationId);
    }
    // A failed check is already on screen: the form re-renders from the desk.
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
      <article className="card min-w-0 flex-1 border border-base-300 bg-base-100">
        <div className="card-body gap-5">
          <Link href={`/jobs/${posting.jobPostId}`} className="link link-primary font-semibold">
            Back to the posting
          </Link>

          <div>
            <PageTitle
              eyebrow="You are applying for"
              subtitle={`${posting.organization.name} · ${posting.location} · ${posting.employmentType}`}
            >
              {posting.title}
            </PageTitle>
            <p className="text-sm text-muted">Apply by {formatDate(posting.applicationDeadline)}</p>
          </div>

          {check.kind !== "ok" && <Blocked check={check} />}

          <section>
            <h2 className="text-lg font-semibold">Your details</h2>
            <dl className="mt-2 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted">Name</dt>
                <dd className="font-medium">
                  {applicant.firstName} {applicant.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Email</dt>
                <dd className="font-medium">{applicant.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Phone</dt>
                <dd className="font-medium">{applicant.phone}</dd>
              </div>
            </dl>
            <p className="mt-2 text-sm text-muted">
              These go to {posting.organization.name} with your application.{" "}
              <Link href="/profile" className="link link-primary">
                Edit profile
              </Link>
            </p>
          </section>

          {check.kind === "ok" && (
            <section className="flex flex-col gap-4 border-t border-base-300 pt-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary mt-0.5"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                />
                <span>
                  I understand that a submitted application cannot be edited. To change it, I would
                  withdraw it and apply again if the posting is still open.
                </span>
              </label>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link href={`/jobs/${posting.jobPostId}`} className="btn">
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary" disabled={!acknowledged}>
                  Submit application
                </button>
              </div>
            </section>
          )}
        </div>
      </article>

      <aside className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
        <section className="flex flex-col gap-1 rounded-2xl border border-base-300 bg-base-100 p-5">
          <h2 className="font-semibold">Resume on file</h2>
          {desk.resume ? (
            <>
              <p>{desk.resume.fileName}</p>
              <p className="text-sm text-muted">Uploaded {formatDate(desk.resume.uploadDate)}</p>
              <p className="pt-2 text-sm text-muted">
                A copy as it is now goes with this application; later changes do not affect it.
              </p>
            </>
          ) : (
            <p className="text-muted">No resume yet.</p>
          )}
          <Link
            href="/profile"
            className="link link-primary pt-2 font-semibold no-underline hover:underline"
          >
            {desk.resume ? "Replace resume" : "Upload a resume"}
          </Link>
        </section>

        <SlotMeter used={desk.applications.length} total={APPLICATION_LIMIT} />
      </aside>
    </form>
  );
}

// Why the application cannot go ahead, with the way out (UC-04 extensions).
function Blocked({ check }: { check: Exclude<ReturnType<typeof checkApplication>, { kind: "ok" }> }) {
  switch (check.kind) {
    case "closed":
      return (
        <div role="status" className="alert alert-warning">
          <span>
            This posting no longer accepts applications.{" "}
            <Link href="/jobs" className="link">
              See other open jobs
            </Link>
          </span>
        </div>
      );
    case "no-resume":
      return (
        <div role="status" className="alert alert-warning">
          <span>
            A resume is required to apply.{" "}
            <Link href="/profile" className="link">
              Upload one in Profile &amp; resume
            </Link>
            , then come back to this posting.
          </span>
        </div>
      );
    case "already-applied":
      return (
        <div role="status" className="alert alert-warning">
          <span>
            You already applied to this posting; the application is at the{" "}
            <strong>{check.application.applicationStatus}</strong> stage. A posting can be applied to
            once.{" "}
            <Link href="/applications" className="link">
              Track its status
            </Link>
          </span>
        </div>
      );
    case "limit":
      return (
        <div role="status" className="alert alert-warning flex-col items-start">
          <p>
            You have {APPLICATION_LIMIT} active applications, the most allowed at once. A slot
            frees up when you withdraw one or it reaches Hired, Rejected or Offer Declined.
          </p>
          <ul className="list-inside list-disc">
            {check.active.map((application) => (
              <li key={application.applicationId}>
                {application.title}, {application.organizationName} ·{" "}
                {application.applicationStatus}
              </li>
            ))}
          </ul>
          <Link href="/applications" className="link">
            Review your applications
          </Link>
        </div>
      );
  }
}

// FR-UC04.5: the submission is confirmed with the new count and a link to UC-05.
function Submitted({ posting, activeCount }: { posting: JobPosting; activeCount: number }) {
  return (
    <article className="card border border-base-300 bg-base-100">
      <div className="card-body gap-5">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-content">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-6"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <PageTitle
          subtitle={`${posting.title} at ${posting.organization.name}. You now have ${activeCount} of ${APPLICATION_LIMIT} active applications.`}
        >
          Application submitted
        </PageTitle>
        <p>
          A copy of your resume went with it. The recruiter sees your application at the Applied
          stage; every change of stage will appear in Track status.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/applications" className="btn btn-primary">
            Track application status
          </Link>
          <Link href="/jobs" className="btn">
            Back to open jobs
          </Link>
        </div>
      </div>
    </article>
  );
}
