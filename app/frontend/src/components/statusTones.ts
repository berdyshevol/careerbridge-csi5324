// The colors of a status pill, shared so a status reads the same on every screen (ADR-0004)
export const TONES = {
  neutral: "bg-base-200 text-base-content",
  good: "bg-secondary text-secondary-content",
  attention: "bg-warning text-warning-content",
  bad: "bg-error/15 text-error",
  ended: "border border-base-300 bg-transparent text-muted",
} as const;
