"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  closePosting,
  PostingRejected,
  SessionEnded,
  viewRecruiterPostings,
  type ActiveStage,
  type RecruiterPostingRow,
  type RecruiterPostings,
} from "@/lib/api";
import { STAGES } from "@/lib/sampleDesk";
import AccessNotice from "./AccessNotice";
import EmptyState from "./EmptyState";
import PageTitle from "./PageTitle";
import { editPostingPath } from "./PostingFields";
import PostingStatusBadge from "./PostingStatusBadge";

// FR-UC14.1: a posting that took applications shows how many are at each stage. A posting with none
// shows every stage at zero, so the line is never missing for a published posting.
function stageCounts(row: RecruiterPostingRow): string | null {
  if (row.postStatus !== "PUBLISHED" && row.postStatus !== "CLOSED") {
    return null;
  }
  const counts = STAGES.map((stage) => ({
    stage,
    applications: row.applicationsByStage[stage.toUpperCase() as ActiveStage],
  }));
  const shown = counts.filter(({ applications }) => applications > 0);
  return (shown.length ? shown : counts)
    .map(({ stage, applications }) => `${applications} ${stage}`)
    .join(", ");
}

function note(row: RecruiterPostingRow, organizationName: string): string | null {
  switch (row.postStatus) {
    case "PENDING_APPROVAL":
      return "Waiting for the administrator";
    case "DRAFT":
      return `Visible only to ${organizationName} recruiters`;
    case "EXPIRED":
      return "Deadline passed before publication";
    default:
      return stageCounts(row);
  }
}

export default function RecruiterPostingList({ token }: { token: string }) {
  const [postings, setPostings] = useState<RecruiterPostings | null>(null);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState("");
  // UC-13 extension *a: the posting whose closing waits for the recruiter's confirmation
  const [closing, setClosing] = useState<number | null>(null);
  const [closeBusy, setCloseBusy] = useState(false);
  const [closeRefusal, setCloseRefusal] = useState<{ postingId: number; reason: string } | null>(null);

  async function confirmClose(postingId: number) {
    setCloseBusy(true);
    setCloseRefusal(null);
    try {
      const closed = await closePosting(token, postingId);
      setPostings((current) =>
        current && {
          ...current,
          postings: current.postings.map((row) =>
            row.postingId === postingId
              ? { ...row, postStatus: closed.postStatus, closingReason: closed.closingReason ?? null }
              : row,
          ),
        },
      );
      setClosing(null);
    } catch (err) {
      if (err instanceof SessionEnded) {
        setEnded(true);
        return;
      }
      setCloseRefusal({
        postingId,
        reason:
          err instanceof PostingRejected && err.message ? err.message : "The posting could not be closed. Try again.",
      });
    } finally {
      setCloseBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    viewRecruiterPostings(token)
      .then((loaded) => !cancelled && setPostings(loaded))
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (err instanceof SessionEnded) {
          setEnded(true);
        } else {
          setError("The postings could not be loaded. Try again in a moment.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (ended) {
    return (
      <AccessNotice title="Your session has ended" logInTo="/recruiter/postings" ended>
        Log in again as a recruiter to see your postings.
      </AccessNotice>
    );
  }

  const organizationName = postings?.organizationName;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle subtitle={organizationName ? `Every posting of ${organizationName}, with its status.` : undefined}>
          Postings
        </PageTitle>
        <Link href="/recruiter/postings/new" className="btn btn-primary">
          New posting
        </Link>
      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {!postings ? (
        !error && <p className="text-muted">Loading postings…</p>
      ) : !organizationName ? (
        <EmptyState card>You are not acting for an organization, so there are no postings to show.</EmptyState>
      ) : postings.postings.length === 0 ? (
        <EmptyState card action={{ href: "/recruiter/postings/new", label: "Create the first one." }}>
          {organizationName} has no postings yet.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {postings.postings.map((row) => {
            const line = note(row, organizationName);
            return (
              <li key={row.postingId} className="flex flex-col gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3.5">
                <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-4">
                  <div className="min-w-0 grow">
                    <p className="font-semibold">{row.title}</p>
                    {line && <p className="text-sm text-muted">{line}</p>}
                  </div>
                  <PostingStatusBadge
                    postStatus={row.postStatus}
                    closingReason={row.closingReason}
                    className="w-44 shrink-0 self-start md:self-center"
                  />
                  {row.postStatus === "RETURNED" && (
                    <Link href={editPostingPath(row.postingId)} className="btn btn-sm self-start md:self-center">
                      Revise
                    </Link>
                  )}
                  {row.postStatus === "DRAFT" && (
                    <Link href={editPostingPath(row.postingId)} className="btn btn-sm self-start md:self-center">
                      Continue
                    </Link>
                  )}
                  {row.postStatus === "PUBLISHED" && closing !== row.postingId && (
                    <button
                      type="button"
                      className="btn btn-sm self-start md:self-center"
                      onClick={() => {
                        setCloseRefusal(null);
                        setClosing(row.postingId);
                      }}
                    >
                      Close
                    </button>
                  )}
                </div>
                {closing === row.postingId && (
                  <div
                    role="dialog"
                    aria-labelledby={`close-${row.postingId}`}
                    className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
                  >
                    <h2 id={`close-${row.postingId}`} className="font-display text-lg font-semibold">
                      Close {row.title}?
                    </h2>
                    <p className="text-sm">
                      It leaves the job board and takes no new applications. Applications in progress continue. A
                      closed posting cannot be opened again.
                    </p>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button type="button" className="btn" onClick={() => setClosing(null)} disabled={closeBusy}>
                        Go back
                      </button>
                      <button
                        type="button"
                        className="btn btn-neutral"
                        onClick={() => void confirmClose(row.postingId)}
                        disabled={closeBusy}
                      >
                        {closeBusy ? "Closing…" : "Close posting, final"}
                      </button>
                    </div>
                  </div>
                )}
                {closeRefusal?.postingId === row.postingId && (
                  <div role="alert" className="alert alert-error">
                    <span>{closeRefusal.reason}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
