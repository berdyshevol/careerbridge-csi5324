"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogInRefused, logIn } from "@/lib/api";
import { safeNext, saveSession } from "@/lib/session";
import FormField from "./FormField";

export default function LogInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const session = await logIn(email, password);
      saveSession(session);
      router.replace(safeNext(next, session.user.role));
      router.refresh(); // the header is rendered on the server and reads the new cookie
    } catch (err) {
      setError(
        err instanceof LogInRefused && err.message ? err.message : "Unable to log in. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        aria-label="Log in"
        className="card card-body gap-4 border border-base-300 bg-base-100"
      >
        <FormField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <FormField
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          Log in
        </button>
      </form>
    </>
  );
}
