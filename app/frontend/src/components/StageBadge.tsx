import { STAGES, type ApplicationStage, type Stage } from "@/lib/sampleDesk";

const chipStyle: Record<ApplicationStage, string> = {
  Applied: "bg-base-200 text-base-content",
  Screening: "bg-secondary text-secondary-content",
  Interview: "bg-secondary text-secondary-content",
  Offer: "bg-warning text-warning-content",
  Hired: "bg-secondary text-secondary-content",
  Rejected: "bg-error/15 text-error",
  Withdrawn: "border border-base-300 bg-transparent text-muted",
  "Offer Declined": "border border-base-300 bg-transparent text-muted",
};

export function StageBadge({
  stage,
  onWarning = false,
  className = "",
}: {
  stage: ApplicationStage;
  onWarning?: boolean;
  className?: string;
}) {
  const tone = onWarning ? "bg-base-100 text-warning-content" : chipStyle[stage];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-center text-sm font-semibold whitespace-nowrap ${tone} ${className}`}
    >
      {stage}
    </span>
  );
}

export function StageProgress({ stage, className = "" }: { stage: Stage; className?: string }) {
  const stageNumber = STAGES.indexOf(stage) + 1;
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
