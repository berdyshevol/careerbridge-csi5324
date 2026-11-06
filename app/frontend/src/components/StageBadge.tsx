import { formatStage } from "@/lib/api";
import { STAGES, type Stage } from "@/lib/sampleDesk";

export type AnyStage =
  | Stage
  | "Hired"
  | "Rejected"
  | "Withdrawn"
  | "Offer Declined"
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN"
  | "OFFER_DECLINED";

const chipStyle: Record<string, string> = {
  Applied: "bg-base-200 text-base-content",
  Screening: "bg-secondary text-secondary-content",
  Interview: "bg-secondary text-secondary-content",
  Offer: "bg-warning text-warning-content",
  Hired: "bg-primary text-primary-content",
  Rejected: "bg-base-200 text-base-content",
  Withdrawn: "bg-base-200 text-base-content",
  "Offer Declined": "bg-base-200 text-base-content",
};

export function StageBadge({ stage, className = "" }: { stage: AnyStage; className?: string }) {
  const label = formatStage(stage);
  const style = chipStyle[label] ?? "bg-base-200 text-base-content";
  return (
    <span
      className={`rounded-lg px-2.5 py-1 text-center text-sm font-semibold ${style} ${className}`}
    >
      {label}
    </span>
  );
}

export function StageProgress({ stage, className = "" }: { stage: AnyStage; className?: string }) {
  const label = formatStage(stage);
  const stageIndex = STAGES.indexOf(label as Stage);
  const stageNumber = label === "Hired" ? STAGES.length : stageIndex >= 0 ? stageIndex + 1 : 0;
  return (
    <div
      role="img"
      aria-label={`Stage ${stageNumber} of ${STAGES.length}`}
      className={`flex gap-1 ${className}`}
    >
      {STAGES.map((name, index) => (
        <span
          key={name}
          className={`h-1.5 grow rounded-full ${index < stageNumber ? "bg-primary" : "bg-base-300"}`}
        />
      ))}
    </div>
  );
}
