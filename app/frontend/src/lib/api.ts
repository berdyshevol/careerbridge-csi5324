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

export type ApplicationStatusCode =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN"
  | "OFFER_DECLINED";

export type OfferStatusCode = "EXTENDED" | "ACCEPTED" | "DECLINED" | "RESCINDED";

export type ApplicationSummary = {
  applicationId: number;
  postingId: number;
  title: string;
  organizationName: string;
  location: string;
  employmentType: string;
  dateApplied: string;
  applicationStatus: ApplicationStatusCode;
  lastUpdatedDate: string;
  active: boolean;
};

export type ApplicationList = {
  applications: ApplicationSummary[];
  activeApplicationCount: number;
};

export type StatusHistoryEntry = {
  status: ApplicationStatusCode;
  date: string;
  reason: string | null;
};

export type InterviewSummary = {
  interviewId: number;
  scheduledTime: string;
  format: string | null;
  location: string | null;
};

export type JobOffer = {
  offerId: number;
  applicationId: number;
  postingId: number;
  title: string;
  organizationName: string;
  location: string;
  employmentType: string;
  applicationStatus: ApplicationStatusCode;
  dateExtended: string;
  expirationDate: string;
  startDate: string | null;
  salary: string;
  terms: string | null;
  status: OfferStatusCode;
  responseDate: string | null;
  open: boolean;
};

export type ApplicationDetail = {
  applicationId: number;
  postingId: number;
  title: string;
  organizationName: string;
  location: string;
  employmentType: string;
  dateApplied: string;
  applicationStatus: ApplicationStatusCode;
  lastUpdatedDate: string;
  rejectionReason: string | null;
  rejectedAtStage: ApplicationStatusCode | null;
  rejectionDate: string | null;
  withdrawnAt: string | null;
  withdrawalReason: string | null;
  statusHistory: StatusHistoryEntry[];
  interviews: InterviewSummary[];
  offer: JobOffer | null;
  availableActions: string[];
  activeApplicationCount: number;
};

export type WithdrawalRequest = {
  applicationId: number;
  postingId: number;
  title: string;
  organizationName: string;
  applicationStatus: ApplicationStatusCode;
  warning: string;
};

export type OfferDecision = {
  applicationId: number;
  applicationStatus: ApplicationStatusCode;
  offerStatus: OfferStatusCode;
  responseDate: string;
  postingClosed: boolean;
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

export async function searchPostings(keyword?: string): Promise<JobPosting[]> {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
  const response = await backendFetch(`/api/postings${query}`);
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

export async function viewApplications(): Promise<ApplicationList> {
  const response = await backendFetch("/api/applications");
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function viewApplication(applicationId: number): Promise<ApplicationDetail | null> {
  const response = await backendFetch(`/api/applications/${encodeURIComponent(String(applicationId))}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function requestWithdrawal(applicationId: number): Promise<WithdrawalRequest> {
  const response = await backendFetch(
    `/api/applications/${encodeURIComponent(String(applicationId))}/withdrawal`,
  );
  const reason = await refusal(response);
  if (reason !== null) {
    throw new ApplicationRefused(reason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function withdrawApplication(
  applicationId: number,
  reason?: string | null,
): Promise<ApplicationDetail> {
  const trimmed = reason?.trim() ? reason.trim() : null;
  const response = await backendFetch(
    `/api/applications/${encodeURIComponent(String(applicationId))}/withdraw`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: trimmed }),
    },
  );
  const refusedReason = await refusal(response);
  if (refusedReason !== null) {
    throw new ApplicationRefused(refusedReason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function viewOffer(applicationId: number): Promise<JobOffer | null> {
  const response = await backendFetch(
    `/api/applications/${encodeURIComponent(String(applicationId))}/offer`,
  );
  if (response.status === 404) {
    return null;
  }
  const refusedReason = await refusal(response);
  if (refusedReason !== null) {
    throw new ApplicationRefused(refusedReason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function acceptOffer(
  applicationId: number,
  expected?: { expectedSalary?: string; expectedExpirationDate?: string },
): Promise<OfferDecision> {
  const response = await backendFetch(
    `/api/applications/${encodeURIComponent(String(applicationId))}/offer/accept`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expected ?? {}),
    },
  );
  const refusedReason = await refusal(response);
  if (refusedReason !== null) {
    throw new ApplicationRefused(refusedReason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function declineOffer(
  applicationId: number,
  reason?: string | null,
): Promise<OfferDecision> {
  const trimmed = reason?.trim() ? reason.trim() : null;
  const response = await backendFetch(
    `/api/applications/${encodeURIComponent(String(applicationId))}/offer/decline`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: trimmed }),
    },
  );
  const refusedReason = await refusal(response);
  if (refusedReason !== null) {
    throw new ApplicationRefused(refusedReason);
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
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
  const today = new Date().toISOString().slice(0, 10);
  return posting.postStatus === "PUBLISHED" && posting.applicationDeadline >= today;
}

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(isoDateTime: string): string {
  const normalized = isoDateTime.includes("Z") || isoDateTime.includes("+")
    ? isoDateTime
    : `${isoDateTime}`;
  return new Date(normalized).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STAGE_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  OFFER_DECLINED: "Offer Declined",
  Applied: "Applied",
  Screening: "Screening",
  Interview: "Interview",
  Offer: "Offer",
  Hired: "Hired",
  Rejected: "Rejected",
  Withdrawn: "Withdrawn",
  "Offer Declined": "Offer Declined",
};

export function formatStage(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}
