import { STAGES, type ApplicationStage, type DeskApplication, type Stage } from "./sampleDesk";
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

// The details of a posting being changed: those of a new one but its organization, which stays
export type PostingChanges = Omit<NewPosting, "organizationId">;

// UC-11 extensions 3b and 6a: the recruiter's own Draft or Returned posting, with the Administrator's comment
export async function openPostingForEdit(token: string, postingId: number): Promise<JobPosting> {
  const response = await backendFetch(`/api/postings/${postingId}/edit`, { headers: bearer(token) });
  if (response.status === 404) {
    throw new PostingRejected("There is no posting at this address.");
  }
  return postingAnswer(response, [403, 409]);
}

// CO-11.2: saves the changes; the posting keeps its status until it is submitted
export async function updatePosting(token: string, postingId: number, changes: PostingChanges): Promise<JobPosting> {
  const response = await backendFetch(`/api/postings/${postingId}`, {
    method: "PUT",
    headers: { ...bearer(token), "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  return postingAnswer(response, [400, 403, 409]);
}

// UC-11: a saved draft goes to the administrators' queue
export async function submitJobPosting(token: string, postingId: number): Promise<JobPosting> {
  const response = await backendFetch(`/api/postings/${postingId}/submit`, {
    method: "POST",
    headers: bearer(token),
  });
  return postingAnswer(response, [400, 403, 409]);
}

// The reason is read first: a 403 that gives one is a posting refusing this recruiter (SCRUM-215),
// while a 403 without one is the token refused, so the session has ended
async function postingAnswer(response: Response, refusals: number[]): Promise<JobPosting> {
  const reason = await refusal(response, refusals);
  if (reason !== null) {
    throw new PostingRejected(reason);
  }
  endedSession(response);
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

const STAGE_LABELS: Record<string, ApplicationStage> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  OFFER_DECLINED: "Offer Declined",
};

const ACTIVE_STAGES: ReadonlySet<ApplicationStage> = new Set<ApplicationStage>(STAGES);

function stageLabel(status: string): ApplicationStage {
  return STAGE_LABELS[status] ?? "Applied";
}

export type ApplicationSummary = {
  applicationId: number;
  postingId: number;
  title: string;
  organizationName: string;
  location: string;
  employmentType: string;
  applicationStatus: ApplicationStage;
  active: boolean;
  dateApplied: string;
  lastStageChangeDate: string;
};

// CO-05.1. Active applications come first from the backend along with the active count;
// ended ones stay in `all` and `appliedPostingIds` because a posting can be applied to once (A5).
export type Applications = {
  all: ApplicationSummary[];
  active: DeskApplication[];
  appliedPostingIds: number[];
  activeApplicationCount: number;
  applicationLimit: number;
};

type RawApplicationSummary = Omit<ApplicationSummary, "applicationStatus" | "active"> & {
  applicationStatus: string;
};

type RawApplicationsResponse = {
  applications: RawApplicationSummary[];
  activeApplicationCount: number;
  applicationLimit: number;
};

export async function viewApplications(token: string): Promise<Applications> {
  const response = await backendFetch("/api/applicant/applications", { headers: bearer(token) });
  endedSession(response);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  const body: RawApplicationsResponse = await response.json();
  const all: ApplicationSummary[] = [];
  const active: DeskApplication[] = [];
  const appliedPostingIds: number[] = [];
  for (const item of body.applications) {
    const label = stageLabel(item.applicationStatus);
    const isActive = ACTIVE_STAGES.has(label);
    const base = {
      applicationId: item.applicationId,
      postingId: item.postingId,
      title: item.title,
      organizationName: item.organizationName,
      location: item.location,
      employmentType: item.employmentType,
      dateApplied: item.dateApplied,
      lastStageChangeDate: item.lastStageChangeDate,
    };
    all.push({ ...base, applicationStatus: label, active: isActive });
    if (isActive) {
      active.push({ ...base, applicationStatus: label as Stage });
    }
    appliedPostingIds.push(item.postingId);
  }
  return {
    all,
    active,
    appliedPostingIds,
    activeApplicationCount: body.activeApplicationCount,
    applicationLimit: body.applicationLimit,
  };
}

export type ApplicationAction = "WITHDRAW" | "ACCEPT_OFFER" | "DECLINE_OFFER";

export type StatusHistoryEntry = {
  status: ApplicationStage;
  date: string;
};

export type InterviewSummary = {
  interviewId: number;
  roundNumber: number;
  scheduledTime: string;
  format: string;
  location: string;
};

export type OfferStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "RESCINDED";

export type OfferSummary = {
  offerId: number;
  dateExtended: string;
  startDate: string;
  salary: string;
  terms: string | null;
  expirationDate: string;
  offerLetterFileName: string | null;
  status: OfferStatus;
  responseDate: string | null;
  revision: number;
  expired: boolean;
  canRespond: boolean;
};

export type OfferDetail = OfferSummary & {
  applicationId: number;
  postingId: number;
  title: string;
  organizationName: string;
};

export type ApplicationDetail = {
  applicationId: number;
  postingId: number;
  title: string;
  organizationName: string;
  location: string;
  employmentType: string;
  applicationStatus: ApplicationStage;
  dateApplied: string;
  statusHistory: StatusHistoryEntry[];
  interviews: InterviewSummary[];
  offer: OfferSummary | null;
  rejectionReason: string | null;
  rejectedAtStage: ApplicationStage | null;
  rejectionDate: string | null;
  withdrawnAt: string | null;
  availableActions: ApplicationAction[];
};

type RawApplicationDetail = Omit<
  ApplicationDetail,
  "applicationStatus" | "statusHistory" | "rejectedAtStage"
> & {
  applicationStatus: string;
  statusHistory: { status: string; date: string }[];
  rejectedAtStage: string | null;
};

// UC-06 / UC-07: an applicant action was refused because the application moved to another stage
export class ApplicationActionRefused extends Error {
  constructor(
    message: string,
    readonly currentStage: ApplicationStage,
  ) {
    super(message);
  }
}

// UC-07 ext 6b (FR-UC07.11): the recruiter revised the offer before the applicant confirmed
export class OfferRevised extends Error {
  constructor(
    message: string,
    readonly revisedOffer: OfferSummary,
  ) {
    super(message);
  }
}

export type WithdrawalPrompt = {
  applicationId: number;
  title: string;
  organizationName: string;
  applicationStatus: ApplicationStage;
  warning: string;
  reasons: string[];
};

export type WithdrawalResult = {
  application: ApplicationDetail;
  activeApplicationCount: number;
  applicationLimit: number;
};

export type OfferResponseResult = {
  application: ApplicationDetail;
  activeApplicationCount: number;
  applicationLimit: number;
};

function mapDetail(raw: RawApplicationDetail): ApplicationDetail {
  return {
    ...raw,
    applicationStatus: stageLabel(raw.applicationStatus),
    statusHistory: raw.statusHistory.map((entry) => ({
      status: stageLabel(entry.status),
      date: entry.date,
    })),
    rejectedAtStage: raw.rejectedAtStage ? stageLabel(raw.rejectedAtStage) : null,
  };
}

// CO-05.2: returns null when the application does not exist or belongs to another applicant (BR-15)
export async function viewApplication(
  token: string,
  applicationId: string,
): Promise<ApplicationDetail | null> {
  const response = await backendFetch(
    `/api/applicant/applications/${encodeURIComponent(applicationId)}`,
    { headers: bearer(token) },
  );
  endedSession(response);
  if (response.status === 404 || response.status === 400) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return mapDetail(await response.json());
}

async function throwIfActionRefused(response: Response): Promise<void> {
  if (response.status === 409) {
    const body: {
      code?: string;
      currentStage?: string;
      message: string;
      offer?: OfferSummary;
    } = await response.json();
    if (body.code === "OFFER_REVISED" && body.offer) {
      throw new OfferRevised(body.message, body.offer);
    }
    throw new ApplicationActionRefused(
      body.message,
      body.currentStage ? stageLabel(body.currentStage) : "Offer",
    );
  }
}

// CO-06.1: fetches posting details, stage, finality warning and reason list before withdrawal
export async function requestWithdrawal(
  token: string,
  applicationId: number,
): Promise<WithdrawalPrompt> {
  const response = await backendFetch(`/api/applicant/applications/${applicationId}/withdrawal`, {
    headers: bearer(token),
  });
  endedSession(response);
  await throwIfActionRefused(response);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  const raw: Omit<WithdrawalPrompt, "applicationStatus"> & { applicationStatus: string } =
    await response.json();
  return { ...raw, applicationStatus: stageLabel(raw.applicationStatus) };
}

// CO-06.2: confirms withdrawal with an optional reason
export async function withdrawApplication(
  token: string,
  applicationId: number,
  reason?: string,
): Promise<WithdrawalResult> {
  const response = await backendFetch(`/api/applicant/applications/${applicationId}/withdraw`, {
    method: "POST",
    headers: { ...bearer(token), "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason?.trim() || null }),
  });
  endedSession(response);
  await throwIfActionRefused(response);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  const raw: {
    application: RawApplicationDetail;
    activeApplicationCount: number;
    applicationLimit: number;
  } = await response.json();
  return {
    application: mapDetail(raw.application),
    activeApplicationCount: raw.activeApplicationCount,
    applicationLimit: raw.applicationLimit,
  };
}

// CO-07.1: fetches offer details for an application at the Offer stage
export async function viewOffer(token: string, applicationId: number): Promise<OfferDetail> {
  const response = await backendFetch(`/api/applicant/applications/${applicationId}/offer`, {
    headers: bearer(token),
  });
  endedSession(response);
  await throwIfActionRefused(response);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

// CO-07.2: confirms final acceptance of an active offer
export async function acceptOffer(
  token: string,
  applicationId: number,
  expectedRevision: number,
): Promise<OfferResponseResult> {
  const response = await backendFetch(`/api/applicant/applications/${applicationId}/offer/accept`, {
    method: "POST",
    headers: { ...bearer(token), "Content-Type": "application/json" },
    body: JSON.stringify({ expectedRevision }),
  });
  endedSession(response);
  await throwIfActionRefused(response);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  const raw: {
    application: RawApplicationDetail;
    activeApplicationCount: number;
    applicationLimit: number;
  } = await response.json();
  return {
    application: mapDetail(raw.application),
    activeApplicationCount: raw.activeApplicationCount,
    applicationLimit: raw.applicationLimit,
  };
}

// CO-07.3: confirms final decline of an active offer with an optional reason
export async function declineOffer(
  token: string,
  applicationId: number,
  reason: string | undefined,
  expectedRevision: number,
): Promise<OfferResponseResult> {
  const response = await backendFetch(`/api/applicant/applications/${applicationId}/offer/decline`, {
    method: "POST",
    headers: { ...bearer(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      reason: reason?.trim() || null,
      expectedRevision,
    }),
  });
  endedSession(response);
  await throwIfActionRefused(response);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  const raw: {
    application: RawApplicationDetail;
    activeApplicationCount: number;
    applicationLimit: number;
  } = await response.json();
  return {
    application: mapDetail(raw.application),
    activeApplicationCount: raw.activeApplicationCount,
    applicationLimit: raw.applicationLimit,
  };
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

// UC-14 steps 1-2: the postings of the organization the recruiter acts for, with their applications per active stage
export type ActiveStage = "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER";

export type RecruiterPostingRow = {
  postingId: number;
  title: string;
  postStatus: string;
  closingReason: string | null;
  applicationsByStage: Record<ActiveStage, number>;
};

export type RecruiterPostings = {
  // Null when the recruiter acts for no organization
  organizationName: string | null;
  postings: RecruiterPostingRow[];
};

export async function viewRecruiterPostings(token: string): Promise<RecruiterPostings> {
  const response = await backendFetch("/api/recruiter/postings", { headers: bearer(token) });
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
  const normalized = utcDateTime.endsWith("Z") ? utcDateTime : `${utcDateTime}Z`;
  return new Date(normalized).toLocaleDateString("en-US", DATE_FORMAT);
}

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
};

export function formatDateTime(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleString("en-US", DATE_TIME_FORMAT);
}
