"use client";

import { useEffect, useRef, useState } from "react";
import { requestNewVerificationLink, VerificationLinkRefused, verifyRecruiterEmail } from "@/lib/api";
import VerificationSent from "./VerificationSent";

type State =
  | { kind: "verifying" }
  | { kind: "verified" }
  | { kind: "expired" }
  | { kind: "resent"; verificationLink?: string }
  | { kind: "refused"; message: string }
  | { kind: "failed" };

// UC-08 steps 6-8 and extension 6a
export default function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "verifying" });
  const [sending, setSending] = useState(false);
  // React runs an effect twice in development; a second try would find the link already used
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    verifyRecruiterEmail(token)
      .then(() => setState({ kind: "verified" }))
      .catch((err) =>
        setState(
          err instanceof VerificationLinkRefused
            ? err.expired
              ? { kind: "expired" }
              : { kind: "refused", message: err.message }
            : { kind: "failed" },
        ),
      );
  }, [token]);

  async function sendNewLink() {
    setSending(true);
    try {
      const { verificationLink } = await requestNewVerificationLink(token);
      setState({ kind: "resent", verificationLink });
    } catch {
      setState({ kind: "failed" });
    } finally {
      setSending(false);
    }
  }

  switch (state.kind) {
    case "verifying":
      return <p className="text-muted">Checking your link…</p>;
    case "verified":
      return (
        <section role="status" className="card border border-base-300 bg-base-100">
          <div className="card-body gap-2">
            <h1 className="font-display text-2xl font-semibold">Your request is under review</h1>
            <p>The decision will arrive by email.</p>
          </div>
        </section>
      );
    case "expired":
      return (
        <section className="card border border-base-300 bg-base-100">
          <div className="card-body gap-3">
            <h1 className="font-display text-2xl font-semibold">This link has expired</h1>
            <div>
              <button type="button" className="btn btn-sm" disabled={sending} onClick={() => void sendNewLink()}>
                Send a new link
              </button>
            </div>
          </div>
        </section>
      );
    case "resent":
      return <VerificationSent verificationLink={state.verificationLink} />;
    case "refused":
      return (
        <div role="alert" className="alert alert-soft alert-error">
          <span>{state.message}</span>
        </div>
      );
    case "failed":
      return (
        <div role="alert" className="alert alert-error">
          <span>Unable to check the link. Please try again.</span>
        </div>
      );
  }
}
