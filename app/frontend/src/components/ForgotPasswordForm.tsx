"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "@/lib/api";
import FormField from "./FormField";

// Log In, forgotten password, CO-LI.1. The answer never says whether the account exists
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<{ resetLink?: string } | null>(null);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(false);
    setSubmitting(true);
    try {
      setSent(await requestPasswordReset(email));
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <section role="status" className="card border border-primary bg-base-100">
        <div className="card-body gap-2">
          <h2 className="font-display text-xl font-semibold">Check your email</h2>
          <p>If an account exists for {email}, we sent it a link to choose a new password.</p>
          <p className="text-sm text-muted">The link works for 30 minutes and only once.</p>
          {sent.resetLink && (
            <p className="text-sm">
              This demonstration sends no email.{" "}
              <Link href={sent.resetLink} className="link link-primary font-semibold">
                Open the reset link
              </Link>
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <>
      {error && (
        <div role="alert" className="alert alert-error">
          <span>Unable to send the link. Please try again.</span>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        aria-label="Forgot password"
        className="card card-body gap-4 border border-base-300 bg-base-100"
      >
        <FormField
          id="forgot-email"
          label="Email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          Send reset link
        </button>
      </form>
    </>
  );
}
