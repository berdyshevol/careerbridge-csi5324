export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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

export async function searchPostings(keyword?: string): Promise<JobPosting[]> {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
  const response = await fetch(`${API_URL}/api/postings${query}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Backend answered ${response.status}`);
  }
  return response.json();
}

export async function viewPosting(postingId: string): Promise<JobPosting | null> {
  const response = await fetch(`${API_URL}/api/postings/${encodeURIComponent(postingId)}`, {
    cache: "no-store",
  });
  if (response.status === 404 || response.status === 400) {
    return null;
  }
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
