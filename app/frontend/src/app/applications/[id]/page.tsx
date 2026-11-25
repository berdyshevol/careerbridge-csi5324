import Link from "next/link";
import { notFound } from "next/navigation";
import AccessNotice from "@/components/AccessNotice";
import BackendDown from "@/components/BackendDown";
import PageTitle from "@/components/PageTitle";
import { StageBadge } from "@/components/StageBadge";
import StageTimeline from "@/components/StageTimeline";
import {
  formatDate,
  formatUtcDay,
  SessionEnded,
  viewApplication,
  type ApplicationDetail,
} from "@/lib/api";
import { serverSession } from "@/lib/serverSession";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const here = `/applications/${id}`;

  const session = await serverSession();
  if (!session) {
    return (
      <AccessNotice title="Log in to see this application" logInTo={here} register>
        Applications belong to your applicant account.
      </AccessNotice>
    );
  }
  if (session.user.role !== "APPLICANT") {
    return (
      <AccessNotice title="Applicants only" user={session.user}>
        Only an applicant can view their applications.
      </AccessNotice>
    );
  }

  let application: ApplicationDetail | null;
  try {
    application = await viewApplication(session.token, id);
  } catch (err) {
    if (err instanceof SessionEnded) {
      return (
        <AccessNotice title="Your session has ended" logInTo={here} ended>
          Log in again to see this application.
        </AccessNotice>
      );
    }
    return <BackendDown />;
  }
  if (!application) {
    notFound();
  }

  const canWithdraw = application.availableActions.includes("WITHDRAW");
  const canAcceptOffer = application.availableActions.includes("ACCEPT_OFFER");
  const canDeclineOffer = application.availableActions.includes("DECLINE_OFFER");
  const isOffer = application.applicationStatus === "Offer";

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/applications"
        className="link link-primary self-start text-sm font-semibold no-underline hover:underline"
      >
        ← All applications
      </Link>

      <div className="flex items-start justify-between gap-4">
        <PageTitle context={application.organizationName}>{application.title}</PageTitle>
        <StageBadge
          stage={application.applicationStatus}
          className={`mt-1 shrink-0 ${isOffer ? "sm:hidden" : ""}`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          {isOffer && (
            <section
              aria-label="Offer"
              className="flex flex-col gap-3 rounded-2xl bg-warning p-5 text-warning-content"
            >
              <p className="text-xs font-semibold uppercase tracking-wider">Offer</p>
              <p className="font-display text-xl font-semibold text-base-content">
                {application.organizationName} offers you the {application.title} position
              </p>
              <p className="text-sm text-base-content">Accepting or declining is final.</p>
              {(canAcceptOffer || canDeclineOffer) && (
                <div className="flex flex-wrap gap-3">
                  {canAcceptOffer && (
                    <button type="button" className="btn btn-primary" disabled>
                      Accept offer
                    </button>
                  )}
                  {canDeclineOffer && (
                    <button type="button" className="btn" disabled>
                      Decline
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          {application.applicationStatus === "Rejected" && (
            <div role="status" className="alert alert-soft alert-error">
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-semibold">
                  Rejected
                  {application.rejectionDate ? ` on ${formatDate(application.rejectionDate)}` : ""}
                  {application.rejectedAtStage ? ` at ${application.rejectedAtStage}` : ""}
                </p>
                {application.rejectionReason && <p>Reason: {application.rejectionReason}</p>}
              </div>
            </div>
          )}

          {application.applicationStatus === "Withdrawn" && (
            <div role="status" className="alert alert-info">
              <span>
                Withdrawn
                {application.withdrawnAt ? ` on ${formatUtcDay(application.withdrawnAt)}` : ""}. No
                further actions are available.
              </span>
            </div>
          )}

          {application.applicationStatus === "Hired" && (
            <div role="status" className="alert alert-soft alert-success">
              <span>You accepted the offer for this position.</span>
            </div>
          )}

          {application.applicationStatus === "Offer Declined" && (
            <div role="status" className="alert alert-info">
              <span>
                You declined the offer for this position. No further actions are available.
              </span>
            </div>
          )}

          {canWithdraw && (
            <section className="card border border-base-300 bg-base-100">
              <div className="card-body gap-3">
                <p className="text-sm text-muted">
                  Submitted applications cannot be edited. You can withdraw while this application
                  is in Applied, Screening, or Interview.
                </p>
                <div>
                  <button type="button" className="btn" disabled>
                    Withdraw application
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-5">
            <h2 className="font-display text-lg font-semibold">Stage history</h2>
            <StageTimeline entries={application.statusHistory} interviews={application.interviews} />
          </section>
        </aside>
      </div>
    </div>
  );
}
