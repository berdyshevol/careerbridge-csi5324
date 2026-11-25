"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  acceptOffer,
  ApplicationActionRefused,
  declineOffer,
  formatDate,
  OfferRevised,
  SessionEnded,
  type OfferSummary,
} from "@/lib/api";
import { useEndSession } from "@/lib/useEndSession";
import { TextAreaField } from "./FormField";

type DialogKind = "accept" | "decline" | null;

export default function OfferResponsePanel({
  applicationId,
  title,
  organizationName,
  token,
  isOfferStage,
  offer,
  canAccept,
  canDecline,
}: {
  applicationId: number;
  title: string;
  organizationName: string;
  token: string;
  isOfferStage: boolean;
  offer: OfferSummary | null;
  canAccept: boolean;
  canDecline: boolean;
}) {
  const router = useRouter();
  const endSession = useEndSession();
  const [revisedOffer, setRevisedOffer] = useState<OfferSummary | null>(null);
  const currentOffer =
    revisedOffer && (!offer || revisedOffer.revision > offer.revision) ? revisedOffer : offer;
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmed, setConfirmed] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const acceptTriggerRef = useRef<HTMLButtonElement>(null);
  const declineTriggerRef = useRef<HTMLButtonElement>(null);
  const lastDialogRef = useRef<DialogKind>(null);

  useEffect(() => {
    if (dialog) {
      lastDialogRef.current = dialog;
      dialogRef.current?.focus();
    } else if (lastDialogRef.current === "accept") {
      lastDialogRef.current = null;
      acceptTriggerRef.current?.focus();
    } else if (lastDialogRef.current === "decline") {
      lastDialogRef.current = null;
      declineTriggerRef.current?.focus();
    }
  }, [dialog]);

  function handleCloseDialog() {
    setDialog(null);
    setDeclineReason("");
    setError("");
  }

  async function handleAccept(event: React.FormEvent) {
    event.preventDefault();
    if (!currentOffer) {
      return;
    }
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await acceptOffer(token, applicationId, currentOffer.revision);
      lastDialogRef.current = null;
      setDialog(null);
      setConfirmed("Offer accepted. Your application is now in the Hired stage.");
      router.refresh();
    } catch (err) {
      if (err instanceof SessionEnded) {
        endSession();
        setError("Your session has ended. Log in again to respond to this offer.");
      } else if (err instanceof OfferRevised) {
        setRevisedOffer(err.revisedOffer);
        setDialog(null);
        setNotice(err.message);
      } else if (err instanceof ApplicationActionRefused) {
        setDialog(null);
        setError(err.message);
        router.refresh();
      } else {
        setError("Unable to accept this offer right now. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDecline(event: React.FormEvent) {
    event.preventDefault();
    if (!currentOffer) {
      return;
    }
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const result = await declineOffer(token, applicationId, declineReason, currentOffer.revision);
      lastDialogRef.current = null;
      setDialog(null);
      setDeclineReason("");
      setConfirmed(
        `Offer declined. You now have ${result.activeApplicationCount} of ${result.applicationLimit} active applications.`,
      );
      router.refresh();
    } catch (err) {
      if (err instanceof SessionEnded) {
        endSession();
        setError("Your session has ended. Log in again to respond to this offer.");
      } else if (err instanceof OfferRevised) {
        setRevisedOffer(err.revisedOffer);
        setDialog(null);
        setNotice(err.message);
      } else if (err instanceof ApplicationActionRefused) {
        setDialog(null);
        setError(err.message);
        router.refresh();
      } else {
        setError("Unable to decline this offer right now. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!isOfferStage && !confirmed && !error) {
    return null;
  }

  if (!isOfferStage) {
    return (
      <div className="flex flex-col gap-3">
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
      </div>
    );
  }

  const isExpired = Boolean(currentOffer?.expired && currentOffer.status === "PENDING");
  const showActions = Boolean(currentOffer) && !isExpired && !confirmed && (canAccept || canDecline);
  const eyebrow = currentOffer
    ? isExpired
      ? `Offer · response deadline was ${formatDate(currentOffer.expirationDate)}`
      : `Offer · respond by ${formatDate(currentOffer.expirationDate)}`
    : "Offer";

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label={isExpired ? "Offer after its response deadline" : "Offer"}
        className="flex flex-col gap-4 rounded-2xl bg-warning p-5 text-warning-content"
      >
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider">{eyebrow}</p>
          <p className="font-display text-xl font-semibold text-base-content">
            {organizationName} offers you the {title} position
          </p>
        </div>

        {currentOffer && (
          <dl className="grid gap-x-6 gap-y-2 text-sm text-base-content sm:grid-cols-[8.5rem_minmax(0,1fr)]">
            <dt className="font-semibold text-warning-content">Start date</dt>
            <dd>{formatDate(currentOffer.startDate)}</dd>
            <dt className="font-semibold text-warning-content">Compensation</dt>
            <dd>{currentOffer.salary}</dd>
            {currentOffer.terms && (
              <>
                <dt className="font-semibold text-warning-content">Other terms</dt>
                <dd>{currentOffer.terms}</dd>
              </>
            )}
            {currentOffer.offerLetterFileName && (
              <>
                <dt className="font-semibold text-warning-content">Offer letter</dt>
                <dd>{currentOffer.offerLetterFileName}</dd>
              </>
            )}
          </dl>
        )}

        {notice && (
          <div role="status" className="alert alert-soft alert-info text-sm">
            <span>{notice}</span>
          </div>
        )}

        {confirmed && (
          <div role="status" className="alert alert-soft alert-success text-sm">
            <span>{confirmed}</span>
          </div>
        )}

        {error && (
          <div role="alert" className="alert alert-soft alert-error text-sm">
            <span>{error}</span>
          </div>
        )}

        {isExpired ? (
          <p className="text-sm text-base-content">This offer can no longer be accepted.</p>
        ) : (
          showActions && (
            <>
              <p className="text-sm text-base-content">Accepting or declining is final.</p>
              {!dialog && (
                <div className="flex flex-wrap gap-3">
                  {canAccept && (
                    <button
                      ref={acceptTriggerRef}
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setError("");
                        setDialog("accept");
                      }}
                      disabled={busy}
                    >
                      Accept offer
                    </button>
                  )}
                  {canDecline && (
                    <button
                      ref={declineTriggerRef}
                      type="button"
                      className="btn"
                      onClick={() => {
                        setError("");
                        setDialog("decline");
                      }}
                      disabled={busy}
                    >
                      Decline
                    </button>
                  )}
                </div>
              )}
            </>
          )
        )}
      </section>

      {dialog === "accept" && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-labelledby="accept-offer-dialog-title"
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !busy) {
              handleCloseDialog();
            }
          }}
          className="max-w-md rounded-2xl border border-base-300 bg-base-100 p-5 shadow-md outline-none"
        >
          <form onSubmit={handleAccept} className="flex flex-col gap-4">
            <h2 id="accept-offer-dialog-title" className="font-display text-lg font-semibold">
              Accept the {title} offer?
            </h2>
            <p className="text-sm text-base-content">You cannot change your answer afterwards.</p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="btn" onClick={handleCloseDialog} disabled={busy}>
                Go back
              </button>
              <button type="submit" className="btn btn-neutral" disabled={busy}>
                {busy ? "Accepting…" : "Accept, final"}
              </button>
            </div>
          </form>
        </div>
      )}

      {dialog === "decline" && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-labelledby="decline-offer-dialog-title"
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !busy) {
              handleCloseDialog();
            }
          }}
          className="max-w-md rounded-2xl border border-base-300 bg-base-100 p-5 shadow-md outline-none"
        >
          <form onSubmit={handleDecline} className="flex flex-col gap-4">
            <h2 id="decline-offer-dialog-title" className="font-display text-lg font-semibold">
              Decline the {title} offer?
            </h2>
            <TextAreaField
              id="decline-offer-reason"
              label="Reason, optional"
              rows={3}
              maxLength={900}
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
            />
            <p className="text-sm text-base-content">Declining is final.</p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="btn" onClick={handleCloseDialog} disabled={busy}>
                Go back
              </button>
              <button type="submit" className="btn btn-neutral" disabled={busy}>
                {busy ? "Declining…" : "Decline, final"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

