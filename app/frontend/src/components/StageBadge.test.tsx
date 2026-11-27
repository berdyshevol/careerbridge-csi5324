import { render, screen } from "@testing-library/react";
import { ALL_STAGES, STAGES } from "@/lib/stages";
import { StageBadge, StageProgress } from "./StageBadge";

describe("StageBadge", () => {
  it.each(ALL_STAGES)("renders the stage %s", (stage) => {
    render(<StageBadge stage={stage} />);

    expect(screen.getByText(stage)).toBeInTheDocument();
  });

  it("uses the base-100 surface for an Offer badge on a warning row", () => {
    render(<StageBadge stage="Offer" onWarning />);

    expect(screen.getByText("Offer")).toHaveClass("bg-base-100", "text-warning-content");
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
