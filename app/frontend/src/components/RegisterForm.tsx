"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlreadyRegistered, register, RegistrationRefused } from "@/lib/api";
import { safeNext, saveSession } from "@/lib/session";
import FormField from "./FormField";
import PageTitle from "./PageTitle";

type Field = "fullName" | "email" | "password";

// UC-02 Register as Applicant
export default function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<Field, string>>({ fullName: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [alreadyRegistered, setAlreadyRegistered] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});

  // A screen reader hears the first reason: focus moves to the first field the backend refused
  useEffect(() => {
    const first = (["fullName", "email", "password"] as const).find((name) => fieldErrors[name]);
    if (first) {
      inputs.current[first]?.focus();
    }
  }, [fieldErrors]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setAlreadyRegistered("");
    setError("");
    setSubmitting(true);
    try {
      saveSession(await register(values.fullName, values.email, values.password));
      // UC-02 step 3: logged in and invited to add a resume (UC-03), unless they came to apply (UC-04 extension 1a)
      router.replace(next ? safeNext(next, "APPLICANT") : "/profile");
      router.refresh();
    } catch (err) {
      if (err instanceof RegistrationRefused) {
        setFieldErrors(err.fieldErrors);
      } else if (err instanceof AlreadyRegistered) {
        setAlreadyRegistered(err.message);
      } else {
        setError("Unable to create the account. Please try again.");
      }
      setSubmitting(false);
    }
  }

  function field(name: Field, label: string, type: string, autoComplete: string, hint?: string) {
    return (
      <FormField
        id={`register-${name}`}
        label={label}
        type={type}
        autoComplete={autoComplete}
        value={values[name]}
        onChange={(event) => setValues({ ...values, [name]: event.target.value })}
        error={fieldErrors[name]}
        hint={hint}
        inputRef={(element) => {
          inputs.current[name] = element;
        }}
        required
      />
    );
  }

  return (
    <section className="card mx-auto max-w-md border border-base-300 bg-base-100">
      <form onSubmit={handleSubmit} className="card-body gap-4" noValidate>
        <PageTitle subtitle="Create an applicant account to apply for jobs.">Register as an applicant</PageTitle>

        {alreadyRegistered && (
          <div role="alert" className="alert alert-warning">
            <span>
              {alreadyRegistered}{" "}
              <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="link link-primary">
                Go to log in
              </Link>
            </span>
          </div>
        )}
        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {field("fullName", "Full name", "text", "name")}
        {field("email", "Email", "email", "email")}
        {field("password", "Password", "password", "new-password", "At least 10 characters, including a letter and a number.")}

        <div className="flex flex-col-reverse gap-3 border-t border-base-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/recruiter/register" className="link link-primary">
            Recruiting for an organization?
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Create account
          </button>
        </div>
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="link link-primary">
            Log in
          </Link>
        </p>
      </form>
    </section>
  );
}
