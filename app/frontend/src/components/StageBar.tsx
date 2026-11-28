"use client";

import { type Stage } from "@/lib/stages";

// The active stages as one row of counts that also picks the stage to list below it. It scrolls
// sideways at phone width instead of squeezing the four stages.
export default function StageBar({
  counts,
  selected,
  onSelect,
}: {
  counts: Record<Stage, number>;
  selected: Stage;
  // Left out where the bar only shows counts, as on /styleguide
  onSelect?: (stage: Stage) => void;
}) {
  return (
    <div className="overflow-x-auto pb-0.5">
      <nav aria-label="Stages" className="grid min-w-[520px] grid-cols-4 gap-2">
        {(Object.keys(counts) as Stage[]).map((stage) => (
          <button
            key={stage}
            type="button"
            aria-current={stage === selected ? "true" : undefined}
            onClick={() => onSelect?.(stage)}
            className={`flex cursor-pointer flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-sm ${
              stage === selected
                ? "border-primary bg-secondary text-secondary-content"
                : "border-base-300 bg-base-100 text-muted"
            }`}
          >
            <b className="font-display text-xl font-semibold text-base-content">{counts[stage]}</b>
            {stage}
          </button>
        ))}
      </nav>
    </div>
  );
}
