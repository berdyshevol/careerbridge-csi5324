import Link from "next/link";
import { notFound } from "next/navigation";
import AccessNotice from "@/components/AccessNotice";
import ApplyForm from "@/components/ApplyForm";
import BackendDown from "@/components/BackendDown";
import { SessionEnded, startApplication, viewApplications, viewPosting, type ApplicationStart, type Applications, type JobPosting } from "@/lib/api";
import { resume } from "@/lib/sampleDesk";
import { serverSession } from "@/lib/serverSession";

// The applications come from the backend for the logged-in Applicant; the resume stays
// sample data until UC-03 keeps it there (see src/lib/sampleDesk.ts and src/lib/apply.ts).
export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const here = `/jobs/${id}/apply`;

  let posting: JobPosting | null;
  try {
    posting = await viewPosting(id);
  } catch {
    return <BackendDown />;
  }
  if (!posting) {
    notFound();
  }

  const session = await serverSession();
  if (!session) {
    return (
      <AccessNotice title="Log in to apply" logInTo={here} register>
        Applying needs an applicant account. Log in, or register in a minute, and you come back to
        this posting.
      </AccessNotice>
    );
  }
  if (session.user.role !== "APPLICANT") {
    return (
      <AccessNotice title="Only applicants apply" user={session.user}>
        Only applicant accounts can apply.{" "}
        <Link href={`/jobs/${id}`} className="link link-primary">
          Back to the posting
        </Link>
      </AccessNotice>
    );
  }

  let applications: Applications;
  let start: ApplicationStart;
  try {
    [applications, start] = await Promise.all([
      viewApplications(session.token),
      startApplication(session.token, posting.jobPostId, resume),
    ]);
  } catch (err) {
    if (err instanceof SessionEnded) {
      return (
        <AccessNotice title="Your session has ended" logInTo={here} ended>
          Log in again to apply.
        </AccessNotice>
      );
    }
    return <BackendDown />;
  }

  return (
    <ApplyForm
      posting={posting}
      session={session}
      desk={{
        applications: applications.active,
        appliedPostingIds: applications.appliedPostingIds,
        resume,
        refusal: start.refusal?.reason ?? null,
      }}
    />
  );
}
