
"use client";

import { FormEvent, useCallback, useState } from "react";
import Link from "next/link";
import {
  API_URL,
  BACKEND_TIMEOUT_MS,
  formatDate,
  type JobPosting,
} from "@/lib/api";

type ReviewAction = "approve" | "return" | "reject";

export default function AdminPostingsPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isLocalBackend =
    API_URL.startsWith("http://localhost:") ||
    API_URL.startsWith("http://127.0.0.1:");

  const authorization = useCallback(() => {
    return `Basic ${btoa(`${username}:${password}`)}`;
  }, [username, password]);

  async function loadPending() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/postings/pending`,
        {
          headers: {
            Authorization: authorization(),
          },
          cache: "no-store",
          signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
        },
      );

      if (response.status === 401 || response.status === 403) {
        setConnected(false);
        throw new Error(
          "Administrator authentication failed. Check your credentials.",
        );
      }

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = (await response.json()) as JobPosting[];
      setPostings(data);
      setConnected(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve pending postings.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadPending();
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

    const actionLabel =
      action === "approve"
        ? "approve"
        : action === "return"
          ? "return"
          : "reject";

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
      const response = await fetch(
        `${API_URL}/api/admin/postings/${postingId}/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: authorization(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comment: comment || null }),
          signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
        },
      );

      if (!response.ok) {
        const details = await response.text();

        if (response.status === 401 || response.status === 403) {
          setConnected(false);
          throw new Error("Administrator access was denied.");
        }

        throw new Error(
          details || `Unable to ${actionLabel} posting.`,
        );
      }

      setPostings((current) =>
        current.filter((posting) => posting.jobPostId !== postingId),
      );

      setMessage(
        `Posting #${postingId} successfully ${
          action === "approve"
            ? "approved and published"
            : action === "return"
              ? "returned for corrections"
              : "rejected"
        }.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete the review.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  function signOut() {
    setUsername("");
    setPassword("");
    setPostings([]);
    setComments({});
    setConnected(false);
    setMessage("");
    setError("");
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

        {connected && (
          <button
            type="button"
            onClick={signOut}
            className="btn btn-outline btn-sm"
          >
            Sign out
          </button>
        )}
      </div>

      <div className="alert alert-info text-sm">
        <span>
          Local development demonstration. Administrator authentication
          is separate from CareerBridge&apos;s future account system.
          Do not use this credential form against a public HTTP server.
        </span>
      </div>

      {!isLocalBackend && (
        <div role="alert" className="alert alert-warning">
          <span>
            This demonstration requires a localhost backend.
            Administrator credentials must not be sent to a remote server
            using this page.
          </span>
        </div>
      )}

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

      {!connected ? (
        <form
          onSubmit={handleLogin}
          className="max-w-xl space-y-5 rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm"
        >
          <div>
            <h2 className="text-xl font-semibold">
              Administrator sign in
            </h2>
            <p className="mt-1 text-sm text-muted">
              Enter the credentials configured for your local Spring
              Boot server.
            </p>
          </div>

          <fieldset className="fieldset">
            <label htmlFor="adminUsername" className="fieldset-legend">
              Administrator username
            </label>
            <input
              id="adminUsername"
              type="text"
              className="input w-full"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </fieldset>

          <fieldset className="fieldset">
            <label htmlFor="adminPassword" className="fieldset-legend">
              Password
            </label>
            <input
              id="adminPassword"
              type="password"
              className="input w-full"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </fieldset>

          <button
            type="submit"
            disabled={loading || !isLocalBackend}
            className="btn btn-primary w-full"
          >
            {loading ? "Connecting..." : "Open approval dashboard"}
          </button>
        </form>
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
