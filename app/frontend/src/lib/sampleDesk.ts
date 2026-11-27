// SAMPLE DATA that only fills /styleguide; eslint keeps it out of every other file. The
// screens read applications, offers and the application limit from the backend (src/lib/api.ts).

import type { DeskApplication } from "./api";

export const APPLICATION_LIMIT = 5;

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
