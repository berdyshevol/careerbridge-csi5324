// The backend decides on submit (CO-04.1); these checks only let the screen say
// up front why a posting cannot be applied to. The no-resume and limit refusals
// come from startApplication; the closed and already-applied ones are worked out
// here because it does not flag them.

import { isOpen, type JobPosting, type Resume, type StartRefusalReason } from "./api";
import { type DeskApplication } from "./sampleDesk";

export type Desk = {
  applications: DeskApplication[]; // the active applications
  appliedPostingIds: number[]; // every posting applied to, ended applications too
  resume: Resume | null; // the resume on file, from startApplication
  refusal: StartRefusalReason | null; // from startApplication
};

export type ApplicationCheck =
  | { kind: "ok" }
  | { kind: "closed" }
  | { kind: "no-resume" }
  | { kind: "limit"; active: DeskApplication[] }
  | { kind: "already-applied"; application?: DeskApplication }; // none when it has ended

export function checkApplication(posting: JobPosting, desk: Desk): ApplicationCheck {
  if (!isOpen(posting)) {
    return { kind: "closed" };
  }
  if (desk.refusal === "NO_RESUME") {
    return { kind: "no-resume" };
  }
  const existing = desk.applications.find((a) => a.postingId === posting.jobPostId);
  if (existing || desk.appliedPostingIds.includes(posting.jobPostId)) {
    return { kind: "already-applied", application: existing };
  }
  if (desk.refusal === "LIMIT_REACHED") {
    return { kind: "limit", active: desk.applications };
  }
  return { kind: "ok" };
}
