"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  decideRecruiterRequest,
  MembershipConflict,
  SessionEnded,
  type RecruiterRequestDetails,
  type RequestDecision,
} from "@/lib/api";
import { useEndSession } from "@/lib/useEndSession";
import { TextAreaField } from "./FormField";

// "wacofreight.example" opens as https://wacofreight.example (UC-10 variation 5a)
function websiteHref(website: string) {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

// UC-10 steps 4-8 and extensions 5a, 5b, 5c and 6a
export default function RecruiterRequestReview({ token, request }: { token: string; request: RecruiterRequestDetails }) {
  const router = useRouter();
  const endSession = useEndSession();
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [decided, setDecided] = useState(request.status === "PENDING" || request.status === "INFORMATION_REQUESTED"
    ? ""
    : `This request is now ${request.status === "ACTIVE" ? "Approved" : request.statusLabel}.`);
  const firstName = request.requester.name.split(" ")[0];
  const { organization, duplicateOf } = request;

  async function decide(decision: RequestDecision) {
    if (decision !== "approve" && !note.trim()) {
      setError(decision === "deny" ? `Write the reason ${firstName} will receive.` : `Write the question for ${firstName}.`);
      return;
    }
    setError("");
    setWorking(true);
    try {
      await decideRecruiterRequest(token, request.requestId, decision, note);
      // Step 8: back to the queue, without the decided request
      router.push("/admin/requests");
      router.refresh();
    } catch (err) {
      if (err instanceof SessionEnded) {
        endSession();
        setError("Your session has ended. Log in again as an administrator.");
      } else if (err instanceof MembershipConflict) {
        setDecided(err.message);
      } else {
        setError(err instanceof Error && err.message && !err.message.startsWith("Backend")
          ? err.message
          : "Unable to record the decision. Please try again.");
      }
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/requests" className="link link-primary text-sm">
        ← Requests
      </Link>
      <h1 className="font-display text-2xl font-semibold md:text-3xl">{request.requester.name}</h1>
      {request.reviewFlag && (
        <div role="status" className="alert alert-warning">
          <span>
            <b>Flagged for review.</b> The work email {request.requester.email} does not match the organization&apos;s
            website, {organization.website}.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <section className="card border border-base-300 bg-base-100">
              <div className="card-body gap-3">
                <h2 className="font-display text-xl font-semibold">Requester</h2>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted">Name</dt>
                  <dd>{request.requester.name}</dd>
                  <dt className="text-muted">Work email</dt>
                  <dd className="break-all">{request.requester.email}</dd>
                  <dt className="text-muted">Job title</dt>
                  <dd>{request.requester.jobTitle ?? "Not given"}</dd>
                  <dt className="text-muted">Memberships</dt>
                  <dd className={request.memberships.length ? "" : "text-muted"}>
                    {request.memberships.length
                      ? request.memberships.map((m) => `${m.organization.name} (${m.statusLabel})`).join(", ")
                      : "None yet"}
                  </dd>
                </dl>
              </div>
            </section>
            <section className="card border border-base-300 bg-base-100">
              <div className="card-body gap-3">
                <h2 className="font-display text-xl font-semibold">{organization.name}</h2>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted">Website</dt>
                  <dd>
                    {organization.website ? (
                      <a href={websiteHref(organization.website)} target="_blank" rel="noreferrer" className="link link-primary">
                        {organization.website} ↗
                      </a>
                    ) : (
                      "Not given"
                    )}
                  </dd>
                  <dt className="text-muted">Industry</dt>
                  <dd>{organization.industry ?? "Not given"}</dd>
                  <dt className="text-muted">Headquarters</dt>
                  <dd>{organization.headquarters ?? "Not given"}</dd>
                  <dt className="text-muted">Size</dt>
                  <dd>{organization.size ?? "Not given"}</dd>
                </dl>
                {organization.description && <p className="text-sm">{organization.description}</p>}
              </div>
            </section>
          </div>
          {request.justification && (
            <section className="card border border-base-300 bg-base-100">
              <div className="card-body gap-2">
                <h2 className="font-display text-xl font-semibold">Justification</h2>
                {request.role && <p className="text-sm text-muted">Role: {request.role}</p>}
                <p className="text-sm">{request.justification}</p>
              </div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-3 lg:w-80">
          <section aria-label="Decision" className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5">
            <h2 className="font-display text-xl font-semibold">Your decision</h2>
            {decided ? (
              <p role="status" className="alert alert-warning">
                {decided} Nothing was changed.
              </p>
            ) : (
              <>
                {error && (
                  <div role="alert" className="alert alert-soft alert-error">
                    <span>{error}</span>
                  </div>
                )}
                <button type="button" className="btn btn-primary btn-block" disabled={working} onClick={() => void decide("approve")}>
                  {duplicateOf ? `Approve membership in the existing ${duplicateOf.name} instead` : "Approve"}
                </button>
                {duplicateOf && <p className="text-xs text-muted">The duplicate organization record is discarded.</p>}
                <TextAreaField
                  id="decision-note"
                  label={`Message to ${firstName}`}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={2000}
                />
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn grow" disabled={working} onClick={() => void decide("request-information")}>
                    Ask for information
                  </button>
                  <button type="button" className="btn btn-error btn-outline grow" disabled={working} onClick={() => void decide("deny")}>
                    Deny
                  </button>
                </div>
                <p className="text-xs text-muted">
                  Denying needs a reason, and {firstName} receives it. Asking keeps the request waiting, marked
                  “Information requested”.
                </p>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
