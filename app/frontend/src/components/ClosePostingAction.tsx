"use client";

import { useEffect, useRef, useState } from "react";
import { closePosting, PostingRejected, SessionEnded, type JobPosting } from "@/lib/api";

// UC-13 extension *a, CO-13.2: the recruiter who created a published posting closes it, after
// confirming. Each row has its own, so one row's confirmation never opens or closes another's.
export default function ClosePostingAction({
  token,
  postingId,
  title,
  onClosed,
  onRefused,
  onSessionEnded,
}: {
  token: string;
  postingId: number;
  title: string;
  onClosed: (closed: JobPosting) => void;
  // The posting changed meanwhile (closed elsewhere, past its deadline): the list reloads
  onRefused: () => void;
  onSessionEnded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    } else if (restoreFocusRef.current) {
      restoreFocusRef.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  function goBack() {
    restoreFocusRef.current = true;
    setOpen(false);
  }

  async function confirm() {
    setBusy(true);
    try {
      onClosed(await closePosting(token, postingId));
    } catch (err) {
      if (err instanceof SessionEnded) {
        onSessionEnded();
        return;
      }
      // A refusal is final: retrying would be refused again, so the confirmation goes and the reason stays
      setRefusal(
        err instanceof PostingRejected && err.message ? err.message : "The posting could not be closed. Try again.",
      );
      restoreFocusRef.current = true;
      setOpen(false);
      if (err instanceof PostingRejected) {
        onRefused();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          ref={triggerRef}
          type="button"
          className="btn btn-sm self-start md:self-center"
          onClick={() => {
            setRefusal("");
            setOpen(true);
          }}
        >
          Close
        </button>
      )}
      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-labelledby={`close-${postingId}`}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !busy) {
              goBack();
            }
          }}
          className="flex w-full flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md outline-none md:basis-full"
        >
          <h2 id={`close-${postingId}`} className="font-display text-lg font-semibold">
            Close {title}?
          </h2>
          <p className="text-sm">
            It leaves the job board and takes no new applications. Applications in progress continue. A closed posting
            cannot be opened again.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn" onClick={goBack} disabled={busy}>
              Go back
            </button>
            <button type="button" className="btn btn-neutral" onClick={() => void confirm()} disabled={busy}>
              {busy ? "Closing…" : "Close posting, final"}
            </button>
          </div>
        </div>
      )}
      {refusal && (
        <div role="alert" className="alert alert-error w-full md:basis-full">
          <span>{refusal}</span>
        </div>
      )}
    </>
  );
}
