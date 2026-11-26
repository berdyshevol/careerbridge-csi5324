"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  createPosting,
  PostingRejected,
  SessionEnded,
  submitJobPosting as sendForApproval,
  viewRecruiterPostings,
  type JobPosting,
} from "@/lib/api";
import { useEndSession } from "@/lib/useEndSession";
import PostingFields, { EMPTY_DETAILS, editPostingPath, requestOf, type PostingDetails } from "./PostingFields";

const SESSION_ENDED = "Your session has ended. Log in again as a recruiter.";

// UC-11, for the logged-in Recruiter
export default function PostingForm({ token }: { token: string }) {
  const endSession = useEndSession();
  // The organization the recruiter acts for (UC-11 step 2); null when none, undefined while loading
  const [organization, setOrganization] = useState<{ id: number; name: string } | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    viewRecruiterPostings(token)
      .then((answer) => {
        if (!cancelled) {
          setOrganization(
            answer.organizationId && answer.organizationName
              ? { id: answer.organizationId, name: answer.organizationName }
              : null,
          );
        }
      })
      .catch(() => !cancelled && setOrganization(null));
    return () => {
      cancelled = true;
    };
  }, [token]);
  const [details, setDetails] = useState<PostingDetails>(EMPTY_DETAILS);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // The backend's reason for refusing the posting, shown under the field it names
  const [refused, setRefused] = useState("");
  const [created, setCreated] = useState<JobPosting | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setRefused("");
    setCreated(null);
    setSaving(true);

    try {
      const posting = await createPosting(token, {
        organizationId: organization?.id ?? 0,
        ...requestOf(details),
      });

      setCreated(posting);
    } catch (err) {
      if (err instanceof SessionEnded) {
        endSession();
      }
      if (err instanceof PostingRejected && err.message) {
        setRefused(err.message);
      } else {
        setError(err instanceof SessionEnded ? SESSION_ENDED : "Unable to save the posting. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitJobPosting() {
    if (!created || created.postStatus !== "DRAFT") {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const updated = await sendForApproval(token, created.jobPostId);
      setCreated(updated);
    } catch (err) {
      if (err instanceof SessionEnded) {
        endSession();
      }
      setError(
        err instanceof SessionEnded
          ? SESSION_ENDED
          : err instanceof PostingRejected && err.message
            ? err.message
            : "Unable to submit the posting for approval.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-primary">
          RECRUITER WORKSPACE / UC-11 &amp; UC-12
        </p>

        <h1 className="font-display text-3xl font-semibold">
          Create job posting
        </h1>

        <p className="mt-2 text-muted">
          Create a job posting, save it as a draft, and submit it for
          administrator approval before publication.
        </p>
      </div>

      {organization && <p className="text-muted">Posting for {organization.name}</p>}
      {organization === null && (
        <div role="alert" className="alert alert-warning">
          <span>You are not an active member of any organization yet, so you cannot create a posting.</span>
        </div>
      )}

      {created && (
        <div
          role="status"
          className="space-y-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-lift"
        >
          <div>
            <h2 className="text-lg font-semibold">
              {created.postStatus === "PENDING_APPROVAL"
                ? "Submitted for administrator review!"
                : "Job posting saved successfully!"}
            </h2>

            <p className="mt-1">
              {created.title} — Posting #{created.jobPostId} ({created.postStatus})
            </p>

            <p className="mt-1 text-sm text-muted">
              Current status:{" "}
              <span className="font-semibold">
                {created.postStatus.replaceAll("_", " ")}
              </span>
            </p>
          </div>

          {created.postStatus === "DRAFT" && (
            <Link href={editPostingPath(created.jobPostId)} className="btn">
              Edit draft
            </Link>
          )}

          {created.postStatus === "DRAFT" && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={submitJobPosting}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit for approval"}
            </button>
          )}

          {created.postStatus === "PENDING_APPROVAL" && (
            <p className="text-sm text-success">
              The posting is now awaiting an administrator decision.
              It is not visible on the public job board yet.
            </p>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="card border border-base-300 bg-base-100 flex flex-col gap-6 p-5 md:p-8"
      >
        <PostingFields details={details} onChange={setDetails} refused={refused} />

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-base-300 pt-5">
          <Link href="/jobs" className="btn btn-ghost">
            Back to job board
          </Link>

          <button
            type="submit"
            disabled={saving || submitting || !organization}
            className="btn btn-primary"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
