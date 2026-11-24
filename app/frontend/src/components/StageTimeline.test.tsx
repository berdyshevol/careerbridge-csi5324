import { render, screen } from "@testing-library/react";
import StageTimeline from "./StageTimeline";

describe("StageTimeline", () => {
  it("renders every stage entry and interview details under the Interview stage", () => {
    render(
      <StageTimeline
        entries={[
          { status: "Applied", date: "2026-10-01" },
          { status: "Screening", date: "2026-10-08" },
          { status: "Interview", date: "2026-10-15" },
        ]}
        interviews={[
          {
            interviewId: 1,
            roundNumber: 1,
            scheduledTime: "2026-10-21T14:00:00",
            format: "On-site",
            location: "1200 Austin Ave, Waco",
          },
        ]}
      />,
    );

    expect(screen.getByText("Applied")).toBeInTheDocument();
    expect(screen.getByText("Oct 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("Screening")).toBeInTheDocument();
    expect(screen.getByText("Interview")).toBeInTheDocument();
    expect(screen.getByText(/On-site, 1200 Austin Ave, Waco/)).toBeInTheDocument();
  });
});

