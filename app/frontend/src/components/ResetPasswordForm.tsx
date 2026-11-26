"use client";

import Link from "next/link";
import { useState } from "react";
import { NewPasswordRefused, ResetLinkRefused, resetPassword } from "@/lib/api";
import FormField from "./FormField";

type State =
  | { kind: "form"; passwordError?: string; error?: string }
  | { kind: "done" }
  | { kind: "link"; message: string };

// Log In, forgotten password, CO-LI.2
export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<State>({ kind: "form" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setState({ kind: "done" });
    } catch (err) {
      if (err instanceof NewPasswordRefused) {
        setState({ kind: "form", passwordError: err.password });
      } else if (err instanceof ResetLinkRefused) {
        setState({ kind: "link", message: err.message });
      } else {
        setState({ kind: "form", error: "Unable to change the password. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (state.kind === "done") {
    return (
      <section role="status" className="card border border-primary bg-base-100">
        <div className="card-body gap-3">
          <h2 className="font-display text-xl font-semibold">Your password is changed</h2>
          <p>Log in with your new password. The old one no longer works.</p>
          <div>
            <Link href="/login" className="btn btn-primary">
              Log in
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (state.kind === "link") {
    return (
      <div role="alert" className="alert alert-soft alert-error flex-col items-start">
        <span>{state.message}</span>
        <Link href="/forgot-password" className="link link-primary font-semibold">
          Ask for a new link
        </Link>
      </div>
    );
  }

  return (
    <>
      {state.error && (
        <div role="alert" className="alert alert-error">
          <span>{state.error}</span>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        aria-label="Choose a new password"
        className="card card-body gap-4 border border-base-300 bg-base-100"
        noValidate
      >
        <FormField
          id="reset-password"
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint="At least 10 characters, with a letter and a number."
          error={state.passwordError}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          Save new password
        </button>
      </form>
    </>
  );
}
