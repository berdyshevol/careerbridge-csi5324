import { render, screen } from "@testing-library/react";
import { STAGES } from "@/lib/sampleDesk";
import { StageBadge, StageProgress } from "./StageBadge";

describe("StageBadge", () => {
  it.each(STAGES)("renders the stage %s", (stage) => {
    render(<StageBadge stage={stage} />);

    expect(screen.getByText(stage)).toBeInTheDocument();
  });
});

describe("StageProgress", () => {
  it.each(STAGES.map((stage, index) => [stage, index + 1]))(
    "says how far along %s is",
    (stage, number) => {
      render(<StageProgress stage={stage} />);

      expect(screen.getByRole("img", { name: `Stage ${number} of ${STAGES.length}` })).toBeInTheDocument();
    },
  );
});
