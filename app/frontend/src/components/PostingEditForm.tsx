"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  openPostingForEdit,
  PostingRejected,
  SessionEnded,
  submitJobPosting,
  updatePosting,
  type JobPosting,
} from "@/lib/api";
import AccessNotice from "./AccessNotice";
import EmptyState from "./EmptyState";
import Loading from "./Loading";
import PageTitle from "./PageTitle";
import PostingFields, { detailsOf, editPostingPath, requestOf, type PostingDetails } from "./PostingFields";

// UC-11 extensions 3b and 6a: the recruiter reopens their Draft or Returned posting, changes it,
// and saves it again or submits it for approval
export default function PostingEditForm({ token, postingId }: { token: string; postingId: number }) {
  const [posting, setPosting] = useState<JobPosting | null>(null);
  const [details, setDetails] = useState<PostingDetails | null>(null);
  const [unavailable, setUnavailable] = useState("");
  const [ended, setEnded] = useState(false);
  const [refused, setRefused] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);

  useEffect(() => {
    let cancelled = false;
    openPostingForEdit(token, postingId)
      .then((loaded) => {
        if (!cancelled) {
          setPosting(loaded);
          setDetails(detailsOf(loaded));
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (err instanceof SessionEnded) {
          setEnded(true);
        } else {
          setUnavailable(
            err instanceof PostingRejected && err.message
              ? err.message
              : "The posting could not be loaded. Try again in a moment.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, postingId]);

  if (ended) {
    return (
      <AccessNotice title="Your session has ended" logInTo={editPostingPath(postingId)} ended>
        Log in again as a recruiter to change your posting.
      </AccessNotice>
    );
  }
  if (unavailable) {
    return <EmptyState card>{unavailable}</EmptyState>;
  }
  if (!posting || !details) {
    return <Loading label="Loading the posting…" rows={1} />;
  }

  async function save(andSubmit: boolean) {
    if (!details) {
      return;
    }
    setRefused("");
    setSaved("");
    setBusy(andSubmit ? "submit" : "save");
    try {
      // Submitting checks the stored posting, so the changes are saved first, and stay saved
      // when the submission is refused
      setPosting(await updatePosting(token, postingId, requestOf(details)));
      setSaved("Draft saved.");
      if (andSubmit) {
        setPosting(await submitJobPosting(token, postingId));
        setSaved("");
      }
    } catch (err) {
      // The notice that follows clears the session and redraws the header
      if (err instanceof SessionEnded) {
        setEnded(true);
        return;
      }
      setRefused(
        err instanceof PostingRejected && err.message ? err.message : "The posting could not be saved. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(true);
  }

  const returned = posting.postStatus === "RETURNED";
  const submitted = posting.postStatus === "PENDING_APPROVAL";

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow={submitted ? "Submitted posting" : returned ? "Returned posting" : "Draft posting"}
        subtitle={`Posting for ${posting.organization.name}`}
      >
        {posting.title}
      </PageTitle>

      {submitted ? (
        <div role="status" className="alert alert-success">
          <span>Submitted for approval. The administrator reviews it before it appears on the job board.</span>
        </div>
      ) : (
        <>
          {returned && posting.reviewComment && (
            <section role="status" aria-label="Administrator's comments" className="alert alert-warning">
              <span>
                <b>Returned by the administrator.</b> “{posting.reviewComment}” Change the posting and submit it
                again.
              </span>
            </section>
          )}

          <form
            onSubmit={handleSubmit}
            aria-label="Posting details"
            className="card border border-base-300 bg-base-100 flex flex-col gap-6 p-5 md:p-8"
            noValidate
          >
            <PostingFields details={details} onChange={setDetails} refused={refused} />

            {saved && (
              <p role="status" className="text-sm text-success">
                {saved}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" className="btn" onClick={() => void save(false)} disabled={busy !== null}>
                {busy === "save" ? "Saving…" : "Save draft"}
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy !== null}>
                {busy === "submit" ? "Submitting…" : "Submit for approval"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
