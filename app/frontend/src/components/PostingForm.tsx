"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  createPosting,
  PostingRejected,
  SessionEnded,
  submitJobPosting as sendForApproval,
  type JobPosting,
} from "@/lib/api";
import { EMPLOYMENT_TYPES, LOCATIONS } from "@/lib/postingOptions";
import { useEndSession } from "@/lib/useEndSession";

const SESSION_ENDED = "Your session has ended. Log in again as a recruiter.";

// UC-11, for the logged-in Recruiter
export default function PostingForm({ token }: { token: string }) {
  const endSession = useEndSession();
  const [organizationId, setOrganizationId] = useState("1");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [salaryRange, setSalaryRange] = useState("");
  const [numberOfOpenings, setNumberOfOpenings] = useState("1");
  const [applicationDeadline, setApplicationDeadline] = useState("");

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<JobPosting | null>(null);

  const today = new Date().toLocaleDateString("en-CA");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreated(null);
    setSaving(true);

    try {
      const posting = await createPosting(token, {
        organizationId: Number(organizationId),
        title: title.trim(),
        description: description.trim(),
        jobRequirements: jobRequirements.trim(),
        location,
        employmentType,
        salaryRange: salaryRange.trim() || null,
        numberOfOpenings: Number(numberOfOpenings),
        applicationDeadline,
      });

      setCreated(posting);
    } catch (err) {
      if (err instanceof SessionEnded) {
        endSession();
      }
      setError(
        err instanceof PostingRejected && err.message
          ? err.message
          : err instanceof SessionEnded
            ? SESSION_ENDED
            : "Unable to save the posting. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitJobPosting() {
    if (!created || created.postStatus !== "DRAFT") {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const updated = await sendForApproval(token, created.jobPostId);
      setCreated(updated);
    } catch (err) {
      if (err instanceof SessionEnded) {
        endSession();
      }
      setError(
        err instanceof SessionEnded
          ? SESSION_ENDED
          : err instanceof PostingRejected && err.message
            ? err.message
            : "Unable to submit the posting for approval.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-primary">
          RECRUITER WORKSPACE / UC-11 &amp; UC-12
        </p>

        <h1 className="font-display text-3xl font-semibold">
          Create job posting
        </h1>

        <p className="mt-2 text-muted">
          Create a job posting, save it as a draft, and submit it for
          administrator approval before publication.
        </p>
      </div>

      <div className="alert alert-info text-sm">
        <span>
          Select the organization by hand: memberships (UC-08, UC-09) are not built yet, so
          any recruiter can post for any organization.
        </span>
      </div>

      {created && (
        <div
          role="status"
          className="space-y-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-semibold">
              {created.postStatus === "PENDING_APPROVAL"
                ? "Submitted for administrator review!"
                : "Job posting saved successfully!"}
            </h2>

            <p className="mt-1">
              {created.title} — Posting #{created.jobPostId} ({created.postStatus})
            </p>

            <p className="mt-1 text-sm text-muted">
              Current status:{" "}
              <span className="font-semibold">
                {created.postStatus.replaceAll("_", " ")}
              </span>
            </p>
          </div>

          {created.postStatus === "DRAFT" && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={submitJobPosting}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit for approval"}
            </button>
          )}

          {created.postStatus === "PENDING_APPROVAL" && (
            <p className="text-sm text-success">
              The posting is now awaiting an administrator decision.
              It is not visible on the public job board yet.
            </p>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-8"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <fieldset className="fieldset md:col-span-2">
            <label htmlFor="organization" className="fieldset-legend">
              Organization *
            </label>
            <select
              id="organization"
              className="select w-full"
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value)}
              required
            >
              <option value="1">Brazos Analytics</option>
              <option value="2">Waco Health Partners</option>
            </select>
          </fieldset>

          <fieldset className="fieldset md:col-span-2">
            <label htmlFor="title" className="fieldset-legend">
              Job title *
            </label>
            <input
              id="title"
              className="input w-full"
              placeholder="e.g. Cybersecurity Analyst"
              maxLength={255}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </fieldset>

          <fieldset className="fieldset md:col-span-2">
            <label htmlFor="description" className="fieldset-legend">
              Job description
            </label>
            <textarea
              id="description"
              className="textarea min-h-32 w-full"
              placeholder="Describe the role and responsibilities"
              maxLength={10000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset md:col-span-2">
            <label htmlFor="requirements" className="fieldset-legend">
              Job requirements
            </label>
            <textarea
              id="requirements"
              className="textarea min-h-28 w-full"
              placeholder="List the skills, experience, or qualifications"
              maxLength={2000}
              value={jobRequirements}
              onChange={(event) => setJobRequirements(event.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <label htmlFor="location" className="fieldset-legend">
              Location
            </label>
            <select
              id="location"
              className="select w-full"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            >
              <option value="" disabled>
                Choose a location
              </option>
              {LOCATIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <label htmlFor="employmentType" className="fieldset-legend">
              Employment type
            </label>
            <select
              id="employmentType"
              className="select w-full"
              value={employmentType}
              onChange={(event) => setEmploymentType(event.target.value)}
            >
              {EMPLOYMENT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <label htmlFor="salary" className="fieldset-legend">
              Salary range
            </label>
            <input
              id="salary"
              className="input w-full"
              placeholder="e.g. $70,000 - $90,000"
              maxLength={255}
              value={salaryRange}
              onChange={(event) => setSalaryRange(event.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <label htmlFor="openings" className="fieldset-legend">
              Number of openings *
            </label>
            <input
              id="openings"
              type="number"
              className="input w-full"
              min={1}
              step={1}
              value={numberOfOpenings}
              onChange={(event) => setNumberOfOpenings(event.target.value)}
              required
            />
          </fieldset>

          <fieldset className="fieldset md:col-span-2">
            <label htmlFor="deadline" className="fieldset-legend">
              Application deadline *
            </label>
            <input
              id="deadline"
              type="date"
              className="input w-full"
              min={today}
              value={applicationDeadline}
              onChange={(event) => setApplicationDeadline(event.target.value)}
              required
            />
          </fieldset>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-base-300 pt-5">
          <Link href="/jobs" className="btn btn-ghost">
            Back to job board
          </Link>

          <button
            type="submit"
            disabled={saving || submitting}
            className="btn btn-primary"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
