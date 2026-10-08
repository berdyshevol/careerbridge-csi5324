// UC-04 Apply for Job on the frontend: the checks of CO-04.1 submitApplication
// and the result of a submission.
//
// STAND-IN: the backend has no submitApplication yet, so these rules run in
// the browser against the applicant's desk (sample data today). When the
// backend implements CO-04.1, add the call to src/lib/api.ts and let
// submitApplication below delegate to it; the screen does not change.

import { isOpen, type JobPosting } from "./api";
import { APPLICATION_LIMIT, type DeskApplication, type DeskResume } from "./sampleDesk";

export type Desk = {
  applications: DeskApplication[]; // the active applications
  resume: DeskResume | null;
};

// Why an application cannot be submitted (UC-04 extensions 2a, 2b/4b, 4a, 4c).
export type ApplicationCheck =
  | { kind: "ok" }
  | { kind: "closed" }
  | { kind: "no-resume" }
  | { kind: "limit"; active: DeskApplication[] }
  | { kind: "already-applied"; application: DeskApplication };

// FR-UC04.3, FR-UC04.6, FR-UC04.7: the posting is open, a resume is on file,
// fewer than 5 active applications, and no earlier application to this posting.
export function checkApplication(posting: JobPosting, desk: Desk): ApplicationCheck {
  if (!isOpen(posting)) {
    return { kind: "closed" };
  }
  if (!desk.resume) {
    return { kind: "no-resume" };
  }
  const existing = desk.applications.find((a) => a.postingId === posting.jobPostId);
  if (existing) {
    return { kind: "already-applied", application: existing };
  }
  if (desk.applications.length >= APPLICATION_LIMIT) {
    return { kind: "limit", active: desk.applications };
  }
  return { kind: "ok" };
}

export type SubmitResult =
  | { ok: true; application: DeskApplication; desk: Desk }
  | { ok: false; check: Exclude<ApplicationCheck, { kind: "ok" }> };

// FR-UC04.4: the application starts in the Applied stage with a copy of the
// resume as it is now (A6). Returns the desk as it is after the submission.
export function submitApplication(posting: JobPosting, desk: Desk): SubmitResult {
  const check = checkApplication(posting, desk);
  if (check.kind !== "ok") {
    return { ok: false, check };
  }
  const application: DeskApplication = {
    applicationId: Math.max(0, ...desk.applications.map((a) => a.applicationId)) + 1,
    postingId: posting.jobPostId,
    title: posting.title,
    organizationName: posting.organization.name,
    location: posting.location,
    employmentType: posting.employmentType,
    applicationStatus: "Applied",
  };
  return {
    ok: true,
    application,
    desk: { ...desk, applications: [...desk.applications, application] },
  };
}
