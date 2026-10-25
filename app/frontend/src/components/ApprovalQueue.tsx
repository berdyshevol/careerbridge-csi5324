
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatDate,
  openPostingApprovalQueue,
  PostingDecided,
  reviewPosting as sendReview,
  SessionEnded,
  type JobPosting,
  type ReviewAction,
} from "@/lib/api";
import { clearSession, ROLE_LABELS, type Session } from "@/lib/session";

const SESSION_ENDED = "Your session has ended. Log in again as an administrator.";

export default function ApprovalQueue({ session }: { session: Session | null }) {
  const router = useRouter();
  const [ended, setEnded] = useState(false);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loggedOut = !session || ended;
  const administrator = !loggedOut && session.user.role === "ADMINISTRATOR" ? session : null;

  useEffect(() => {
    if (administrator) {
      void loadPending();
    }
    // Once, on arrival: the session does not change while the page is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The token expired or the account lost the role: back to logging in, header included
  function sessionEnded() {
    clearSession();
    setEnded(true);
    setError(SESSION_ENDED);
    router.refresh();
  }

  async function loadPending() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      setPostings(await openPostingApprovalQueue(administrator?.token ?? ""));
      setConnected(true);
    } catch (err) {
      if (err instanceof SessionEnded) {
        sessionEnded();
        return;
      }
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to retrieve pending postings.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function reviewPosting(
    postingId: number,
    action: ReviewAction,
  ) {
    const comment = comments[postingId]?.trim() ?? "";

    if ((action === "return" || action === "reject") && !comment) {
      setError("Please enter a reason before returning or rejecting.");
      return;
    }

    if (
      action === "reject" &&
      !window.confirm("Reject this posting? This action cannot be undone.")
    ) {
      return;
    }

    setWorkingId(postingId);
    setError("");
    setMessage("");

    try {
      const decided = await sendReview(administrator?.token ?? "", postingId, action, comment);
      setPostings((current) => current.filter((posting) => posting.jobPostId !== postingId));
      setMessage(
        `Posting #${postingId} ${
          decided.postStatus === "PUBLISHED"
            ? "is approved and published."
            : decided.postStatus === "REJECTED"
              ? "is rejected."
              : `is returned to the recruiters: ${decided.reviewComment ?? ""}`
        }`,
      );
    } catch (err) {
      if (err instanceof SessionEnded) {
        sessionEnded();
        return;
      }
      if (err instanceof PostingDecided) {
        setPostings((current) => current.filter((posting) => posting.jobPostId !== postingId));
      }
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to complete the review.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">
            ADMINISTRATOR WORKSPACE / UC-12
          </p>

          <h1 className="font-display text-3xl font-semibold">
            Job posting approvals
          </h1>

          <p className="mt-2 text-muted">
            Review submitted postings before they appear on the public
            job board.
          </p>
        </div>

      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div role="status" className="alert alert-success">
          <span>{message}</span>
        </div>
      )}

      {!administrator ? (
        <section className="card max-w-xl border border-base-300 bg-base-100">
          <div className="card-body gap-4">
            <h2 className="text-xl font-semibold">Administrators only</h2>
            <p className="text-muted">
              {loggedOut
                ? "Log in as an administrator to review submitted postings."
                : `You are logged in as ${session.user.firstName} ${session.user.lastName}, ${ROLE_LABELS[session.user.role].toLowerCase()}. Only an administrator reviews postings.`}
            </p>
            {loggedOut && (
              <Link href="/login?next=/admin/postings" className="btn btn-primary self-start">
                Log in
              </Link>
            )}
          </div>
        </section>
      ) : !connected ? (
        <p className="text-muted">{loading ? "Loading pending postings..." : ""}</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Pending review
              </h2>
              <p className="text-sm text-muted">
                {postings.length} posting
                {postings.length === 1 ? "" : "s"} awaiting a decision
              </p>
            </div>

            <button
              type="button"
              onClick={loadPending}
              disabled={loading}
              className="btn btn-outline"
            >
              {loading ? "Refreshing..." : "Refresh postings"}
            </button>
          </div>

          {postings.length === 0 ? (
            <div className="rounded-2xl border border-base-300 bg-base-100 p-10 text-center">
              <h3 className="text-xl font-semibold">
                All caught up!
              </h3>
              <p className="mt-2 text-muted">
                There are no job postings awaiting approval.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {postings.map((posting) => (
                <article
                  key={posting.jobPostId}
                  className="space-y-5 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        POSTING #{posting.jobPostId}
                      </p>

                      <h3 className="mt-1 text-2xl font-semibold">
                        {posting.title}
                      </h3>

                      <p className="mt-1 text-muted">
                        {posting.organization?.name ?? "Organization"}
                        {" · "}
                        {posting.location || "Location not specified"}
                      </p>
                    </div>

                    <span className="badge badge-warning">
                      Pending approval
                    </span>
                  </div>

                  <div className="grid gap-4 rounded-xl bg-base-200 p-4 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-muted">Employment type</p>
                      <p className="font-medium">
                        {posting.employmentType || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted">Openings</p>
                      <p className="font-medium">
                        {posting.numberOfOpenings}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted">Application deadline</p>
                      <p className="font-medium">
                        {posting.applicationDeadline
                          ? formatDate(posting.applicationDeadline)
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">Job description</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                        {posting.description || "No description provided."}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold">Job requirements</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                        {posting.jobRequirements || "No requirements provided."}
                      </p>
                    </div>

                    {posting.salaryRange && (
                      <div>
                        <h4 className="font-semibold">Salary range</h4>
                        <p className="mt-1 text-sm text-muted">
                          {posting.salaryRange}
                        </p>
                      </div>
                    )}
                  </div>

                  <fieldset className="fieldset">
                    <label
                      htmlFor={`comment-${posting.jobPostId}`}
                      className="fieldset-legend"
                    >
                      Administrator review comment
                    </label>

                    <textarea
                      id={`comment-${posting.jobPostId}`}
                      className="textarea min-h-24 w-full"
                      maxLength={2000}
                      placeholder="Required when returning or rejecting a posting."
                      value={comments[posting.jobPostId] ?? ""}
                      onChange={(event) =>
                        setComments((current) => ({
                          ...current,
                          [posting.jobPostId]: event.target.value,
                        }))
                      }
                    />
                  </fieldset>

                  <div className="flex flex-wrap gap-3 border-t border-base-300 pt-5">
                    <button
                      type="button"
                      className="btn btn-success"
                      disabled={workingId !== null}
                      onClick={() =>
                        reviewPosting(posting.jobPostId, "approve")
                      }
                    >
                      {workingId === posting.jobPostId
                        ? "Processing..."
                        : "Approve & publish"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={workingId !== null}
                      onClick={() =>
                        reviewPosting(posting.jobPostId, "return")
                      }
                    >
                      Return for corrections
                    </button>

                    <button
                      type="button"
                      className="btn btn-error btn-outline"
                      disabled={workingId !== null}
                      onClick={() =>
                        reviewPosting(posting.jobPostId, "reject")
                      }
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-base-300 pt-5">
        <Link href="/jobs" className="btn btn-ghost">
          Back to job board
        </Link>
      </div>
    </div>
  );
}
