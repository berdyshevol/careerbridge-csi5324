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

export type ApplicationResponse = {
  applicationId: number;
  jobPostId: number;
  jobTitle: string;
  organizationName: string;
  dateApplied: string;
  applicationStatus: string;
  resumeFileName?: string | null;
  activeApplicationCount: number;
};

// Its message is the backend's reason, written for the recruiter
export class PostingRejected extends Error {}

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
  // Only a refusal in plain text is a reason for the recruiter; any other body
  // is the server's own error report and must not reach the screen.
  const refused = response.status === 400 || response.status === 403;
  if (refused && response.headers.get("Content-Type")?.startsWith("text/plain")) {
    throw new PostingRejected(await response.text());
  }
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function submitApplicationApi(
  postingId: number | string,
  resumeFileName?: string,
  applicantId?: number
): Promise<ApplicationResponse> {
  const response = await backendFetch(`/api/postings/${encodeURIComponent(postingId)}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      applicantId: applicantId,
      resumeFileName: resumeFileName ?? "resume.pdf",
      resumeFileType: "application/pdf",
      resumeFileSize: 1024,
    }),
  });
  if (!response.ok) {
    throw new Error(`Application failed with status ${response.status}`);
  }
  return response.json();
}

export async function getActiveCountApi(applicantId?: number): Promise<{ activeCount: number; limit: number }> {
  const query = applicantId ? `?applicantId=${encodeURIComponent(applicantId)}` : "";
  const response = await backendFetch(`/api/applications/active-count${query}`);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function checkAppliedApi(
  postingId: number | string,
  applicantId?: number
): Promise<{ applied: boolean }> {
  const query = applicantId ? `?applicantId=${encodeURIComponent(applicantId)}` : "";
  const response = await backendFetch(`/api/postings/${encodeURIComponent(postingId)}/applied${query}`);
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
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
