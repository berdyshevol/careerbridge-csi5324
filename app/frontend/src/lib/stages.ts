// The stages of an application (domain model, ApplicationStatus) as the screens name them.
// The first four are active and count toward the applicant's limit (BR-4).
export const STAGES = ["Applied", "Screening", "Interview", "Offer"] as const;
export type Stage = (typeof STAGES)[number];

const CLOSED_STAGES = ["Hired", "Rejected", "Withdrawn", "Offer Declined"] as const;
export const ALL_STAGES = [...STAGES, ...CLOSED_STAGES] as const;
export type ApplicationStage = (typeof ALL_STAGES)[number];
