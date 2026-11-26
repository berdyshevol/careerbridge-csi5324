import { STAGES, type ApplicationStage, type Stage } from "@/lib/sampleDesk";
import { TONES } from "./statusTones";

const chipStyle: Record<ApplicationStage, string> = {
  Applied: TONES.neutral,
  Screening: TONES.good,
  Interview: TONES.good,
  Offer: TONES.attention,
  Hired: TONES.good,
  Rejected: TONES.bad,
  Withdrawn: TONES.ended,
  "Offer Declined": TONES.ended,
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
      className={`pill ${tone} ${className}`}
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
