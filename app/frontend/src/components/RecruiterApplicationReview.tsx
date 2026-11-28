"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  RecruiterNotFound,
  SessionEnded,
  downloadApplicationResume,
  reviewApplication,
  type ApplicationReview,
} from "@/lib/api";
import AccessNotice from "./AccessNotice";
import EmptyState from "./EmptyState";
import Loading from "./Loading";
import PageTitle from "./PageTitle";
import StageTimeline from "./StageTimeline";
import { StageBadge } from "./StageBadge";

function fileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const card = "flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5";

// UC-14 steps 3-4, CO-14.1: one application as the recruiter reviews it, read-only. Nothing here comes
// from the applicant's other applications (BR-15).
export default function RecruiterApplicationReview({ token, applicationId }: { token: string; applicationId: number }) {
  const [review, setReview] = useState<ApplicationReview | null>(null);
  const [ended, setEnded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    reviewApplication(token, applicationId)
      .then((loaded) => !cancelled && setReview(loaded))
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (err instanceof SessionEnded) {
          setEnded(true);
        } else if (err instanceof RecruiterNotFound) {
          setMissing(true);
        } else {
          setError("The application could not be loaded. Try again in a moment.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, applicationId]);

  async function download(fileName: string) {
    setDownloadError("");
    try {
      const url = URL.createObjectURL(await downloadApplicationResume(token, applicationId));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof SessionEnded) {
        setEnded(true);
      } else {
        setDownloadError("The resume could not be downloaded. Try again in a moment.");
      }
    }
  }

  if (ended) {
    return (
      <AccessNotice title="Your session has ended" logInTo={`/recruiter/applications/${applicationId}`} ended>
        Log in again as a recruiter to review the application.
      </AccessNotice>
    );
  }
  if (missing) {
    return (
      <div className="flex flex-col gap-6">
        <Link href="/recruiter/postings" className="link link-primary self-start text-sm font-semibold no-underline hover:underline">
          <span aria-hidden="true">← </span>Postings
        </Link>
        <EmptyState card>There is no application at this address.</EmptyState>
      </div>
    );
  }
  if (!review) {
    return error ? (
      <div role="alert" className="alert alert-error">
        <span>{error}</span>
      </div>
    ) : (
      <Loading label="Loading the application…" />
    );
  }

  const { resume, profile } = review;
  const details: [string, string | null][] = [
    ["Email", profile.email],
    ["Phone", profile.phone],
    ["Location", profile.location],
    ["Headline", profile.headline],
  ];
  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/recruiter/postings/${review.postingId}`}
        className="link link-primary self-start text-sm font-semibold no-underline hover:underline"
      >
        <span aria-hidden="true">← </span>
        {review.postingTitle} · {review.stage} stage
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <PageTitle>{review.applicantName}</PageTitle>
        <StageBadge stage={review.stage} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">Resume sent with this application</h2>
              {resume.downloadable && (
                <button type="button" onClick={() => download(resume.fileName)} className="link link-primary text-sm font-semibold">
                  Download {resume.fileName}
                </button>
              )}
            </div>
            <p>
              {resume.fileName} <span className="text-sm text-muted">· {fileSize(resume.fileSize)}</span>
            </p>
            {!resume.downloadable && <p className="text-sm text-muted">The file of this copy was not kept.</p>}
            {downloadError && (
              <div role="alert" className="alert alert-error">
                <span>{downloadError}</span>
              </div>
            )}
          </section>
          <section className={card}>
            <h2 className="font-display text-xl font-semibold">Profile</h2>
            <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
              {details.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted">{label}</dt>
                  <dd className={value ? "" : "text-muted"}>{value ?? "Not given"}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside>
          <section className={card}>
            <h2 className="font-semibold">Stage history</h2>
            <StageTimeline entries={review.history} />
          </section>
        </aside>
      </div>
    </div>
  );
}
