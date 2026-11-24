import { render, screen } from "@testing-library/react";
import ApplicationRow, { type ApplicationRowItem } from "./ApplicationRow";

const base: ApplicationRowItem = {
  applicationId: 12,
  title: "Backend Developer",
  organizationName: "Brazos Analytics",
  applicationStatus: "Interview",
  dateApplied: "2026-10-06",
  lastStageChangeDate: "2026-10-22",
};

function renderRow(application: ApplicationRowItem) {
  return render(
    <ul>
      <ApplicationRow application={application} />
    </ul>,
  );
}

describe("ApplicationRow", () => {
  it("shows the posting, organization, dates and current stage", () => {
    renderRow(base);

    expect(screen.getByText("Backend Developer")).toBeInTheDocument();
    expect(screen.getByText(/Brazos Analytics · Applied Oct 6, 2026 · last change Oct 22, 2026/)).toBeInTheDocument();
    expect(screen.getByText("Interview")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "/applications/12");
  });

  it("highlights an Offer row and offers Review offer linking to the application page", () => {
    renderRow({ ...base, applicationId: 7, applicationStatus: "Offer" });

    expect(screen.getByRole("listitem")).toHaveClass("bg-warning");
    expect(screen.getByRole("link", { name: "Review offer" })).toHaveAttribute("href", "/applications/7");
  });

  it("renders closed stages with a View link to the application page", () => {
    renderRow({ ...base, applicationId: 9, applicationStatus: "Rejected" });

    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "/applications/9");
  });
});
