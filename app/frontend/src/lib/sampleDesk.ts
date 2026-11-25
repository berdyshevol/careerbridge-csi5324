// SAMPLE DATA for the applicant desk. The backend cannot answer the offer yet: it comes
// with UC-07; replace it with an API call in src/lib/api.ts then. The screens read the
// applications from viewApplications; `applications` below only fills /styleguide.

export const STAGES = ["Applied", "Screening", "Interview", "Offer"] as const;
export type Stage = (typeof STAGES)[number];

const CLOSED_STAGES = ["Hired", "Rejected", "Withdrawn", "Offer Declined"] as const;
export const ALL_STAGES = [...STAGES, ...CLOSED_STAGES] as const;
export type ApplicationStage = (typeof ALL_STAGES)[number];

export const APPLICATION_LIMIT = 5;

export type DeskApplication = {
  applicationId: number;
  postingId: number; // jobPostId of the posting applied to
  title: string;
  organizationName: string;
  location: string;
  employmentType: string;
  applicationStatus: Stage;
  dateApplied?: string;
  lastStageChangeDate?: string;
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
    dateApplied: "2026-09-22",
    lastStageChangeDate: "2026-10-08",
  },
  {
    applicationId: 2,
    postingId: 3,
    title: "Backend Developer",
    organizationName: "Brazos Analytics",
    location: "Remote",
    employmentType: "Full-time",
    applicationStatus: "Interview",
    dateApplied: "2026-09-29",
    lastStageChangeDate: "2026-10-05",
  },
  {
    applicationId: 3,
    postingId: 1,
    title: "Junior Software Engineer",
    organizationName: "Brazos Analytics",
    location: "Hybrid",
    employmentType: "Full-time",
    applicationStatus: "Applied",
    dateApplied: "2026-10-02",
    lastStageChangeDate: "2026-10-02",
  },
];

export const offer = {
  title: "IT Support Specialist",
  organizationName: "Waco Health Partners",
  expirationDate: "2026-10-16",
};
