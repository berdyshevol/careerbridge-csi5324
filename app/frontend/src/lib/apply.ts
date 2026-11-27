// The backend decides, both when the form opens (startApplication) and on submit (CO-04.1); this
// only turns its refusal into what the screen shows.

import { type DeskApplication, type JobPosting, type Resume, type StartRefusalReason } from "./api";

export type Desk = {
  applications: DeskApplication[]; // the active applications
  resume: Resume | null; // the resume on file, from startApplication
  refusal: StartRefusalReason | null; // from startApplication
  applicationLimit: number; // from startApplication
};

export type ApplicationCheck =
  | { kind: "ok" }
  | { kind: "closed" }
  | { kind: "no-resume" }
  | { kind: "limit"; active: DeskApplication[]; limit: number }
  | { kind: "already-applied"; application?: DeskApplication }; // none when it has ended

export function checkApplication(posting: JobPosting, desk: Desk): ApplicationCheck {
  switch (desk.refusal) {
    case "POSTING_CLOSED":
      return { kind: "closed" };
    case "NO_RESUME":
      return { kind: "no-resume" };
    case "ALREADY_APPLIED":
      return { kind: "already-applied", application: desk.applications.find((a) => a.postingId === posting.jobPostId) };
    case "LIMIT_REACHED":
      return { kind: "limit", active: desk.applications, limit: desk.applicationLimit };
    default:
      return { kind: "ok" };
  }
}
