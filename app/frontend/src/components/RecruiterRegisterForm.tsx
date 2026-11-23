"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlreadyRegistered,
  OrganizationRegistered,
  RecruiterRegistrationRefused,
  submitRecruiterRegistration,
  type OrganizationDetails,
  type OrganizationSummary,
  type RecruiterDetails,
  type RecruiterField,
  type RecruiterRegistration,
} from "@/lib/api";
import FormField from "./FormField";
import OrganizationFields, { EMPTY_ORGANIZATION, organizationErrors } from "./OrganizationFields";
import VerificationSent from "./VerificationSent";

const EMPTY_RECRUITER: RecruiterDetails = { fullName: "", jobTitle: "", email: "", phone: "", password: "" };

// UC-08 Register Recruiter and Organization, steps 2-5
export default function RecruiterRegisterForm() {
  const [recruiter, setRecruiter] = useState(EMPTY_RECRUITER);
  const [organization, setOrganization] = useState<OrganizationDetails>(EMPTY_ORGANIZATION);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [emailRegistered, setEmailRegistered] = useState(false);
  const [registered, setRegistered] = useState<OrganizationSummary | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<RecruiterRegistration | null>(null);

  async function send(joinOrganizationId?: number) {
    setFieldErrors({});
    setEmailRegistered(false);
    setError("");
    setSubmitting(true);
    try {
      setSent(await submitRecruiterRegistration(recruiter, joinOrganizationId ? null : organization, joinOrganizationId));
    } catch (err) {
      if (err instanceof RecruiterRegistrationRefused) {
        setFieldErrors(err.fieldErrors as Record<string, string>);
      } else if (err instanceof AlreadyRegistered) {
        setEmailRegistered(true); // 4b
      } else if (err instanceof OrganizationRegistered) {
        setRegistered(err.organization); // 4c
      } else {
        setError("Unable to send the registration. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return <VerificationSent email={sent.email} verificationLink={sent.verificationLink} />;
  }

  function field(name: RecruiterField, label: string, type: string, autoComplete: string, hint?: string) {
    return (
      <FormField
        id={`recruiter-${name}`}
        label={label}
        type={type}
        autoComplete={autoComplete}
        value={recruiter[name]}
        onChange={(event) => setRecruiter({ ...recruiter, [name]: event.target.value })}
        error={fieldErrors[name]}
        hint={hint}
        required={name !== "phone"}
      />
    );
  }

  return (
    <form
      aria-label="Recruiter registration"
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      <section aria-label="You" className="card border border-base-300 bg-base-100">
        <div className="card-body gap-4">
          <h2 className="font-display text-xl font-semibold">1 · You</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {field("fullName", "Full name", "text", "name")}
            {field("jobTitle", "Job title", "text", "organization-title")}
            {field("email", "Work email", "email", "email", "Use your company address. Others are checked more closely.")}
            {field("phone", "Phone", "tel", "tel")}
          </div>
          {field("password", "Password", "password", "new-password", "At least 10 characters, with a letter and a number.")}
        </div>
      </section>

      <section aria-label="Your organization" className="card border border-base-300 bg-base-100">
        <div className="card-body gap-4">
          <h2 className="font-display text-xl font-semibold">2 · Your organization</h2>
          <OrganizationFields
            idPrefix="organization"
            values={organization}
            onChange={(values) => {
              setOrganization(values);
              setRegistered(null);
            }}
            errors={organizationErrors(fieldErrors)}
          />
        </div>
      </section>

      {/* UC-08 *a of the system: nothing was saved */}
      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      )}
      {emailRegistered && (
        <div role="alert" className="alert alert-soft alert-error">
          <span>
            <b>An account already exists for this email.</b>{" "}
            <Link href="/login" className="link">
              Log in
            </Link>{" "}
            instead. Already an approved recruiter? Log in and{" "}
            <Link href="/login?next=/recruiter/organizations" className="link">
              join an additional organization
            </Link>
            .
          </span>
        </div>
      )}
      {registered && (
        <div role="status" className="alert alert-info">
          <span>
            <b>This organization is already registered.</b> Ask to join {registered.name} instead? An administrator
            approves your request.{" "}
            <button
              type="button"
              className="link font-semibold"
              disabled={submitting}
              onClick={() => void send(registered.organizationId)}
            >
              Request membership
            </button>
          </span>
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={submitting}>
          Send for review
        </button>
      </div>
    </form>
  );
}
