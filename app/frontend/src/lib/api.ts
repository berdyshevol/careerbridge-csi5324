
import { STAGES, type DeskApplication } from "./sampleDesk";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// Render's free plan takes minutes to wake a sleeping backend. Without a limit
// the page would hang that long; with one it can say so and try again.
export const BACKEND_TIMEOUT_MS = 8000;

export type Organization = {
  organizationId: number;
  name: string;
  timeZone?: string;
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

export type ResumeOnFile = {
  fileName: string;
  fileType: string;
  fileSize: number;
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

function backendFetch(path: string, init?: Omit<RequestInit, "signal">): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
  });
}

// In the order the form shows them, which is also the order of the clean address
const SEARCH_CRITERIA = ["keyword", "location", "organization", "employmentType"] as const;

export type PostingSearchCriteria = Partial<Record<(typeof SEARCH_CRITERIA)[number], string>>;

export type PageQuery = Record<string, string | string[] | undefined>;

// A hand-edited link can repeat a key, and Next.js then hands over an array;
// the search knows one value per criterion, so it takes the first.
export function searchCriteria(query: PageQuery): PostingSearchCriteria {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  return Object.fromEntries(SEARCH_CRITERIA.map((name) => [name, first(query[name])]));
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

export async function createPosting(posting: NewPosting): Promise<JobPosting> {
  const response = await backendFetch("/api/postings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(posting),
  });
  const reason = await refusal(response);
  if (reason !== null) {
    throw new PostingRejected(reason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function submitApplication(
    postingId: number,
    resume: ResumeOnFile | null,
): Promise<SubmittedApplication> {
  const body = resume
      ? { resumeFileName: resume.fileName, resumeFileType: resume.fileType, resumeFileSize: resume.fileSize }
      : {};

  const response = await backendFetch(`/api/postings/${postingId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const reason = await refusal(response);
  if (reason !== null) {
    throw new ApplicationRefused(reason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

// CO-05.1. An ended application still blocks its posting (A5), so the ids of
// every posting applied to come back next to the active applications.
export type Applications = { active: DeskApplication[]; appliedPostingIds: number[] };

export async function viewApplications(): Promise<Applications> {
  const response = await backendFetch("/api/applicant/applications");
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

// Only a refusal in plain text is a reason for the user; any other body is the
// server's own error report and must not reach the screen.
async function refusal(response: Response): Promise<string | null> {
  const refused = response.status === 400 || response.status === 403;
  if (refused && response.headers.get("Content-Type")?.startsWith("text/plain")) {
    return response.text();
  }
  return null;
}

export function isOpen(posting: JobPosting): boolean {
  if (posting.postStatus !== "PUBLISHED" || !posting.applicationDeadline) {
    return false;
  }

  // UC-13: The deadline is inclusive in the organization's local calendar.
  // UTC is the default for organizations created before time zones were added.
  const timeZone = posting.organization?.timeZone ?? "UTC";

  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = dateParts.find((part) => part.type === "year")?.value;
  const month = dateParts.find((part) => part.type === "month")?.value;
  const day = dateParts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return false;
  }

  const organizationToday = `${year}-${month}-${day}`;

  return posting.applicationDeadline >= organizationToday;
}

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
