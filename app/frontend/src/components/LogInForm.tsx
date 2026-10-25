"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogInRefused, logIn } from "@/lib/api";
import { safeNext, saveSession } from "@/lib/session";
import PageTitle from "./PageTitle";

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
    <section className="card mx-auto max-w-md border border-base-300 bg-base-100">
      <form onSubmit={handleSubmit} className="card-body gap-4">
        <PageTitle subtitle="Applicants, recruiters and administrators log in here.">Log in</PageTitle>

        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className="font-medium">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className="input w-full"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="login-password" className="font-medium">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            className="input w-full"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-base-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/register" className="link link-primary">
            New here? Register as an applicant
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Log in
          </button>
        </div>
      </form>
    </section>
  );
}
