"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  SessionEnded,
  viewRecruiterPostings,
  type ActiveStage,
  type RecruiterPostingRow,
  type RecruiterPostings,
} from "@/lib/api";
import { STAGES } from "@/lib/sampleDesk";
import AccessNotice from "./AccessNotice";
import EmptyState from "./EmptyState";
import Loading from "./Loading";
import PageTitle from "./PageTitle";
import ClosePostingAction from "./ClosePostingAction";
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

// UC-11 extensions 6a and 3b: a returned posting is revised, a draft continued, on the edit page
const EDIT_ACTIONS: Record<string, string> = { RETURNED: "Revise", DRAFT: "Continue" };

export default function RecruiterPostingList({ token }: { token: string }) {
  const [postings, setPostings] = useState<RecruiterPostings | null>(null);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState("");
  // Bumped when a refusal shows the list is out of date, so it loads again
  const [reload, setReload] = useState(0);
  // A refused close, by posting: kept here so the reason outlives the reload that may change the row
  const [refusals, setRefusals] = useState<Record<number, string>>({});

  function updateRow(postingId: number, postStatus: string, closingReason: string | null) {
    setPostings(
      (current) =>
        current && {
          ...current,
          postings: current.postings.map((row) =>
            row.postingId === postingId ? { ...row, postStatus, closingReason } : row,
          ),
        },
    );
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
  }, [token, reload]);

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
        !error && <Loading label="Loading postings…" />
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
              <li
                key={row.postingId}
                className="flex flex-col flex-wrap gap-2.5 rounded-xl border border-base-300 bg-base-100 px-4 py-3.5 shadow-lift md:flex-row md:items-center md:gap-4"
              >
                <div className="min-w-0 grow">
                  <p className="font-semibold">{row.title}</p>
                  {line && <p className="text-sm text-muted">{line}</p>}
                </div>
                <PostingStatusBadge
                  postStatus={row.postStatus}
                  closingReason={row.closingReason}
                  className="w-44 shrink-0 self-start md:self-center"
                />
                {/* Only the recruiter who created a posting may change or close it (CO-11.2, CO-13.2) */}
                {row.createdByYou && EDIT_ACTIONS[row.postStatus] && (
                  <Link href={editPostingPath(row.postingId)} className="btn btn-sm self-start md:self-center">
                    {EDIT_ACTIONS[row.postStatus]}
                  </Link>
                )}
                {row.createdByYou && row.postStatus === "PUBLISHED" && (
                  <ClosePostingAction
                    token={token}
                    postingId={row.postingId}
                    title={row.title}
                    onClosed={(closed) => updateRow(row.postingId, closed.postStatus, closed.closingReason ?? null)}
                    onRefused={(reason) => {
                      setRefusals((current) => ({ ...current, [row.postingId]: reason }));
                      setReload((count) => count + 1);
                    }}
                    onSessionEnded={() => setEnded(true)}
                  />
                )}
                {refusals[row.postingId] && (
                  <div role="alert" className="alert alert-error w-full md:basis-full">
                    <span>{refusals[row.postingId]}</span>
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
