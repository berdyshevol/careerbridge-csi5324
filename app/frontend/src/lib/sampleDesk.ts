// SAMPLE DATA for the applicant desk. The backend cannot answer these yet:
// the offer comes with UC-07 and the resume with UC-03. Replace each piece with
// an API call in src/lib/api.ts when its use case is implemented. The screens read the applications from
// viewApplications; `applications` below only fills /styleguide.

import type { ResumeOnFile } from "./api";

export const STAGES = ["Applied", "Screening", "Interview", "Offer"] as const;
export type Stage = (typeof STAGES)[number];

export const APPLICATION_LIMIT = 5;

export type DeskApplication = {
  applicationId: number;
  postingId: number; // jobPostId of the posting applied to
  title: string;
  organizationName: string;
  location: string;
  employmentType: string;
  applicationStatus: Stage;
};

export const applications: DeskApplication[] = [
  {
    applicationId: 1,
    postingId: 4,
    title: "IT Support Specialist",
    organizationName: "Waco Health Partners",
    location: "On-site",
    employmentType: "Part-time",
    applicationStatus: "Offer",
  },
  {
    applicationId: 2,
    postingId: 3,
    title: "Backend Developer",
    organizationName: "Brazos Analytics",
    location: "Remote",
    employmentType: "Full-time",
    applicationStatus: "Interview",
  },
  {
    applicationId: 3,
    postingId: 1,
    title: "Junior Software Engineer",
    organizationName: "Brazos Analytics",
    location: "Hybrid",
    employmentType: "Full-time",
    applicationStatus: "Applied",
  },
];

export const offer = {
  title: "IT Support Specialist",
  organizationName: "Waco Health Partners",
  expirationDate: "2026-10-16",
};

export type DeskResume = ResumeOnFile & { uploadDate: string };

// The backend's sample applications (data/applications.csv) belong to this same applicant.
export const resume: DeskResume | null = {
  fileName: "Jordan_Lee_Resume.pdf",
  fileType: "application/pdf",
  fileSize: 184_320,
  uploadDate: "2026-09-30",
};
