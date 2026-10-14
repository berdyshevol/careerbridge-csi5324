// STAND-IN: the backend decides on submit (CO-04.1), but until UC-05 brings the
// applicant's desk from it, these checks run against the sample desk so the
// screen can say up front why a posting cannot be applied to.

import { isOpen, type JobPosting } from "./api";
import { APPLICATION_LIMIT, type DeskApplication, type DeskResume } from "./sampleDesk";

export type Desk = {
  applications: DeskApplication[]; // the active applications
  resume: DeskResume | null;
};

export type ApplicationCheck =
  | { kind: "ok" }
  | { kind: "closed" }
  | { kind: "no-resume" }
  | { kind: "limit"; active: DeskApplication[] }
  | { kind: "already-applied"; application: DeskApplication };

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
