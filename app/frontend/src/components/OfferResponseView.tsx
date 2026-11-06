"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  acceptOffer,
  ApplicationRefused,
  declineOffer,
  formatDate,
  formatStage,
  viewApplications,
  viewOffer,
  type JobOffer,
  type OfferDecision,
} from "@/lib/api";
import { APPLICATION_LIMIT } from "@/lib/sampleDesk";
import BackendDown from "./BackendDown";
import EmptyState from "./EmptyState";
import PageTitle from "./PageTitle";
import SlotMeter from "./SlotMeter";
import { StageBadge } from "./StageBadge";

type PendingDecision = "none" | "accept" | "decline";

const DECLINE_REASONS = [
  "Accepted another offer",
  "Compensation or terms",
  "No longer interested",
  "Other",
] as const;

export default function OfferResponseView({
  initialApplicationId,
}: {
  initialApplicationId?: number;
}) {
  const [offer, setOffer] = useState<JobOffer | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [backendDown, setBackendDown] = useState(false);
  const [mode, setMode] = useState<PendingDecision>("none");
  const [confirmed, setConfirmed] = useState(false);
  const [declineReasonChoice, setDeclineReasonChoice] = useState("");
  const [declineComment, setDeclineComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState<OfferDecision | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setBackendDown(false);
      setError("");
      try {
        const list = await viewApplications();
        if (cancelled) {
          return;
        }
        setActiveCount(list.activeApplicationCount);
        const targetId =
          initialApplicationId ??
          list.applications.find((app) => app.applicationStatus === "OFFER")?.applicationId ??
          null;
        if (targetId === null) {
          setOffer(null);
          return;
        }
        const loadedOffer = await viewOffer(targetId);
        if (!cancelled) {
          setOffer(loadedOffer);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApplicationRefused) {
            setError(err.message);
          } else {
            setBackendDown(true);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [initialApplicationId]);

  if (backendDown) {
    return <BackendDown />;
  }

  if (loading) {
    return (
      <article className="card border border-base-300 bg-base-100">
        <div className="card-body">
          <p className="text-muted">Loading job offer…</p>
        </div>
      </article>
    );
  }

  if (!offer) {
    return (
      <div className="flex flex-col gap-5">
        <PageTitle subtitle="Review the terms of an extended job offer and accept or decline before the response deadline.">
          Respond to job offer
        </PageTitle>
        {error && (
          <div role="alert" className="alert alert-warning">
            <span>{error}</span>
          </div>
        )}
        <EmptyState action={{ href: "/applications", label: "Track application status" }}>
          You have no job offers waiting for a response right now.
        </EmptyState>
      </div>
    );
  }

  if (decision) {
    const accepted = decision.applicationStatus === "HIRED";
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
            subtitle={`${offer.title} at ${offer.organizationName}. You now have ${decision.activeApplicationCount} of ${APPLICATION_LIMIT} active applications.`}
          >
            {accepted ? "Offer accepted" : "Offer declined"}
          </PageTitle>
          <p>
            {accepted
              ? `Your application is now at the Hired stage (recorded on ${formatDate(decision.responseDate)}). The recruiters at ${offer.organizationName} have been notified.`
              : `Your application is now at the Offer Declined stage (recorded on ${formatDate(decision.responseDate)}). The recruiters at ${offer.organizationName} have been notified, and the job posting remains open.`}
          </p>
          {accepted && decision.postingClosed && (
            <div role="status" className="alert alert-info">
              <span>
                Your acceptance filled the last opening for this position, so the job posting is now
                closed.
              </span>
            </div>
          )}
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

  function startMode(next: PendingDecision) {
    setMode(next);
    setConfirmed(false);
    setDeclineReasonChoice("");
    setDeclineComment("");
    setError("");
  }

  async function handleSubmitDecision(event: React.FormEvent) {
    event.preventDefault();
    if (!offer || !confirmed) {
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      if (mode === "accept") {
        const result = await acceptOffer(offer.applicationId, {
          expectedSalary: offer.salary,
          expectedExpirationDate: offer.expirationDate,
        });
        setDecision(result);
        setActiveCount(result.activeApplicationCount);
      } else if (mode === "decline") {
        const reason = [declineReasonChoice, declineComment.trim()].filter(Boolean).join(": ");
        const result = await declineOffer(offer.applicationId, reason || null);
        setDecision(result);
        setActiveCount(result.activeApplicationCount);
      }
    } catch (err) {
      const message =
        err instanceof ApplicationRefused && err.message
          ? err.message
          : "Unable to record your response. Please try again.";
      setError(message);
      // UC-07 extensions 6a, 6b: reload the offer so revised terms or a closed stage appear
      try {
        const refreshed = await viewOffer(offer.applicationId);
        if (refreshed) {
          setOffer(refreshed);
        }
      } catch {
        setBackendDown(true);
      }
      setMode("none");
      setConfirmed(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
      <article className="card min-w-0 flex-1 border border-base-300 bg-base-100">
        <div className="card-body gap-5">
          <Link href="/applications" className="link link-primary font-semibold">
            Back to your applications
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <PageTitle
              eyebrow="Job offer"
              subtitle={`${offer.organizationName} · ${offer.location} · ${offer.employmentType}`}
            >
              {offer.title}
            </PageTitle>
            <StageBadge stage={offer.applicationStatus} />
          </div>

          {error && (
            <div role="alert" className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {!offer.open && (
            <div role="status" className="alert alert-warning">
              <span>
                This offer is no longer open for a response. The application is currently at the{" "}
                <strong>{formatStage(offer.applicationStatus)}</strong> stage.
              </span>
            </div>
          )}

          <section>
            <h2 className="text-lg font-semibold">Offer terms</h2>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <dt className="text-sm text-muted">Compensation</dt>
                <dd className="font-medium">{offer.salary}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Start date</dt>
                <dd className="font-medium">
                  {offer.startDate ? formatDate(offer.startDate) : "To be arranged"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Respond by</dt>
                <dd className="font-medium">{formatDate(offer.expirationDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Extended on</dt>
                <dd className="font-medium">{formatDate(offer.dateExtended)}</dd>
              </div>
            </dl>
          </section>

          {offer.terms && (
            <section>
              <h2 className="text-lg font-semibold">Additional terms</h2>
              <p className="mt-1">{offer.terms}</p>
            </section>
          )}

          {offer.open && mode === "none" && (
            <section className="flex flex-col gap-3 border-t border-base-300 pt-5">
              <p className="text-sm text-muted">
                Your decision is final once confirmed. Accepting moves your application to Hired;
                declining moves it to Offer Declined and frees an active application slot.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => startMode("accept")}
                  className="btn btn-primary"
                >
                  Accept offer
                </button>
                <button type="button" onClick={() => startMode("decline")} className="btn">
                  Decline offer
                </button>
              </div>
            </section>
          )}

          {offer.open && mode === "accept" && (
            <form
              onSubmit={handleSubmitDecision}
              className="flex flex-col gap-4 border-t border-base-300 pt-5"
            >
              <h2 className="text-lg font-semibold">Confirm offer acceptance</h2>
              <div role="status" className="alert alert-info">
                <span>
                  You are accepting the offer for <strong>{offer.title}</strong> at{" "}
                  <strong>{offer.organizationName}</strong> ({offer.salary}). This decision is
                  final.
                </span>
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary mt-0.5"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                <span>
                  I confirm that I am accepting this job offer and understand that acceptance is
                  final.
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => startMode("none")}
                  className="btn"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!confirmed || submitting}
                >
                  {submitting ? "Confirming…" : "Confirm acceptance"}
                </button>
              </div>
            </form>
          )}

          {offer.open && mode === "decline" && (
            <form
              onSubmit={handleSubmitDecision}
              className="flex flex-col gap-4 border-t border-base-300 pt-5"
            >
              <h2 className="text-lg font-semibold">Confirm declining this offer</h2>
              <div role="status" className="alert alert-warning">
                <span>
                  Declining the offer for <strong>{offer.title}</strong> at{" "}
                  <strong>{offer.organizationName}</strong> is final and cannot be undone.
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="decline-reason" className="font-medium">
                    Reason for declining (optional)
                  </label>
                  <select
                    id="decline-reason"
                    className="select w-full border-base-300 bg-base-100"
                    value={declineReasonChoice}
                    onChange={(event) => setDeclineReasonChoice(event.target.value)}
                  >
                    <option value="">No reason selected</option>
                    {DECLINE_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="decline-comment" className="font-medium">
                    Additional comment (optional)
                  </label>
                  <input
                    id="decline-comment"
                    type="text"
                    className="input w-full"
                    maxLength={500}
                    placeholder="Optional note"
                    value={declineComment}
                    onChange={(event) => setDeclineComment(event.target.value)}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary mt-0.5"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                <span>
                  I confirm that I am declining this job offer and understand that this decision is
                  final.
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => startMode("none")}
                  className="btn"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!confirmed || submitting}
                >
                  {submitting ? "Declining…" : "Confirm decline"}
                </button>
              </div>
            </form>
          )}
        </div>
      </article>

      <aside className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
        <SlotMeter
          used={activeCount}
          total={APPLICATION_LIMIT}
          caption="Responding to an offer moves the application to Hired or Offer Declined, freeing an active application slot."
        />

        <section className="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-5">
          <h2 className="font-semibold">Before you respond</h2>
          <p className="text-sm text-muted">
            Offers remain open until the response deadline ({formatDate(offer.expirationDate)}).
            Once you confirm acceptance or decline, the decision is final.
          </p>
        </section>
      </aside>
    </div>
  );
}

