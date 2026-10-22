import { render, screen } from "@testing-library/react";
import type { JobPosting } from "@/lib/api";
import PostingCard from "./PostingCard";

const posting: JobPosting = {
  jobPostId: 3,
  title: "Backend Developer",
  description: "",
  jobRequirements: "",
  location: "Remote",
  employmentType: "Full-time",
  salaryRange: null,
  numberOfOpenings: 1,
  datePosted: "2026-10-05",
  applicationDeadline: "2026-12-31",
  postStatus: "PUBLISHED",
  organization: { organizationId: 1, name: "Brazos Analytics" },
};

describe("PostingCard", () => {
  it("shows what UC-01 step 2 lists: title, organization, location, employment type and deadline", () => {
    render(<PostingCard posting={posting} />);

    expect(screen.getByRole("link", { name: "Backend Developer" })).toHaveAttribute("href", "/jobs/3");
    expect(screen.getByText("Brazos Analytics · Remote · Full-time")).toBeInTheDocument();
    expect(screen.getByText("Apply by Dec 31, 2026")).toBeInTheDocument();
  });
});
