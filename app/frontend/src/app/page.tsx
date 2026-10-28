import Link from "next/link";
import ApplicationRow from "@/components/ApplicationRow";
import BackendDown from "@/components/BackendDown";
import OfferPanel from "@/components/OfferPanel";
import PageTitle from "@/components/PageTitle";
import PostingCard from "@/components/PostingCard";
import SlotMeter from "@/components/SlotMeter";
import EmptyState from "@/components/EmptyState";
import EndSession from "@/components/EndSession";
import { formatDate, searchPostings, SessionEnded, viewApplications } from "@/lib/api";
import { APPLICATION_LIMIT, offer, resume } from "@/lib/sampleDesk";
import { serverSession } from "@/lib/serverSession";

function longDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// null: the backend is down, and the section says so
async function openPostings() {
  try {
    return await searchPostings();
  } catch {
    return null;
  }
}

async function deskOf(token: string) {
  try {
    return (await viewApplications(token)).active;
  } catch (err) {
    return err instanceof SessionEnded ? ("ended" as const) : ("down" as const);
  }
}

// The offer and the resume are sample data (see src/lib/sampleDesk.ts).
export default async function DeskPage() {
  const session = await serverSession();
  // The desk is the logged-in Applicant's; anyone else sees the job board part only
  const applicant = session?.user.role === "APPLICANT" ? session : null;
  const [postings, desk] = await Promise.all([
    openPostings(),
    applicant ? deskOf(applicant.token) : ("none" as const),
  ]);
  const applications = typeof desk === "object" ? desk : null;
  const sessionEnded = desk === "ended";

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
      {/* On phones and tablets this wrapper disappears and its sections are
          ordered around the side column; on laptops it is the white canvas. */}
      <div className="contents min-w-0 lg:flex lg:flex-1 lg:flex-col lg:gap-6 lg:rounded-2xl lg:border lg:border-base-300 lg:bg-base-100 lg:p-8">
        <div className="order-1">
          {applicant ? (
            <PageTitle subtitle="Here is where your applications stand.">
              Welcome back, {applicant.user.firstName}
            </PageTitle>
          ) : (
            <PageTitle subtitle="Find a job and apply in a few steps.">Welcome to CareerBridge</PageTitle>
          )}
        </div>

        <section className="order-3 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Your applications</h2>
            {applications && (
              <span className="text-muted">
                {applications.length} of {APPLICATION_LIMIT} active
              </span>
            )}
          </div>
          {sessionEnded && <EndSession />}
          {!applicant || sessionEnded ? (
            <EmptyState action={{ href: "/login", label: sessionEnded ? "Log in again" : "Log in as an applicant" }}>
              {sessionEnded ? "Your session has ended." : "Your applications appear here once you log in."}
            </EmptyState>
          ) : applications === null ? (
            <BackendDown />
          ) : (
            <ul className="flex flex-col gap-3">
              {applications.map((application) => (
                <ApplicationRow key={application.applicationId} application={application} />
              ))}
            </ul>
          )}
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

        {applicant && (
          <p className="order-5 text-sm text-muted">
            The offer and the resume are sample data until UC-07 and UC-03 are implemented.
          </p>
        )}
      </div>

      {applicant && (
      <aside className="order-2 flex flex-col gap-4 lg:order-none lg:w-80 lg:shrink-0">
        <OfferPanel
          title={offer.title}
          organizationName={offer.organizationName}
          respondBy={longDate(offer.expirationDate)}
        />

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 lg:gap-4">
          {applications && (
            <SlotMeter
              used={applications.length}
              total={APPLICATION_LIMIT}
              caption="A slot frees up when you withdraw an application or it reaches a final stage."
            />
          )}

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
      )}
    </div>
  );
}
