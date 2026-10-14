
"use client";

import Link from "next/link";
import { useState, type FormEvent, type ChangeEvent } from "react";

const MAX_LOGO_SIZE = 1 * 1024 * 1024;

type OrganizationMode = "new" | "existing";

type RegistrationForm = {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  password: string;
  legalName: string;
  website: string;
  industry: string;
  headquarters: string;
  size: string;
  description: string;
};

const initialForm: RegistrationForm = {
  fullName: "",
  email: "",
  phone: "",
  jobTitle: "",
  password: "",
  legalName: "",
  website: "",
  industry: "",
  headquarters: "",
  size: "",
  description: "",
};

const inputClass =
    "input w-full border-base-300 bg-base-100";

const labelClass = "mb-2 block text-sm font-semibold";

function FormField({
                     id,
                     label,
                     children,
                   }: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
      <div>
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {children}
      </div>
  );
}

function getDomain(value: string): string {
  try {
    const url = new URL(
        value.includes("://") ? value : `https://${value}`
    );

    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function RecruiterRegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [organizationMode, setOrganizationMode] =
      useState<OrganizationMode>("new");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoError, setLogoError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailDomain = form.email.trim().toLowerCase().split("@")[1] ?? "";
  const websiteDomain = getDomain(form.website);
  const domainMismatch =
      Boolean(emailDomain && websiteDomain) &&
      emailDomain.replace(/^www\./, "") !== websiteDomain;

  function updateField(
      field: keyof RegistrationForm,
      value: string
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setMessage("");
    setSubmitted(false);
  }

  function handleLogoChange(
      event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    setLogo(null);
    setLogoError("");

    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setLogoError("Choose a PNG or JPG image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLogoError("The organization logo must be 1 MB or smaller.");
      event.target.value = "";
      return;
    }

    setLogo(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitted(false);

    // This page is a frontend preview. Server-side checks for duplicate
    // accounts, organizations, and password policy are not connected.
    setSubmitted(true);
  }

  if (submitted) {
    return (
        <main className="mx-auto w-full max-w-2xl space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-secondary text-3xl">
              ✉
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted">
              Recruiter registration
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold">
              Verify your work email
            </h1>
            <p className="mt-3 text-muted">
              Your next step is to verify your email address before your
              registration can be reviewed.
            </p>
          </div>

          <section className="rounded-2xl border border-base-300 bg-base-100 p-6">
            <div role="status" className="alert alert-info">
            <span>
              Frontend preview only. No account or organization has
              been created, and no email has been sent.
            </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm text-muted">Work email</p>
                <p className="font-semibold">{form.email}</p>
              </div>

              <div>
                <p className="text-sm text-muted">Organization</p>
                <p className="font-semibold">{form.legalName}</p>
              </div>

              <div>
                <p className="text-sm text-muted">Registration type</p>
                <p className="font-semibold">
                  {organizationMode === "new"
                      ? "Register a new organization"
                      : "Request membership in an existing organization"}
                </p>
              </div>

              {domainMismatch && (
                  <div role="status" className="alert alert-warning">
                <span>
                  Your email domain differs from your organization&apos;s
                  website domain. The request should be flagged for
                  closer administrator review.
                </span>
                  </div>
              )}

              <div className="rounded-xl bg-base-200 p-4">
                <p className="font-semibold">What happens next?</p>
                <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-muted">
                  <li>Verify your work email using the emailed link.</li>
                  <li>Your request enters the administrator&apos;s approval queue.</li>
                  <li>You receive the decision by email.</li>
                </ol>
                <p className="mt-3 text-sm font-medium">
                  Recruiter features remain unavailable until approval.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                  type="button"
                  className="btn"
                  onClick={() => setSubmitted(false)}
              >
                Back to form
              </button>
            </div>
          </section>
        </main>
    );
  }

  return (
      <main className="mx-auto w-full max-w-4xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">
            CareerBridge · Employer portal
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            Recruiter Registration
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            Create your recruiter account and register your organization,
            or request to join an organization already on CareerBridge.
          </p>
        </header>

        <div role="status" className="alert alert-info">
        <span>
          Recruiter accounts require email verification and administrator
          approval before recruiter features become available.
        </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-base-300 bg-base-100 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">1. Personal information</h2>
              <p className="mt-1 text-sm text-muted">
                Enter your professional contact details.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField id="fullName" label="Full name">
                <input
                    id="fullName"
                    className={inputClass}
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Jane Smith"
                    required
                />
              </FormField>

              <FormField id="email" label="Work email">
                <input
                    id="email"
                    type="email"
                    className={inputClass}
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="jane@company.com"
                    required
                />
                <p className="mt-1 text-xs text-muted">
                  A verification link will be sent to this address when
                  registration is connected to the backend.
                </p>
              </FormField>

              <FormField id="phone" label="Phone number">
                <input
                    id="phone"
                    type="tel"
                    className={inputClass}
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                />
              </FormField>

              <FormField id="jobTitle" label="Job title">
                <input
                    id="jobTitle"
                    className={inputClass}
                    autoComplete="organization-title"
                    value={form.jobTitle}
                    onChange={(e) => updateField("jobTitle", e.target.value)}
                    placeholder="Talent Acquisition Manager"
                    required
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField id="password" label="Password">
                  <div className="flex gap-2">
                    <input
                        id="password"
                        type={passwordVisible ? "text" : "password"}
                        className={inputClass}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        placeholder="Create a secure password"
                        required
                    />
                    <button
                        type="button"
                        className="btn"
                        onClick={() => setPasswordVisible((value) => !value)}
                        aria-label={passwordVisible ? "Hide password" : "Show password"}
                    >
                      {passwordVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Your password must satisfy CareerBridge&apos;s password
                    policy. The authoritative policy check must be enforced
                    by the backend.
                  </p>
                </FormField>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-base-300 bg-base-100 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">2. Organization information</h2>
              <p className="mt-1 text-sm text-muted">
                Provide details administrators can use to verify your employer.
              </p>
            </div>

            <fieldset className="mb-6">
              <legend className={labelClass}>Organization registration</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 p-4">
                  <input
                      type="radio"
                      name="organizationMode"
                      value="new"
                      className="radio radio-primary mt-1"
                      checked={organizationMode === "new"}
                      onChange={() => setOrganizationMode("new")}
                  />
                  <span>
                  <span className="block font-semibold">New organization</span>
                  <span className="mt-1 block text-sm text-muted">
                    Register an organization that is not yet listed.
                  </span>
                </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 p-4">
                  <input
                      type="radio"
                      name="organizationMode"
                      value="existing"
                      className="radio radio-primary mt-1"
                      checked={organizationMode === "existing"}
                      onChange={() => setOrganizationMode("existing")}
                  />
                  <span>
                  <span className="block font-semibold">Existing organization</span>
                  <span className="mt-1 block text-sm text-muted">
                    Request membership instead of creating a duplicate.
                  </span>
                </span>
                </label>
              </div>
              {organizationMode === "existing" && (
                  <p className="mt-3 text-sm text-muted">
                    The organization must be matched against registered
                    organizations by normalized legal name and website domain.
                    Membership is not granted automatically.
                  </p>
              )}
            </fieldset>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField id="legalName" label="Organization legal name">
                <input
                    id="legalName"
                    className={inputClass}
                    autoComplete="organization"
                    value={form.legalName}
                    onChange={(e) => updateField("legalName", e.target.value)}
                    placeholder="Acme Corporation"
                    required
                />
              </FormField>

              <FormField id="website" label="Organization website">
                <input
                    id="website"
                    type="url"
                    className={inputClass}
                    value={form.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://www.company.com"
                    required
                />
              </FormField>

              <FormField id="industry" label="Industry">
                <select
                    id="industry"
                    className={inputClass}
                    value={form.industry}
                    onChange={(e) => updateField("industry", e.target.value)}
                    required
                >
                  <option value="">Select an industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Finance">Finance</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Government">Government</option>
                  <option value="Nonprofit">Nonprofit</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>

              <FormField id="headquarters" label="Headquarters location">
                <input
                    id="headquarters"
                    className={inputClass}
                    autoComplete="street-address"
                    value={form.headquarters}
                    onChange={(e) => updateField("headquarters", e.target.value)}
                    placeholder="City, State or Country"
                    required
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField id="size" label="Organization size">
                  <select
                      id="size"
                      className={inputClass}
                      value={form.size}
                      onChange={(e) => updateField("size", e.target.value)}
                      required
                  >
                    <option value="">Select employee count</option>
                    <option value="1-10">1–10 employees</option>
                    <option value="11-50">11–50 employees</option>
                    <option value="51-200">51–200 employees</option>
                    <option value="201-500">201–500 employees</option>
                    <option value="501-1000">501–1,000 employees</option>
                    <option value="1001+">1,001+ employees</option>
                  </select>
                </FormField>
              </div>

              <div className="md:col-span-2">
                <FormField id="description" label="Organization description">
                <textarea
                    id="description"
                    className="textarea min-h-28 w-full border-base-300 bg-base-100"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Briefly describe your organization and its work."
                    maxLength={1000}
                    required
                />
                  <p className="mt-1 text-right text-xs text-muted">
                    {form.description.length}/1000 characters
                  </p>
                </FormField>
              </div>

              <div className="md:col-span-2">
                <FormField id="logo" label="Organization logo (optional)">
                  <input
                      id="logo"
                      type="file"
                      accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                      className="file-input w-full max-w-md"
                      onChange={handleLogoChange}
                  />
                  <p className="mt-1 text-xs text-muted">
                    PNG or JPG, maximum 1 MB.
                  </p>
                  {logo && (
                      <p role="status" className="mt-2 text-sm">
                        Selected: {logo.name} (
                        {(logo.size / 1024).toFixed(1)} KB)
                      </p>
                  )}
                  {logoError && (
                      <p role="alert" className="mt-2 text-sm text-error">
                        {logoError}
                      </p>
                  )}
                </FormField>
              </div>
            </div>
          </section>

          {domainMismatch && (
              <div role="status" className="alert alert-warning">
            <span>
              Your work email domain does not match your organization&apos;s
              website domain. Your request can still be submitted, but it
              should be flagged for closer administrator review.
            </span>
              </div>
          )}

          {message && (
              <div role="alert" className="alert alert-error">
                <span>{message}</span>
              </div>
          )}

          <section className="rounded-2xl border border-base-300 bg-base-100 p-6">
            <h2 className="font-semibold">Before you submit</h2>
            <p className="mt-2 text-sm text-muted">
              Your work email must be verified, and an administrator must
              approve your recruiter account and organization or membership
              request. Recruiter actions will remain unavailable until approval.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-base-300 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                Already registered?{" "}
                <Link href="/login" className="link link-primary font-semibold"> \\TODO: Pretty sure this isnt the login route
                  Log in
                </Link>
              </p>
              <button type="submit" className="btn btn-primary">
                Submit registration
              </button>
            </div>
          </section>
        </form>
      </main>
  );
}
