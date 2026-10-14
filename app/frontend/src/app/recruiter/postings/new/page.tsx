
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createPosting, PostingRejected, type JobPosting } from "@/lib/api";

export default function NewPostingPage() {
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
  const [error, setError] = useState("");
  const [created, setCreated] = useState<JobPosting | null>(null);

  const today = new Date().toLocaleDateString("en-CA");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreated(null);
    setSaving(true);

    try {
      setCreated(
        await createPosting({
          organizationId: Number(organizationId),
          title: title.trim(),
          description: description.trim(),
          jobRequirements: jobRequirements.trim(),
          location: location.trim(),
          employmentType,
          salaryRange: salaryRange.trim() || null,
          numberOfOpenings: Number(numberOfOpenings),
          applicationDeadline,
        }),
      );
    } catch (err) {
      setError(
        err instanceof PostingRejected && err.message
          ? err.message
          : "Unable to save the posting. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-primary">
          RECRUITER WORKSPACE / UC-11
        </p>
        <h1 className="font-display text-3xl font-semibold">
          Create job posting
        </h1>
        <p className="mt-2 text-muted">
          Complete the details below to save a new job posting as a draft.
          Draft postings are not visible to applicants.
        </p>
      </div>

      <div className="alert alert-info text-sm">
        <span>
          Development demo: choose one of the sample organizations below.
          Recruiter authentication and organization ownership verification
          have not been implemented yet.
        </span>
      </div>

      {created && (
        <div role="status" className="alert alert-success">
          <div>
            <p className="font-semibold">Job posting saved successfully!</p>
            <p>
              {created.title} — Posting #{created.jobPostId}
              {" "}({created.postStatus})
            </p>
            <p className="text-sm">
              Your draft has been saved to the backend database.
            </p>
          </div>
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
              onChange={(e) => setOrganizationId(e.target.value)}
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
              onChange={(e) => setTitle(e.target.value)}
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
              onChange={(e) => setDescription(e.target.value)}
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
              onChange={(e) => setJobRequirements(e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <label htmlFor="location" className="fieldset-legend">
              Location
            </label>
            <input
              id="location"
              className="input w-full"
              placeholder="e.g. Waco, TX or Remote"
              maxLength={255}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <label htmlFor="employmentType" className="fieldset-legend">
              Employment type
            </label>
            <select
              id="employmentType"
              className="select w-full"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
              <option value="Temporary">Temporary</option>
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
              onChange={(e) => setSalaryRange(e.target.value)}
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
              onChange={(e) => setNumberOfOpenings(e.target.value)}
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
              onChange={(e) => setApplicationDeadline(e.target.value)}
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
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
        </div>
      </form>
    </div>
  );
}

