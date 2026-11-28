"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  RecruiterNotFound,
  SessionEnded,
  viewPostingApplicants,
  type PostingApplicant,
  type PostingApplicants,
} from "@/lib/api";
import { STAGES, type Stage } from "@/lib/stages";
import AccessNotice from "./AccessNotice";
import BackLink from "./BackLink";
import EmptyState from "./EmptyState";
import Loading from "./Loading";
import PageTitle from "./PageTitle";
import StageBar from "./StageBar";

// UC-14 steps 3-4: the applicants of one posting at its active stages
export default function RecruiterPostingApplicants({ token, postingId }: { token: string; postingId: number }) {
  const [posting, setPosting] = useState<PostingApplicants | null>(null);
  const [stage, setStage] = useState<Stage>("Applied");
  const [ended, setEnded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    viewPostingApplicants(token, postingId)
      .then((loaded) => !cancelled && setPosting(loaded))
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (err instanceof SessionEnded) {
          setEnded(true);
        } else if (err instanceof RecruiterNotFound) {
          setMissing(true);
        } else {
          setError("The applicants could not be loaded. Try again in a moment.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, postingId]);

  if (ended) {
    return (
      <AccessNotice title="Your session has ended" logInTo={`/recruiter/postings/${postingId}`} ended>
        Log in again as a recruiter to see the applicants.
      </AccessNotice>
    );
  }

  const backToPostings = <BackLink href="/recruiter/postings">Postings</BackLink>;

  if (missing) {
    return (
      <div className="flex flex-col gap-6">
        {backToPostings}
        <EmptyState card>There is no posting at this address.</EmptyState>
      </div>
    );
  }

  const byStage = Object.fromEntries(
    STAGES.map((name) => [name, posting?.applicants.filter((applicant) => applicant.stage === name.toUpperCase()) ?? []]),
  ) as Record<Stage, PostingApplicant[]>;
  const counts = Object.fromEntries(STAGES.map((name) => [name, byStage[name].length])) as Record<Stage, number>;

  return (
    <div className="flex flex-col gap-6">
      {backToPostings}
      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      )}
      {!posting ? (
        !error && <Loading label="Loading applicants…" />
      ) : (
        <>
          <PageTitle>{posting.title}</PageTitle>
          {posting.applicants.length === 0 ? (
            <EmptyState card>No applications.</EmptyState>
          ) : (
            <section aria-label="Applicants by stage" className="flex flex-col gap-4">
              <h2 className="font-display text-xl font-semibold">Applicants</h2>
              <StageBar counts={counts} selected={stage} onSelect={setStage} />
              <ul className="flex flex-col gap-2">
                {byStage[stage].map((applicant) => (
                  <li
                    key={applicant.applicationId}
                    className="flex items-center gap-4 rounded-xl border border-base-300 bg-base-100 px-4 py-3 shadow-lift"
                  >
                    <p className="min-w-0 grow font-semibold">{applicant.name}</p>
                    <Link
                      href={`/recruiter/applications/${applicant.applicationId}`}
                      aria-label={`Open ${applicant.name}`}
                      className="btn btn-sm"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
