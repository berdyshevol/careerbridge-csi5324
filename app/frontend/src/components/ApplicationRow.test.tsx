import { render, screen } from "@testing-library/react";
import type { DeskApplication } from "@/lib/sampleDesk";
import ApplicationRow from "./ApplicationRow";

const base: DeskApplication = {
  applicationId: 1,
  title: "Backend Developer",
  organizationName: "Brazos Analytics",
  location: "Remote",
  employmentType: "Full-time",
  applicationStatus: "Interview",
};

function renderRow(application: DeskApplication) {
  return render(
    <ul>
      <ApplicationRow application={application} />
    </ul>,
  );
}

describe("ApplicationRow", () => {
  it("shows the posting, the stage and how far along it is", () => {
    renderRow(base);

    expect(screen.getByText("Backend Developer")).toBeInTheDocument();
    expect(screen.getByText("Interview")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Stage 3 of 4" })).toBeInTheDocument();
  });

  it("links an application at the Offer stage to the offers screen", () => {
    renderRow({ ...base, applicationStatus: "Offer" });

    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute("href", "/offers");
  });

  it("links any other application to the tracking screen", () => {
    renderRow({ ...base, applicationStatus: "Applied" });

    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "/applications");
  });
});
