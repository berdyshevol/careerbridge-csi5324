// SAMPLE DATA for the applicant desk. The backend cannot answer these yet:
// applications come with UC-05, the offer with UC-07, the resume with UC-03
// and the logged-in applicant with Log In. Replace each piece with an API
// call in src/lib/api.ts when its use case is implemented.

export const STAGES = ["Applied", "Screening", "Interview", "Offer"] as const;
export type Stage = (typeof STAGES)[number];

export const APPLICATION_LIMIT = 5;

export const applicant = {
  firstName: "Jordan",
  lastName: "Lee",
  email: "jordan.lee@example.com",
  phone: "(254) 555-0142",
};

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

export type DeskResume = { fileName: string; uploadDate: string };

export const resume: DeskResume | null = { fileName: "Jordan_Lee_Resume.pdf", uploadDate: "2026-09-30" };
