"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ApplicationRefused,
  formatDate,
  formatDateTime,
  formatStage,
  requestWithdrawal,
  viewApplication,
  viewApplications,
  withdrawApplication,
  type ApplicationDetail,
  type ApplicationSummary,
  type WithdrawalRequest,
} from "@/lib/api";
import { APPLICATION_LIMIT } from "@/lib/sampleDesk";
import BackendDown from "./BackendDown";
import EmptyState from "./EmptyState";
import PageTitle from "./PageTitle";
import SlotMeter from "./SlotMeter";
import { StageBadge, StageProgress } from "./StageBadge";

type FilterKind = "all" | "active" | "terminal";

const WITHDRAWAL_REASONS = [
  "Accepted another offer",
  "No longer interested",
  "Other",
] as const;

export default function ApplicationsTracker({
  initialApplicationId,
}: {
  initialApplicationId?: number;
}) {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(initialApplicationId ?? null);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [filter, setFilter] = useState<FilterKind>("all");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [backendDown, setBackendDown] = useState(false);
  const [notFoundError, setNotFoundError] = useState("");

  // UC-06 Withdrawal state
  const [withdrawalPreview, setWithdrawalPreview] = useState<WithdrawalRequest | null>(null);
  const [withdrawalReasonChoice, setWithdrawalReasonChoice] = useState("");
  const [withdrawalComment, setWithdrawalComment] = useState("");
  const [withdrawalConfirmed, setWithdrawalConfirmed] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmationBanner, setConfirmationBanner] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      setBackendDown(false);
      try {
        const list = await viewApplications();
        if (cancelled) {
          return;
        }
        setApplications(list.applications);
        setActiveCount(list.activeApplicationCount);
        const firstId = initialApplicationId ?? list.applications[0]?.applicationId ?? null;
        setSelectedId(firstId);
      } catch {
        if (!cancelled) {
          setBackendDown(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [initialApplicationId]);

  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    let cancelled = false;
    async function loadSelected(id: number) {
      setLoadingDetail(true);
      setNotFoundError("");
      setActionError("");
      setWithdrawalPreview(null);
      try {
        const loaded = await viewApplication(id);
        if (cancelled) {
          return;
        }
        if (!loaded) {
          setDetail(null);
          setNotFoundError("That application was not found.");
          return;
        }
        setDetail(loaded);
        setActiveCount(loaded.activeApplicationCount);
      } catch {
        if (!cancelled) {
          setBackendDown(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    }
    void loadSelected(selectedId);
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  if (backendDown) {
    return <BackendDown />;
  }

  const filteredApplications = applications.filter((app) => {
    if (filter === "active") {
      return app.active;
    }
    if (filter === "terminal") {
      return !app.active;
    }
    return true;
  });

  async function startWithdrawal() {
    if (!detail) {
      return;
    }
    setActionError("");
    setConfirmationBanner("");
    try {
      const preview = await requestWithdrawal(detail.applicationId);
      setWithdrawalPreview(preview);
      setWithdrawalReasonChoice("");
      setWithdrawalComment("");
      setWithdrawalConfirmed(false);
    } catch (err) {
      setActionError(
        err instanceof ApplicationRefused && err.message
          ? err.message
          : "Unable to start withdrawal. Please try again.",
      );
    }
  }

  function cancelWithdrawal() {
    setWithdrawalPreview(null);
    setWithdrawalReasonChoice("");
    setWithdrawalComment("");
    setWithdrawalConfirmed(false);
    setActionError("");
  }

  async function handleConfirmWithdrawal(event: React.FormEvent) {
    event.preventDefault();
    if (!detail) {
      return;
    }
    setActionError("");
    setWithdrawing(true);
    const combinedReason = [withdrawalReasonChoice, withdrawalComment.trim()]
      .filter(Boolean)
      .join(": ");
    try {
      const updated = await withdrawApplication(
        detail.applicationId,
        combinedReason || null,
      );
      setDetail(updated);
      setActiveCount(updated.activeApplicationCount);
      setApplications((current) =>
        current
          .map((item) =>
            item.applicationId === updated.applicationId
              ? {
                  ...item,
                  applicationStatus: updated.applicationStatus,
                  lastUpdatedDate: updated.lastUpdatedDate,
                  active: false,
                }
              : item,
          )
          .sort((a, b) => Number(b.active) - Number(a.active) || a.applicationId - b.applicationId),
      );
      setWithdrawalPreview(null);
      setConfirmationBanner(
        `Application withdrawn for ${updated.title} at ${updated.organizationName}. You now have ${updated.activeApplicationCount} of ${APPLICATION_LIMIT} active applications.`,
      );
    } catch (err) {
      setActionError(
        err instanceof ApplicationRefused && err.message
          ? err.message
          : "Unable to withdraw the application. Please try again.",
      );
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <PageTitle subtitle="Follow every stage of your applications, review interview details, or withdraw an active application.">
          Track application status
        </PageTitle>

        {confirmationBanner && (
          <div role="status" className="alert alert-info">
            <span>{confirmationBanner}</span>
          </div>
        )}

        {notFoundError && (
          <div role="alert" className="alert alert-warning">
            <span>{notFoundError}</span>
          </div>
        )}

        {loadingList ? (
          <article className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <p className="text-muted">Loading your applications…</p>
            </div>
          </article>
        ) : applications.length === 0 ? (
          <EmptyState action={{ href: "/jobs", label: "See all open jobs" }}>
            You have not submitted any applications yet.
          </EmptyState>
        ) : (
          <>
            <article className="card border border-base-300 bg-base-100">
              <div className="card-body gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Your applications</h2>
                    <p className="text-sm text-muted">
                      Active applications appear first ({activeCount} of {APPLICATION_LIMIT} active).
                    </p>
                  </div>

                  <div role="group" aria-label="Filter applications" className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className={`btn btn-sm ${filter === "all" ? "bg-secondary font-semibold" : ""}`}
                    >
                      All ({applications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("active")}
                      className={`btn btn-sm ${filter === "active" ? "bg-secondary font-semibold" : ""}`}
                    >
                      Active ({applications.filter((a) => a.active).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("terminal")}
                      className={`btn btn-sm ${filter === "terminal" ? "bg-secondary font-semibold" : ""}`}
                    >
                      Closed ({applications.filter((a) => !a.active).length})
                    </button>
                  </div>
                </div>

                {filteredApplications.length === 0 ? (
                  <p className="text-muted">No applications match this filter.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {filteredApplications.map((application) => {
                      const isSelected = application.applicationId === selectedId;
                      return (
                        <li
                          key={application.applicationId}
                          className={`flex flex-col gap-2 rounded-xl border px-4 py-3 md:flex-row md:items-center md:gap-5 md:py-4 ${
                            isSelected
                              ? "border-primary bg-base-100"
                              : "border-base-300 bg-base-100"
                          }`}
                        >
                          <div className="flex items-start gap-3 md:contents">
                            <div className="min-w-0 grow">
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmationBanner("");
                                  setSelectedId(application.applicationId);
                                }}
                                className="text-left font-semibold hover:underline"
                              >
                                {application.title}
                              </button>
                              <p className="text-sm text-muted">
                                {application.organizationName} · {application.location}
                              </p>
                              <p className="text-sm text-muted">
                                Submitted {formatDate(application.dateApplied)} · Last change{" "}
                                {formatDate(application.lastUpdatedDate)}
                              </p>
                            </div>
                            <StageBadge
                              stage={application.applicationStatus}
                              className="md:order-3 md:w-32"
                            />
                          </div>

                          <StageProgress
                            stage={application.applicationStatus}
                            className="md:order-2 md:w-36"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setConfirmationBanner("");
                              setSelectedId(application.applicationId);
                            }}
                            className="link link-primary py-1 text-left font-semibold no-underline hover:underline md:order-4 md:py-2"
                          >
                            {isSelected ? "Viewing" : "View history"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </article>

            {loadingDetail ? (
              <article className="card border border-base-300 bg-base-100">
                <div className="card-body">
                  <p className="text-muted">Loading application history…</p>
                </div>
              </article>
            ) : (
              detail && (
                <article className="card border border-base-300 bg-base-100">
                  <div className="card-body gap-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                          Application history
                        </p>
                        <h2 className="mt-1 font-display text-2xl font-semibold">{detail.title}</h2>
                        <p className="text-muted">
                          {detail.organizationName} · {detail.location} · {detail.employmentType}
                        </p>
                      </div>
                      <StageBadge stage={detail.applicationStatus} />
                    </div>

                    {actionError && (
                      <div role="alert" className="alert alert-error">
                        <span>{actionError}</span>
                      </div>
                    )}

                    {detail.applicationStatus === "REJECTED" && (
                      <div role="status" className="alert alert-warning">
                        <span>
                          Rejected on {formatDate(detail.rejectionDate ?? detail.lastUpdatedDate)}
                          {detail.rejectedAtStage
                            ? ` at the ${formatStage(detail.rejectedAtStage)} stage`
                            : ""}
                          {detail.rejectionReason ? `. Reason: ${detail.rejectionReason}` : "."}
                        </span>
                      </div>
                    )}

                    {detail.applicationStatus === "WITHDRAWN" && (
                      <div role="status" className="alert alert-info">
                        <span>
                          Withdrawn on{" "}
                          {detail.withdrawnAt
                            ? formatDateTime(detail.withdrawnAt)
                            : formatDate(detail.lastUpdatedDate)}
                          {detail.withdrawalReason ? `. Reason: ${detail.withdrawalReason}` : "."}{" "}
                          No further actions are available for this application.
                        </span>
                      </div>
                    )}

                    <section>
                      <h3 className="font-semibold">Pipeline stage history</h3>
                      <ol className="mt-3 flex flex-col gap-2">
                        {detail.statusHistory.map((entry, index) => (
                          <li
                            key={`${entry.status}-${entry.date}-${index}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-base-300 px-4 py-2.5"
                          >
                            <div className="flex items-center gap-3">
                              <StageBadge stage={entry.status} />
                              {entry.reason && (
                                <span className="text-sm text-muted">Note: {entry.reason}</span>
                              )}
                            </div>
                            <span className="text-sm text-muted">{formatDate(entry.date)}</span>
                          </li>
                        ))}
                      </ol>
                    </section>

                    <section>
                      <h3 className="font-semibold">Recorded interviews</h3>
                      {detail.interviews.length === 0 ? (
                        <p className="mt-1 text-sm text-muted">
                          No interviews have been recorded for this application yet.
                        </p>
                      ) : (
                        <ul className="mt-2 flex flex-col gap-2">
                          {detail.interviews.map((interview) => (
                            <li
                              key={interview.interviewId}
                              className="rounded-xl border border-base-300 px-4 py-3"
                            >
                              <p className="font-medium">
                                {formatDateTime(interview.scheduledTime)}
                              </p>
                              <p className="text-sm text-muted">
                                {interview.format ?? "Interview"} ·{" "}
                                {interview.location ?? "Location to be confirmed"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    {detail.applicationStatus === "OFFER" && detail.offer && (
                      <section className="flex flex-col gap-3 border-t border-base-300 pt-5">
                        <h3 className="font-semibold">Job offer waiting for your response</h3>
                        <dl className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <dt className="text-sm text-muted">Compensation</dt>
                            <dd className="font-medium">{detail.offer.salary}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-muted">Start date</dt>
                            <dd className="font-medium">
                              {detail.offer.startDate
                                ? formatDate(detail.offer.startDate)
                                : "To be arranged"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-muted">Respond by</dt>
                            <dd className="font-medium">
                              {formatDate(detail.offer.expirationDate)}
                            </dd>
                          </div>
                        </dl>
                        {detail.offer.terms && (
                          <p className="text-sm text-muted">{detail.offer.terms}</p>
                        )}
                        <div>
                          <Link
                            href={`/offers?applicationId=${detail.applicationId}`}
                            className="btn btn-primary"
                          >
                            Respond to job offer
                          </Link>
                        </div>
                      </section>
                    )}

                    {detail.availableActions.includes("WITHDRAW") && !withdrawalPreview && (
                      <section className="flex flex-col gap-3 border-t border-base-300 pt-5">
                        <p className="text-sm text-muted">
                          Submitted applications cannot be edited. If you no longer wish to be
                          considered, you can withdraw this application to free an active slot.
                        </p>
                        <div>
                          <button
                            type="button"
                            onClick={startWithdrawal}
                            className="btn btn-primary"
                          >
                            Withdraw application
                          </button>
                        </div>
                      </section>
                    )}

                    {withdrawalPreview && (
                      <form
                        onSubmit={handleConfirmWithdrawal}
                        className="flex flex-col gap-4 border-t border-base-300 pt-5"
                      >
                        <h3 className="text-lg font-semibold">
                          Withdraw application for {withdrawalPreview.title}
                        </h3>
                        <p className="text-sm text-muted">
                          {withdrawalPreview.organizationName} · Current stage:{" "}
                          {formatStage(withdrawalPreview.applicationStatus)}
                        </p>

                        <div role="status" className="alert alert-warning">
                          <span>{withdrawalPreview.warning}</span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="flex flex-col gap-2">
                            <label htmlFor="withdrawal-reason" className="font-medium">
                              Reason for withdrawing (optional)
                            </label>
                            <select
                              id="withdrawal-reason"
                              className="select w-full border-base-300 bg-base-100"
                              value={withdrawalReasonChoice}
                              onChange={(event) => setWithdrawalReasonChoice(event.target.value)}
                            >
                              <option value="">No reason selected</option>
                              {WITHDRAWAL_REASONS.map((reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label htmlFor="withdrawal-comment" className="font-medium">
                              Additional comment (optional)
                            </label>
                            <input
                              id="withdrawal-comment"
                              type="text"
                              className="input w-full"
                              maxLength={500}
                              placeholder="Optional note"
                              value={withdrawalComment}
                              onChange={(event) => setWithdrawalComment(event.target.value)}
                            />
                          </div>
                        </div>

                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary mt-0.5"
                            checked={withdrawalConfirmed}
                            onChange={(event) => setWithdrawalConfirmed(event.target.checked)}
                          />
                          <span>
                            I understand that withdrawing is final and that I cannot apply to this
                            posting again.
                          </span>
                        </label>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={cancelWithdrawal}
                            className="btn"
                            disabled={withdrawing}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!withdrawalConfirmed || withdrawing}
                          >
                            {withdrawing ? "Withdrawing…" : "Confirm withdrawal"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </article>
              )
            )}
          </>
        )}
      </div>

      <aside className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
        <SlotMeter
          used={activeCount}
          total={APPLICATION_LIMIT}
          caption="A slot frees up when you withdraw an application or it reaches Hired, Rejected or Offer Declined."
        />

        <section className="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-5">
          <h2 className="font-semibold">Need another role?</h2>
          <p className="text-sm text-muted">
            You can have up to {APPLICATION_LIMIT} active applications across all organizations at a
            time.
          </p>
          <Link
            href="/jobs"
            className="link link-primary pt-1 font-semibold no-underline hover:underline"
          >
            Browse open jobs
          </Link>
        </section>
      </aside>
    </div>
  );
}

