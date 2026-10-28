import { STAGES, type DeskApplication } from "./sampleDesk";
import type { Session } from "./session";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// Render's free plan takes minutes to wake a sleeping backend. Without a limit
// the page would hang that long; with one it can say so and try again.
export const BACKEND_TIMEOUT_MS = 8000;

export type Organization = {
  organizationId: number;
  name: string;
};

export type JobPosting = {
  jobPostId: number;
  title: string;
  description: string;
  jobRequirements: string;
  location: string;
  employmentType: string;
  salaryRange: string | null;
  numberOfOpenings: number;
  datePosted: string;
  applicationDeadline: string;
  // The public board sends the moment applications stop: 23:59 on the deadline in the organization's zone
  closesAt?: string | null;
  postStatus: string;
  organization: Organization;
  reviewComment?: string | null;
};

export type NewPosting = {
  organizationId: number;
  title: string;
  description: string;
  jobRequirements: string;
  location: string;
  employmentType: string;
  salaryRange: string | null;
  numberOfOpenings: number;
  applicationDeadline: string;
};

export type SubmittedApplication = {
  applicationId: number;
  applicationStatus: string;
  activeApplicationCount: number;
};

// Its message is the backend's reason, written for the recruiter
export class PostingRejected extends Error {}

// Its message is the backend's reason, written for the applicant
export class ApplicationRefused extends Error {}

// Its message is the backend's reason, written for the person logging in
export class LogInRefused extends Error {}

// The token expired, or the account lacks the role the call needs: the user logs in again
export class SessionEnded extends Error {}

// UC-12, extension 6c: another administrator decided the posting first; the message says how
export class PostingDecided extends Error {}

function bearer(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export type StartRefusalReason = "NO_RESUME" | "LIMIT_REACHED";

// GET /application: the summary the screen opens with. Closed and already-applied
// postings are not flagged here; the backend decides those on submit (UC-04 4a, 4c).
export type ApplicationStart = {
  posting: { postingId: number; title: string; organizationName: string };
  resume: Resume | null; // the resume on file, a copy of which goes with the application
  activeApplicationCount: number;
  applicationLimit: number;
  refusal: { reason: StartRefusalReason; message: string } | null;
};

function backendFetch(
  path: string,
  init?: Omit<RequestInit, "signal">,
  timeoutMs = BACKEND_TIMEOUT_MS,
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

// In the order the form shows them, which is also the order of the clean address
const SEARCH_CRITERIA = ["keyword", "location", "organization", "employmentType"] as const;

export type PostingSearchCriteria = Partial<Record<(typeof SEARCH_CRITERIA)[number], string>>;

export type PageQuery = Record<string, string | string[] | undefined>;

// A hand-edited link can repeat a key, and Next.js then hands over an array;
// the search knows one value per criterion, so it takes the first.
export function queryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function searchCriteria(query: PageQuery): PostingSearchCriteria {
  return Object.fromEntries(SEARCH_CRITERIA.map((name) => [name, queryValue(query[name])]));
}

// The same query string serves the backend call and the job board's own links,
// so a visitor who opens a posting comes back to the list they searched.
export function searchQuery(criteria: PostingSearchCriteria): string {
  const query = new URLSearchParams();
  for (const name of SEARCH_CRITERIA) {
    const value = criteria[name]?.trim();
    if (value) {
      query.set(name, value);
    }
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

// Log In (ADR-0010): the backend answers with the token and who it belongs to
export async function logIn(email: string, password: string): Promise<Session> {
  const response = await backendFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const reason = await refusal(response, [401]);
  if (reason !== null) {
    throw new LogInRefused(reason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

// A 400 that names the form's fields: the backend's reason for each one it refused. Spring's own 400
// is JSON too, so only the form's fields are reasons for the user; any other 400 is an error.
async function fieldRefusal<Field extends string>(
  response: Response,
  fields: readonly Field[],
): Promise<Partial<Record<Field, string>> | null> {
  if (response.status !== 400 || !response.headers.get("Content-Type")?.startsWith("application/json")) {
    return null;
  }
  const body: Record<string, unknown> = await response.json();
  const fieldErrors = Object.fromEntries(
    fields.flatMap((name) => (typeof body[name] === "string" ? [[name, body[name] as string]] : [])),
  ) as Partial<Record<Field, string>>;
  if (Object.keys(fieldErrors).length === 0) {
    throw new Error("Backend answered 400");
  }
  return fieldErrors;
}

// UC-02 extension 2a: the backend's reason for each field it refused, keyed by field
export class RegistrationRefused extends Error {
  constructor(readonly fieldErrors: Partial<Record<"fullName" | "email" | "password", string>>) {
    super("The registration was refused");
  }
}

// UC-02 extension 2b; its message suggests logging in instead
export class AlreadyRegistered extends Error {}

// UC-02, CO-02.1: the new Applicant is logged in at once, so the answer is a session
export async function register(fullName: string, email: string, password: string): Promise<Session> {
  const response = await backendFetch("/api/applicants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password }),
  });
  const fieldErrors = await fieldRefusal(response, ["fullName", "email", "password"]);
  if (fieldErrors) {
    throw new RegistrationRefused(fieldErrors);
  }
  const reason = await refusal(response, [409]);
  if (reason !== null) {
    throw new AlreadyRegistered(reason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function searchPostings(criteria: PostingSearchCriteria = {}): Promise<JobPosting[]> {
  const response = await backendFetch(`/api/postings${searchQuery(criteria)}`);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function viewPosting(postingId: string): Promise<JobPosting | null> {
  const response = await backendFetch(`/api/postings/${encodeURIComponent(postingId)}`);
  if (response.status === 404 || response.status === 400) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

// The calls below need a logged-in user in the right role (ADR-0010)
function endedSession(response: Response) {
  if (response.status === 401 || response.status === 403) {
    throw new SessionEnded();
  }
}

export async function createPosting(token: string, posting: NewPosting): Promise<JobPosting> {
  const response = await backendFetch("/api/postings", {
    method: "POST",
    headers: { ...bearer(token), "Content-Type": "application/json" },
    body: JSON.stringify(posting),
  });
  endedSession(response);
  const reason = await refusal(response);
  if (reason !== null) {
    throw new PostingRejected(reason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

// UC-11: a saved draft goes to the administrators' queue
export async function submitJobPosting(token: string, postingId: number): Promise<JobPosting> {
  const response = await backendFetch(`/api/postings/${postingId}/submit`, {
    method: "POST",
    headers: bearer(token),
  });
  endedSession(response);
  const reason = await refusal(response, [400, 409]);
  if (reason !== null) {
    throw new PostingRejected(reason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function startApplication(token: string, postingId: number): Promise<ApplicationStart> {
  const response = await backendFetch(`/api/postings/${postingId}/application`, { headers: bearer(token) });
  endedSession(response);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function submitApplication(token: string, postingId: number): Promise<SubmittedApplication> {
  const response = await backendFetch(`/api/postings/${postingId}/application`, {
    method: "POST",
    headers: bearer(token),
  });
  endedSession(response);
  if (response.status === 409) {
    throw new ApplicationRefused((await response.json()).message);
  }
  const text = await refusal(response);
  if (text !== null) {
    throw new ApplicationRefused(text);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

// CO-05.1. An ended application still blocks its posting (A5), so the ids of
// every posting applied to come back next to the active applications.
export type Applications = { active: DeskApplication[]; appliedPostingIds: number[] };

export async function viewApplications(token: string): Promise<Applications> {
  const response = await backendFetch("/api/applicant/applications", { headers: bearer(token) });
  endedSession(response);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  const applications: (Omit<DeskApplication, "applicationStatus"> & { applicationStatus: string })[] =
    await response.json();
  const active: DeskApplication[] = [];
  for (const application of applications) {
    const stage = STAGES.find((name) => name.toUpperCase() === application.applicationStatus);
    if (stage) {
      active.push({ ...application, applicationStatus: stage });
    }
  }
  return { active, appliedPostingIds: applications.map((application) => application.postingId) };
}

// CO-03.2 details, in the order the form shows them; all but the names may be left empty
export const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "location",
  "headline",
  "skills",
  "education",
  "workExperience",
] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number];

// The backend's limits: its column lengths, and the longest phone number its pattern accepts
export const PROFILE_MAX_LENGTH: Record<ProfileField, number> = {
  firstName: 255,
  lastName: 255,
  phone: 31,
  location: 255,
  headline: 255,
  skills: 2000,
  education: 4000,
  workExperience: 10000,
};

export type ProfileDetails = Record<ProfileField, string>;

// CO-03.1 and CO-03.3; uploadDate is a date-time in UTC, without the zone
export type Resume = { fileName: string; uploadDate: string };

// CO-03.1: an empty detail is null; resume is null until the applicant uploads one
export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  location: string | null;
  headline: string | null;
  skills: string | null;
  education: string | null;
  workExperience: string | null;
  resume: Resume | null;
};

export async function viewProfile(token: string): Promise<Profile> {
  const response = await backendFetch("/api/applicant/profile", { headers: bearer(token) });
  endedSession(response);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

// UC-03 extension 4a: the backend's reason for each field it refused, keyed by field
export class ProfileRefused extends Error {
  constructor(readonly fieldErrors: Partial<Record<ProfileField, string>>) {
    super("The profile was refused");
  }
}

// CO-03.2: the answer is the profile as saved
export async function updateProfile(token: string, details: ProfileDetails): Promise<Profile> {
  const response = await backendFetch("/api/applicant/profile", {
    method: "PUT",
    headers: { ...bearer(token), "Content-Type": "application/json" },
    body: JSON.stringify(details),
  });
  endedSession(response);
  const fieldErrors = await fieldRefusal(response, PROFILE_FIELDS);
  if (fieldErrors) {
    throw new ProfileRefused(fieldErrors);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

// UC-03 extension 6a; its message is the backend's reason, which states the accepted types and size
export class ResumeRefused extends Error {}

// A 5 MB file on a slow connection takes longer than a call without one
const UPLOAD_TIMEOUT_MS = 60000;

// CO-03.3: the answer is the resume now on file, which replaced any previous one (BR-6)
export async function uploadResume(token: string, file: File): Promise<Resume> {
  const body = new FormData();
  body.append("file", file);
  const response = await backendFetch("/api/applicant/resume", { method: "POST", headers: bearer(token), body }, UPLOAD_TIMEOUT_MS);
  endedSession(response);
  const reason = await refusal(response);
  if (reason !== null) {
    throw new ResumeRefused(reason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

// UC-12: the queue of postings waiting for an administrator
export async function openPostingApprovalQueue(token: string): Promise<JobPosting[]> {
  const response = await backendFetch("/api/admin/postings/pending", { headers: bearer(token) });
  endedSession(response);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export type ReviewAction = "approve" | "return" | "reject";

export async function reviewPosting(
  token: string,
  postingId: number,
  action: ReviewAction,
  comment: string,
): Promise<JobPosting> {
  const response = await backendFetch(`/api/admin/postings/${postingId}/${action}`, {
    method: "POST",
    headers: { ...bearer(token), "Content-Type": "application/json" },
    body: JSON.stringify({ comment: comment || null }),
  });
  endedSession(response);
  if (response.status === 409) {
    throw new PostingDecided(await response.text());
  }
  const reason = await refusal(response);
  if (reason !== null) {
    throw new Error(reason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

// Only a refusal in plain text is a reason for the user; any other body is the
// server's own error report and must not reach the screen.
async function refusal(response: Response, statuses = [400]): Promise<string | null> {
  const refused = statuses.includes(response.status);
  if (refused && response.headers.get("Content-Type")?.startsWith("text/plain")) {
    return response.text();
  }
  return null;
}

export function isOpen(posting: JobPosting): boolean {
  return posting.postStatus === "PUBLISHED" && posting.closesAt != null && Date.now() < Date.parse(posting.closesAt);
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", DATE_FORMAT);
}

// A moment the backend recorded by its UTC clock, shown as the day it was where the user is
export function formatUtcDay(utcDateTime: string): string {
  return new Date(`${utcDateTime}Z`).toLocaleDateString("en-US", DATE_FORMAT);
}
