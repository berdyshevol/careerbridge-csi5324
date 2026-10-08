import { STAGES, type Stage } from "@/lib/sampleDesk";

const chipStyle: Record<Stage, string> = {
  Applied: "bg-base-200 text-base-content",
  Screening: "bg-secondary text-secondary-content",
  Interview: "bg-secondary text-secondary-content",
  Offer: "bg-warning text-warning-content",
};

// The stage of an application as a chip (documentation, Figure 3).
export function StageBadge({ stage, className = "" }: { stage: Stage; className?: string }) {
  return (
    <span
      className={`rounded-lg px-2.5 py-1 text-center text-sm font-semibold ${chipStyle[stage]} ${className}`}
    >
      {stage}
    </span>
  );
}

// How far along the pipeline an application is: one segment per stage.
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
