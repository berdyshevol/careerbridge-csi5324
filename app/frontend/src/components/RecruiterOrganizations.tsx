"use client";

import { useState } from "react";
import {
  cancelMembershipRequest,
  MembershipConflict,
  MembershipRequestRefused,
  OrganizationRegistered,
  searchOrganizations,
  SessionEnded,
  submitMembershipRequest,
  type Membership,
  type OrganizationDetails,
  type OrganizationSummary,
} from "@/lib/api";
import { useEndSession } from "@/lib/useEndSession";
import FormField, { TextAreaField } from "./FormField";
import MembershipBadge from "./MembershipBadge";
import OrganizationFields, { EMPTY_ORGANIZATION, organizationErrors } from "./OrganizationFields";

const SESSION_ENDED = "Your session has ended. Log in again as a recruiter.";

// UC-09 Join Additional Organization, for the logged-in Recruiter
export default function RecruiterOrganizations({ token, initial }: { token: string; initial: Membership[] }) {
  const endSession = useEndSession();
  const [memberships, setMemberships] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrganizationSummary[] | null>(null);
  const [selected, setSelected] = useState<OrganizationSummary | null>(null);
  const [registering, setRegistering] = useState(false);
  const [organization, setOrganization] = useState<OrganizationDetails>(EMPTY_ORGANIZATION);
  const [role, setRole] = useState("");
  const [justification, setJustification] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  function failed(err: unknown, fallback: string) {
    if (err instanceof SessionEnded) {
      endSession();
      setError(SESSION_ENDED);
    } else if (err instanceof MembershipConflict) {
      setNotice(err.message); // 6a and 6b: what the membership already is
    } else if (err instanceof OrganizationRegistered) {
      setNotice(`${err.organization.name} is already registered. Search for it and ask to join it instead.`);
    } else if (err instanceof MembershipRequestRefused) {
      setFieldErrors(err.fieldErrors);
    } else {
      setError(err instanceof Error && err.message && !err.message.startsWith("Backend") ? err.message : fallback);
    }
  }

  function clearMessages() {
    setFieldErrors({});
    setNotice("");
    setError("");
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    clearMessages();
    try {
      setResults(await searchOrganizations(query));
      setSelected(null);
    } catch (err) {
      failed(err, "Unable to search the organizations. Please try again.");
    }
  }

  async function send() {
    clearMessages();
    setWorking(true);
    try {
      const request = registering
        ? await submitMembershipRequest(token, { organization, role, justification })
        : await submitMembershipRequest(token, { organizationId: selected?.organizationId, role, justification });
      // Step 8: the organization is listed as Pending
      setMemberships((current) => [...current, request]);
      setNotice(`Your request to join ${request.organization.name} is waiting for the administrator.`);
      setSelected(null);
      setRegistering(false);
      setOrganization(EMPTY_ORGANIZATION);
      setRole("");
      setJustification("");
    } catch (err) {
      failed(err, "Unable to send the request. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  async function cancel(membership: Membership) {
    clearMessages();
    setWorking(true);
    try {
      await cancelMembershipRequest(token, membership.membershipId);
      setMemberships((current) => current.filter((m) => m.membershipId !== membership.membershipId));
    } catch (err) {
      failed(err, "Unable to cancel the request. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  const requestFields = (
    <>
      <FormField
        id="membership-role"
        label={`Your role at ${registering ? organization.name || "the organization" : selected?.name}`}
        value={role}
        onChange={(event) => setRole(event.target.value)}
        error={fieldErrors.role}
        maxLength={255}
        required
      />
      <TextAreaField
        id="membership-justification"
        label="Why you recruit for them"
        value={justification}
        onChange={(event) => setJustification(event.target.value)}
        error={fieldErrors.justification}
        maxLength={2000}
        required
      />
    </>
  );

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div role="status" className="alert alert-info">
            <span>{notice}</span>
          </div>
        )}

        <section className="card border border-base-300 bg-base-100">
          <div className="card-body gap-3">
            <h2 className="font-display text-xl font-semibold">Your memberships</h2>
            <ul aria-label="Your memberships" className="flex flex-col gap-2">
              {memberships.map((membership) => (
                <li
                  key={membership.membershipId}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-base-300 px-4 py-3"
                >
                  <p className="grow font-semibold">{membership.organization.name}</p>
                  <MembershipBadge status={membership.status} label={membership.statusLabel} />
                  {(membership.status === "PENDING" || membership.status === "INFORMATION_REQUESTED") && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={working}
                      onClick={() => void cancel(membership)}
                      aria-label={`Cancel request for ${membership.organization.name}`}
                    >
                      Cancel request
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {registering && (
          <section aria-label="Register a new organization" className="card border border-base-300 bg-base-100">
            <div className="card-body gap-4">
              <h2 className="font-display text-xl font-semibold">Register a new organization</h2>
              <OrganizationFields
                idPrefix="new-organization"
                values={organization}
                onChange={setOrganization}
                errors={organizationErrors(fieldErrors)}
              />
              {requestFields}
              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn" onClick={() => setRegistering(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" disabled={working} onClick={() => void send()}>
                  Send request
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <section aria-label="Join an organization" className="card border border-base-300 bg-base-100 lg:w-96">
        <div className="card-body gap-4">
          <h2 className="font-display text-xl font-semibold">Join another organization</h2>
          <form role="search" onSubmit={search} className="flex gap-2">
            <label htmlFor="organization-search" className="sr-only">
              Search organizations by name or website
            </label>
            <input
              id="organization-search"
              type="search"
              className="input w-full"
              placeholder="Name or website"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" className="btn">
              Search
            </button>
          </form>

          {results && results.length === 0 && <p className="text-muted">No registered organization matches.</p>}
          {results && results.length > 0 && (
            <ul aria-label="Organizations found" className="flex flex-col gap-1">
              {results.map((found) => (
                <li key={found.organizationId}>
                  <button
                    type="button"
                    aria-pressed={selected?.organizationId === found.organizationId}
                    className={`w-full rounded-lg px-3 py-2 text-left font-semibold ${
                      selected?.organizationId === found.organizationId ? "bg-secondary" : "hover:bg-base-200"
                    }`}
                    onClick={() => {
                      clearMessages();
                      setSelected(found);
                      setRegistering(false);
                    }}
                  >
                    {found.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selected && (
            <>
              <hr className="border-base-300" />
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted">Name</dt>
                <dd>{selected.name}</dd>
                <dt className="text-muted">Website</dt>
                <dd>{selected.website ?? "Not given"}</dd>
                <dt className="text-muted">Description</dt>
                <dd>{selected.description ?? "Not given"}</dd>
              </dl>
              {requestFields}
              <button type="button" className="btn btn-primary" disabled={working} onClick={() => void send()}>
                Send request
              </button>
            </>
          )}

          <p className="text-sm text-muted">
            Not listed?{" "}
            <button
              type="button"
              className="link link-primary"
              onClick={() => {
                clearMessages();
                setSelected(null);
                setRegistering(true);
              }}
            >
              Register a new organization
            </button>
            . The administrator approves it first.
          </p>
        </div>
      </section>
    </div>
  );
}
