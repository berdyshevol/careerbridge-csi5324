// The recruiter's form (UC-11) and the job board's filters (UC-01) offer the same values,
// so a filter always finds what a recruiter could enter.
export const LOCATIONS = ["On-site", "Hybrid", "Remote"] as const;

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Temporary"] as const;
