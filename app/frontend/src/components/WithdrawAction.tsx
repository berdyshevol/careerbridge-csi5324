"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ApplicationActionRefused,
  requestWithdrawal,
  SessionEnded,
  withdrawApplication,
  type WithdrawalPrompt,
} from "@/lib/api";
import { useEndSession } from "@/lib/useEndSession";
import { SelectField, TextAreaField } from "./FormField";

export default function WithdrawAction({
  applicationId,
  token,
}: {
  applicationId: number;
  token: string;
}) {
  const router = useRouter();
  const endSession = useEndSession();
  const [prompt, setPrompt] = useState<WithdrawalPrompt | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState("");

  async function handleStart() {
    setError("");
    setBusy(true);
    try {
      setPrompt(await requestWithdrawal(token, applicationId));
    } catch (err) {
      if (err instanceof SessionEnded) {
        endSession();
        setError("Your session has ended. Log in again to withdraw.");
      } else if (err instanceof ApplicationActionRefused) {
        setError(err.message);
        router.refresh();
      } else {
        setError("Unable to start withdrawal. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    setPrompt(null);
    setSelectedReason("");
    setComment("");
    setError("");
  }

  async function handleConfirm(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const parts = [selectedReason.trim(), comment.trim()].filter(Boolean);
    const combinedReason = parts.length > 0 ? parts.join(" — ") : undefined;
    try {
      const result = await withdrawApplication(token, applicationId, combinedReason);
      setPrompt(null);
      setConfirmed(
        `Application withdrawn. You now have ${result.activeApplicationCount} of ${result.applicationLimit} active applications.`,
      );
      router.refresh();
    } catch (err) {
      if (err instanceof SessionEnded) {
        endSession();
        setError("Your session has ended. Log in again to withdraw.");
      } else if (err instanceof ApplicationActionRefused) {
        setPrompt(null);
        setError(err.message);
        router.refresh();
      } else {
        setError("Unable to withdraw this application. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body gap-4">
        <p className="text-sm text-muted">
          Submitted applications cannot be edited. You can withdraw while this application is in
          Applied, Screening, or Interview.
        </p>

        {confirmed && (
          <div role="status" className="alert alert-soft alert-success">
            <span>{confirmed}</span>
          </div>
        )}

        {error && (
          <div role="alert" className="alert alert-soft alert-error">
            <span>{error}</span>
          </div>
        )}

        {!prompt && !confirmed && (
          <div>
            <button type="button" className="btn" onClick={handleStart} disabled={busy}>
              {busy ? "Checking…" : "Withdraw application"}
            </button>
          </div>
        )}

        {prompt && (
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-dialog-title"
            onSubmit={handleConfirm}
            className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-md"
          >
            <div className="flex flex-col gap-1">
              <h2 id="withdraw-dialog-title" className="font-display text-lg font-semibold">
                Withdraw your {prompt.title} application?
              </h2>
              <p className="text-sm text-muted">
                {prompt.organizationName} · Current stage: {prompt.applicationStatus}
              </p>
            </div>

            <div role="status" className="alert alert-warning text-sm">
              <span>{prompt.warning}</span>
            </div>

            <SelectField
              id="withdraw-reason"
              label="Reason, optional"
              value={selectedReason}
              onChange={(event) => setSelectedReason(event.target.value)}
            >
              <option value="">Prefer not to say</option>
              {prompt.reasons.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>

            <TextAreaField
              id="withdraw-comment"
              label="Comment, optional"
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />

            <div className="flex flex-col-reverse gap-3 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
              <button type="button" className="btn" onClick={handleCancel} disabled={busy}>
                Go back
              </button>
              <button type="submit" className="btn btn-neutral" disabled={busy}>
                {busy ? "Withdrawing…" : "Withdraw, final"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

